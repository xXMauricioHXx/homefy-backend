import Stripe from "stripe";

export class StripeClient {
  private static instance: StripeClient;
  public readonly stripe: Stripe;

  private constructor() {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    this.stripe = new Stripe(key, { apiVersion: "2026-01-28.clover" });
  }

  public static getInstance(): StripeClient {
    if (!StripeClient.instance) {
      StripeClient.instance = new StripeClient();
    }
    return StripeClient.instance;
  }

  constructWebhookEvent(
    payload: string | Buffer,
    sig: string,
    secret: string,
  ): Stripe.Event {
    return this.stripe.webhooks.constructEvent(payload, sig, secret);
  }
}
