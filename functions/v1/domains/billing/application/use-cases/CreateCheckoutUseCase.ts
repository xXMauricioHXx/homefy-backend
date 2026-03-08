import Stripe from "stripe";
import { StripeClient } from "../../../../core/infrastructure/stripe/StripeClient";
import { PLANS, PlanType } from "../../../../core/domain/constants/plan";

export class CreateCheckoutUseCase {
  constructor(private readonly stripeClient: StripeClient) {}

  async execute(
    userId: string,
    planId: PlanType,
  ): Promise<Stripe.Checkout.Session> {
    console.log(
      `[START] - Creating checkout session for user: ${userId} and plan: ${planId}`,
    );

    const stripePriceId = PLANS[planId].priceId;

    if (!stripePriceId) {
      throw new Error("Invalid plan ID");
    }

    const session = await this.stripeClient.stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      client_reference_id: userId,
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      metadata: {
        userId,
        planId,
      },
      success_url: `${process.env.FRONTEND_URL}/checkout/success`,
      cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel`,
    });

    console.log("[END] - Creating checkout session for user:", userId);
    return session;
  }
}
