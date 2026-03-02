import Stripe from "stripe";
import { StripeClient } from "../../../../core/infrastructure/stripe/StripeClient";

export class CreateCheckoutUseCase {
  constructor(private readonly stripeClient: StripeClient) {}

  async execute(
    userId: string,
    planId: string,
  ): Promise<Stripe.Checkout.Session> {
    console.log(
      `[START] - Creating checkout session for user: ${userId} and plan: ${planId}`,
    );
    const session = await this.stripeClient.stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: planId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel`,
    });

    console.log("[END] - Creating checkout session for user:", userId);
    return session;
  }
}
