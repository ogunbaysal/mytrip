export interface CreateSubscriptionParams {
  userId: string;
  planId: string;
  price: number;
  currency: string;
  billingCycle: string;
  paymentCard?: {
    cardHolderName: string;
    cardNumber: string;
    expireMonth: string;
    expireYear: string;
    cvc: string;
  };
}

export interface PaymentProvider {
  createSubscription(params: CreateSubscriptionParams): Promise<{
    providerSubscriptionId: string;
    status: "active" | "pending" | "failed";
    rawResponse: any;
  }>;
  cancelSubscription(providerSubscriptionId: string): Promise<boolean>;
}

export class IyzicoPaymentProvider implements PaymentProvider {
  private config: any;

  constructor() {
    // In a real implementation, we would initialize Iyzipay with API keys
    this.config = {
      apiKey: process.env.IYZICO_API_KEY,
      secretKey: process.env.IYZICO_SECRET_KEY,
      baseUrl: process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com",
    };
  }

  async createSubscription(params: CreateSubscriptionParams): Promise<{
    providerSubscriptionId: string;
    status: "active" | "pending" | "failed";
    rawResponse: any;
  }> {
    console.log("Mocking Iyzico Subscription Creation", params);
    
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock successful response
    return {
      providerSubscriptionId: `iyzi_sub_${Math.random().toString(36).substring(7)}`,
      status: "active",
      rawResponse: { status: "success", systemTime: Date.now() },
    };
  }

  async cancelSubscription(providerSubscriptionId: string): Promise<boolean> {
     console.log("Mocking Iyzico Subscription Cancellation", providerSubscriptionId);
     await new Promise((resolve) => setTimeout(resolve, 500));
     return true;
  }
}

export const paymentProvider = new IyzicoPaymentProvider();
