const Stripe = require("stripe");

class StripeAdapter {
  get plans() {
    return [
      {
        name: "Plano Gratuito",
        price: 0,
        planId: "gratuito",
        credits: 1,
      },
      {
        name: "Plano Básico",
        price: 2990,
        planId: "basico",
        credits: 10,
        priceId: process.env.STRIPE_PRICE_ID_BASICO,
      },
      {
        name: "Plano Premium",
        price: 5990,
        planId: "premium",
        credits: 20,
        priceId: process.env.STRIPE_PRICE_ID_PREMIUM,
      },
      {
        name: "Plano Premium +",
        price: 11990,
        planId: "premium_plus",
        priceId: process.env.STRIPE_PRICE_ID_PREMIUM_PLUS,
        credits: 40,
      },
    ];
  }

  constructor() {
    this._stripe = null;
  }

  get stripe() {
    if (!this._stripe) {
      const key = process.env.STRIPE_SECRET_KEY;
      if (!key) {
        throw new Error("STRIPE_SECRET_KEY não configurada no ambiente.");
      }
      this._stripe = new Stripe(key);
    }
    return this._stripe;
  }

  getPlanById(planId) {
    const plan = this.plans.find((plan) => plan.planId === planId);

    if (!plan) {
      throw new Error("Plan not found");
    }

    return plan;
  }

  async createCheckoutSession(userId, planId) {
    const plan = this.getPlanById(planId);

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price: plan.priceId,
        },
      ],
      metadata: {
        userId,
        planId,
        priceId: plan.priceId,
      },
      client_reference_id: userId,
      mode: "subscription",
      success_url: `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel`,
    });

    return session;
  }

  async constructEvent(req) {
    return this.stripe.webhooks.constructEvent(
      req.rawBody,
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  }
}

module.exports = {
  StripeAdapter,
};
