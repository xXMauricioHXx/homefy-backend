const { nowFrom1Month } = require("../../shared/date");
const { User } = require("../../domain/entities/user.entity");

class InvoicePaidUseCase {
  constructor(stripeAdapter, firestoreAdapter) {
    this.stripeAdapter = stripeAdapter;
    this.firestoreAdapter = firestoreAdapter;
  }

  async execute({
    stripeCustomerId,
    stripeSubscriptionId,
    billingReason,
    stripeEventId,
    invoiceId,
  }) {
    const userData = await this.firestoreAdapter.findByStripeCustomerId(
      "users",
      stripeCustomerId,
    );

    if (!userData) {
      console.warn(
        "[INVOICE_PAID] User not found for stripeCustomerId:",
        stripeCustomerId,
      );
      return;
    }
    const user = new User(userData);
    const userId = user.getId();

    const planId = user.getPlan().planId;
    if (!planId) {
      console.warn("[INVOICE_PAID] Missing planId in user doc:", userId);
      return;
    }

    const plan = this.stripeAdapter.getPlanById(planId);
    if (!plan) {
      console.warn("[INVOICE_PAID] Plan not found for planId:", planId);
      return;
    }

    user.setPlan({
      name: plan.planId,
      planId,
      credits: plan.credits,
      expiresAt: nowFrom1Month(),
      stripeCustomerId,
      stripeSubscriptionId,
      status: "active",
      stripeLastInvoiceId: invoiceId,
      stripeLastEventId: stripeEventId,
      stripeBillingReason: billingReason,
    });

    await this.firestoreAdapter.setWithMerge(
      "users",
      userId,
      user.toFirestore(),
    );

    console.log("[INVOICE_PAID] Credits renewed for user:", userId, {
      planId,
      credits: plan.credits,
      billingReason,
    });
  }
}

module.exports = {
  InvoicePaidUseCase,
};
