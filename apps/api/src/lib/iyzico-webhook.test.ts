import { describe, expect, test } from "bun:test";
import {
  buildIyzicoSubscriptionWebhookMessage,
  computeIyzicoSubscriptionWebhookSignature,
  verifyIyzicoSubscriptionWebhookSignature,
} from "./iyzico-webhook.ts";

describe("iyzico webhook helpers", () => {
  test("builds webhook signature source message", () => {
    const message = buildIyzicoSubscriptionWebhookMessage({
      merchantId: "merchant-id",
      secretKey: "secret-key",
      eventType: "subscription.order.success",
      subscriptionReferenceCode: "sub-ref",
      orderReferenceCode: "order-ref",
      customerReferenceCode: "customer-ref",
    });

    expect(message).toBe(
      "merchant-idsecret-keysubscription.order.successsub-reforder-refcustomer-ref",
    );
  });

  test("verifies signature with iyziEventType payload shape", () => {
    const merchantId = "merchant-id";
    const secretKey = "secret-key";
    const payload = {
      iyziEventType: "subscription.order.success",
      subscriptionReferenceCode: "sub-ref",
      orderReferenceCode: "order-ref",
      customerReferenceCode: "customer-ref",
    };

    const signature = computeIyzicoSubscriptionWebhookSignature({
      merchantId,
      secretKey,
      payload,
    });

    expect(
      verifyIyzicoSubscriptionWebhookSignature({
        merchantId,
        secretKey,
        payload,
        signature,
      }),
    ).toBe(true);
  });

  test("fails verification for invalid signature", () => {
    expect(
      verifyIyzicoSubscriptionWebhookSignature({
        merchantId: "merchant-id",
        secretKey: "secret-key",
        payload: {
          iyziEventType: "subscription.order.failure",
          subscriptionReferenceCode: "sub-ref",
          orderReferenceCode: "order-ref",
          customerReferenceCode: "customer-ref",
        },
        signature: "invalid",
      }),
    ).toBe(false);
  });
});
