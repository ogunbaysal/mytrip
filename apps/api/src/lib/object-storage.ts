import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

type ObjectStorageConfig = {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
  publicBaseUrl?: string;
};

const DEFAULT_REGION = "us-east-1";

let cachedConfigSignature = "";
let cachedClient: S3Client | null = null;

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

function encodeKeyForUrl(key: string): string {
  return key
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} environment variable is required`);
  }
  return value;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

function getObjectStorageConfig(): ObjectStorageConfig {
  const endpoint = trimTrailingSlash(getRequiredEnv("MINIO_ENDPOINT"));
  const bucket = getRequiredEnv("MINIO_BUCKET");
  const accessKeyId = getRequiredEnv("MINIO_ACCESS_KEY");
  const secretAccessKey = getRequiredEnv("MINIO_SECRET_KEY");
  const region = process.env.MINIO_REGION?.trim() || DEFAULT_REGION;
  const forcePathStyle = parseBoolean(process.env.MINIO_FORCE_PATH_STYLE, true);
  const publicBaseUrl = process.env.MINIO_PUBLIC_BASE_URL?.trim()
    ? trimTrailingSlash(process.env.MINIO_PUBLIC_BASE_URL.trim())
    : undefined;

  return {
    endpoint,
    region,
    bucket,
    accessKeyId,
    secretAccessKey,
    forcePathStyle,
    publicBaseUrl,
  };
}

function getClient(config: ObjectStorageConfig): S3Client {
  const signature = JSON.stringify({
    endpoint: config.endpoint,
    region: config.region,
    accessKeyId: config.accessKeyId,
    bucket: config.bucket,
    forcePathStyle: config.forcePathStyle,
  });

  if (cachedClient && cachedConfigSignature === signature) {
    return cachedClient;
  }

  cachedConfigSignature = signature;
  cachedClient = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: config.forcePathStyle,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return cachedClient;
}

const mimeExtensionMap: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
};

function resolveExtension(filename: string | undefined, mimeType: string): string {
  const byMime = mimeExtensionMap[mimeType];
  if (byMime) return byMime;

  const fromName = filename?.split(".").pop()?.trim().toLowerCase();
  if (fromName && /^[a-z0-9]{1,10}$/.test(fromName)) {
    return fromName;
  }

  return "bin";
}

function sanitizeUsage(usage: string | undefined): string {
  const normalized = (usage || "other")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized || "other";
}

export function buildObjectKey(params: {
  usage?: string;
  filename?: string;
  mimeType: string;
  now?: Date;
}): string {
  const now = params.now ?? new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const extension = resolveExtension(params.filename, params.mimeType);
  const usage = sanitizeUsage(params.usage);

  return `${usage}/${year}/${month}/${uuidv4()}.${extension}`;
}

export function buildPublicObjectUrl(key: string): string {
  const config = getObjectStorageConfig();
  const encodedKey = encodeKeyForUrl(key);

  if (config.publicBaseUrl) {
    return `${config.publicBaseUrl}/${encodedKey}`;
  }

  if (config.forcePathStyle) {
    return `${config.endpoint}/${config.bucket}/${encodedKey}`;
  }

  const endpoint = new URL(config.endpoint);
  endpoint.hostname = `${config.bucket}.${endpoint.hostname}`;
  endpoint.pathname = `/${encodedKey}`;
  return endpoint.toString();
}

export async function uploadToObjectStorage(params: {
  data: Uint8Array;
  mimeType: string;
  usage?: string;
  filename?: string;
}): Promise<{ key: string; url: string }> {
  const config = getObjectStorageConfig();
  const client = getClient(config);
  const key = buildObjectKey({
    usage: params.usage,
    filename: params.filename,
    mimeType: params.mimeType,
  });

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: params.data,
      ContentType: params.mimeType,
    }),
  );

  return {
    key,
    url: buildPublicObjectUrl(key),
  };
}

