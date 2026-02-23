import { createHmac, timingSafeEqual } from "node:crypto";

export type IyzicoSubscriptionWebhookPayload = {
  merchantId?: string | null;
  eventType?: string | null;
  iyziEventType?: string | null;
  subscriptionReferenceCode?: string | null;
  orderReferenceCode?: string | null;
  customerReferenceCode?: string | null;
  iyziReferenceCode?: string | null;
  iyziEventTime?: number | null;
};

const normalizeHex = (value: string) => value.trim().toLowerCase();

export const buildIyzicoSubscriptionWebhookMessage = ({
  merchantId,
  secretKey,
  eventType,
  subscriptionReferenceCode,
  orderReferenceCode,
  customerReferenceCode,
}: {
  merchantId: string;
  secretKey: string;
  eventType: string;
  subscriptionReferenceCode: string;
  orderReferenceCode: string;
  customerReferenceCode: string;
}) =>
  merchantId +
  secretKey +
  eventType +
  subscriptionReferenceCode +
  orderReferenceCode +
  customerReferenceCode;

export const computeIyzicoSubscriptionWebhookSignature = ({
  merchantId,
  secretKey,
  payload,
}: {
  merchantId: string;
  secretKey: string;
  payload: IyzicoSubscriptionWebhookPayload;
}) => {
  const eventType = payload.iyziEventType || payload.eventType || "";
  const subscriptionReferenceCode = payload.subscriptionReferenceCode || "";
  const orderReferenceCode = payload.orderReferenceCode || "";
  const customerReferenceCode = payload.customerReferenceCode || "";

  const message = buildIyzicoSubscriptionWebhookMessage({
    merchantId,
    secretKey,
    eventType,
    subscriptionReferenceCode,
    orderReferenceCode,
    customerReferenceCode,
  });

  return createHmac("sha256", secretKey).update(message).digest("hex");
};

export const verifyIyzicoSubscriptionWebhookSignature = ({
  merchantId,
  secretKey,
  payload,
  signature,
}: {
  merchantId: string;
  secretKey: string;
  payload: IyzicoSubscriptionWebhookPayload;
  signature: string;
}) => {
  if (!signature?.trim()) {
    return false;
  }

  const expectedHex = normalizeHex(
    computeIyzicoSubscriptionWebhookSignature({
      merchantId,
      secretKey,
      payload,
    }),
  );
  const receivedHex = normalizeHex(signature);

  if (expectedHex.length !== receivedHex.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(expectedHex), Buffer.from(receivedHex));
};
