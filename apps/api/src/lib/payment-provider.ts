import { createHmac, randomBytes } from "node:crypto";

type BillingCycle = "monthly" | "quarterly" | "yearly";
type SupportedCurrency = "TRY" | "USD" | "EUR";

export interface IyzicoAddress {
  address: string;
  zipCode: string;
  contactName: string;
  city: string;
  country: string;
  district: string;
}

export interface IyzicoCustomer {
  name: string;
  surname: string;
  identityNumber: string;
  email: string;
  gsmNumber: string;
  billingAddress: IyzicoAddress;
  shippingAddress: IyzicoAddress;
}

export interface IyzicoPaymentCard {
  cardHolderName: string;
  cardNumber: string;
  expireMonth: string;
  expireYear: string;
  cvc: string;
  cardUserKey?: string;
  cardToken?: string;
  ucsToken?: string;
  consumerToken?: string;
  registerConsumerCard?: boolean;
}

export interface CreateSubscriptionParams {
  userId: string;
  planId: string;
  price: number;
  currency: SupportedCurrency;
  billingCycle: BillingCycle;
  paymentCard?: IyzicoPaymentCard;
  customer: IyzicoCustomer;
  conversationId?: string;
}

export interface CreateSubscriptionResult {
  providerSubscriptionId: string;
  providerTransactionId: string | null;
  status: "active" | "pending" | "failed";
  rawResponse: unknown;
  errorMessage?: string;
}

export interface PaymentProvider {
  createSubscription(params: CreateSubscriptionParams): Promise<CreateSubscriptionResult>;
  cancelSubscription(providerSubscriptionId: string): Promise<boolean>;
}

type IyzicoConfig = {
  apiKey: string;
  secretKey: string;
  baseUrl: string;
  locale: string;
  initialStatus: "ACTIVE" | "PENDING";
  planReferenceMap: Map<string, string>;
};

