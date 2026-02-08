const LOCAL_API_ORIGIN = "http://localhost:3002";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export function getApiBaseUrl(req?: Request): string {
  const configured =
    process.env.API_PUBLIC_URL ||
    process.env.BETTER_AUTH_URL ||
    process.env.API_URL;

  if (configured && configured.trim()) {
    return trimTrailingSlash(configured.trim());
  }

  if (req) {
    const forwardedProto = req.headers.get("x-forwarded-proto");
    const forwardedHost = req.headers.get("x-forwarded-host");
    const host = forwardedHost || req.headers.get("host");
    if (host) {
      let requestProtocol: string | null = null;
      try {
        requestProtocol = new URL(req.url).protocol.replace(":", "");
      } catch {
        requestProtocol = null;
      }
      const protocol = forwardedProto || requestProtocol || "https";
      return `${protocol}://${host}`;
    }

    try {
      return new URL(req.url).origin;
    } catch {
      // ignore and use fallback
    }
  }

  return LOCAL_API_ORIGIN;
}

export function toPublicUploadUrl(
  filenameOrPath: string,
  req?: Request,
): string {
  const base = getApiBaseUrl(req);
  if (
    filenameOrPath.startsWith("http://") ||
    filenameOrPath.startsWith("https://")
  ) {
    return filenameOrPath;
  }
  if (filenameOrPath.startsWith("/uploads/")) {
    return `${base}${filenameOrPath}`;
  }
  if (filenameOrPath.startsWith("/")) {
    return `${base}/uploads${filenameOrPath}`;
  }
  return `${base}/uploads/${filenameOrPath}`;
}