type IyzicoApiResponse = {
  status?: string;
  errorCode?: string;
  errorMessage?: string;
  errorGroup?: string;
  systemTime?: number;
  locale?: string;
  conversationId?: string;
  data?: {
    referenceCode?: string;
    parentReferenceCode?: string;
    subscriptionReferenceCode?: string;
    subscriptionStatus?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export const parseIyzicoPlanReferenceMap = (
  rawValue: string | undefined,
): Map<string, string> => {
  if (!rawValue?.trim()) {
    return new Map<string, string>();
  }

  const trimmed = rawValue.trim();
  const map = new Map<string, string>();

  if (trimmed.startsWith("{")) {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;
    for (const [planId, referenceCode] of Object.entries(parsed)) {
      if (typeof referenceCode === "string" && referenceCode.trim()) {
        map.set(planId, referenceCode.trim());
      }
    }
    return map;
  }

  for (const pair of trimmed.split(",")) {
    const [planId, referenceCode] = pair.split(":");
    if (planId?.trim() && referenceCode?.trim()) {
      map.set(planId.trim(), referenceCode.trim());
    }
  }

  return map;
};

export const buildIyzicoAuthorizationHeader = ({
  apiKey,
  secretKey,
  path,
  randomKey,
  body,
}: {
  apiKey: string;
  secretKey: string;
  path: string;
  randomKey: string;
  body: unknown;
}) => {
  const payload = `${randomKey}${path}${JSON.stringify(body ?? {})}`;
  const signature = createHmac("sha256", secretKey).update(payload).digest("hex");
  const authParams = `apiKey:${apiKey}&randomKey:${randomKey}&signature:${signature}`;
  return `IYZWSv2 ${Buffer.from(authParams).toString("base64")}`;
};

export class IyzicoPaymentProvider implements PaymentProvider {
  private readonly config: IyzicoConfig;
  private readonly isConfigured: boolean;

  constructor() {
    const apiKey = process.env.IYZICO_API_KEY?.trim() ?? "";
    const secretKey = process.env.IYZICO_SECRET_KEY?.trim() ?? "";
    const baseUrl = (
      process.env.IYZICO_BASE_URL?.trim() || "https://sandbox-api.iyzipay.com"
    ).replace(/\/+$/, "");
    const locale = process.env.IYZICO_LOCALE?.trim() || "tr";
    const configuredInitialStatus = process.env.IYZICO_SUBSCRIPTION_INITIAL_STATUS
      ?.trim()
      .toUpperCase();
    const initialStatus = configuredInitialStatus === "PENDING" ? "PENDING" : "ACTIVE";
    const planReferenceMap = parseIyzicoPlanReferenceMap(
      process.env.IYZICO_PLAN_REFERENCE_MAP?.trim() ||
        process.env.IYZICO_PRICING_PLAN_MAP?.trim(),
    );

    this.config = {
      apiKey,
      secretKey,
      baseUrl,
      locale,
      initialStatus,
      planReferenceMap,
    };
    this.isConfigured = Boolean(apiKey && secretKey);
  }

  private resolvePricingPlanReferenceCode(planId: string) {
    return this.config.planReferenceMap.get(planId);
  }

  private async iyzicoRequest<TResponse extends IyzicoApiResponse>({
    path,
    method,
    body,
  }: {
    path: string;
    method: "GET" | "POST";
    body?: Record<string, unknown>;
  }): Promise<TResponse> {
    const requestBody = body ?? {};
    const randomKey = `${Date.now()}-${randomBytes(6).toString("hex")}`;
    const authorization = buildIyzicoAuthorizationHeader({
      apiKey: this.config.apiKey,
      secretKey: this.config.secretKey,
      path,
      randomKey,
      body: requestBody,
    });

    const response = await fetch(`${this.config.baseUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization,
        "x-iyzi-rnd": randomKey,
      },
      body: method === "POST" ? JSON.stringify(requestBody) : undefined,
    });

    const data = (await response.json()) as TResponse;
    if (!response.ok) {
      throw new Error(
        data?.errorMessage ||
          `Iyzico request failed with status ${response.status} for ${path}`,
      );
    }

    return data;
  }

  async createSubscription(
    params: CreateSubscriptionParams,
  ): Promise<CreateSubscriptionResult> {
    if (!this.isConfigured) {
      return {
        providerSubscriptionId: "",
        providerTransactionId: null,
        status: "failed",
        rawResponse: {
          status: "failure",
          errorMessage: "Iyzico credentials are missing",
        },
        errorMessage: "Iyzico credentials are missing",
      };
    }

    const pricingPlanReferenceCode = this.resolvePricingPlanReferenceCode(params.planId);
    if (!pricingPlanReferenceCode) {
      const message = `Missing iyzico pricing plan mapping for planId: ${params.planId}`;
      return {
        providerSubscriptionId: "",
        providerTransactionId: null,
        status: "failed",
        rawResponse: { status: "failure", errorMessage: message },
        errorMessage: message,
      };
    }

    try {
      const response = await this.iyzicoRequest<IyzicoApiResponse>({
        path: "/v2/subscription/initialize",
        method: "POST",
        body: {
          locale: this.config.locale,
          conversationId:
            params.conversationId ||
            `mytrip-sub-${params.userId}-${Date.now().toString(36)}`,
          pricingPlanReferenceCode,
          subscriptionInitialStatus: this.config.initialStatus,
          paymentCard: params.paymentCard,
          customer: params.customer,
        },
      });

      if (response.status !== "success") {
        return {
          providerSubscriptionId: "",
          providerTransactionId: null,
          status: "failed",
          rawResponse: response,
          errorMessage: response.errorMessage || "Iyzico subscription initialize failed",
        };
      }

      const providerSubscriptionId =
        response.data?.subscriptionReferenceCode ||
        response.data?.referenceCode ||
        response.data?.parentReferenceCode ||
        "";
      const providerTransactionId =
        response.data?.referenceCode || response.data?.parentReferenceCode || null;
      const providerStatus =
        response.data?.subscriptionStatus?.toUpperCase() || this.config.initialStatus;

      if (!providerSubscriptionId) {
        return {
          providerSubscriptionId: "",
          providerTransactionId,
          status: "failed",
          rawResponse: response,
          errorMessage: "Iyzico did not return a subscription reference code",
        };
      }

      return {
        providerSubscriptionId,
        providerTransactionId,
        status: providerStatus === "PENDING" ? "pending" : "active",
        rawResponse: response,
      };
    } catch (error) {
      return {
        providerSubscriptionId: "",
        providerTransactionId: null,
        status: "failed",
        rawResponse: {
          status: "failure",
          errorMessage: error instanceof Error ? error.message : "Unknown iyzico error",
        },
        errorMessage:
          error instanceof Error ? error.message : "Unknown iyzico subscription error",
      };
    }
  }

  async cancelSubscription(providerSubscriptionId: string): Promise<boolean> {
    if (!this.isConfigured || !providerSubscriptionId) {
      return false;
    }

    try {
      const response = await this.iyzicoRequest<IyzicoApiResponse>({
        path: `/v2/subscription/subscriptions/${encodeURIComponent(
          providerSubscriptionId,
        )}/cancel`,
        method: "POST",
        body: {
          subscriptionReferenceCode: providerSubscriptionId,
        },
      });

      return response.status === "success";
    } catch (error) {
      console.error("Iyzico cancel subscription error:", error);
      return false;
    }
  }
}

export const paymentProvider = new IyzicoPaymentProvider();
