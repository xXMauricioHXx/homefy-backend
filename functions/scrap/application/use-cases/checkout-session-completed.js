const { User } = require("../../domain/entities/user.entity");
const { nowFrom1Month } = require("../../shared/date");

class CheckoutSessionCompletedUseCase {
  constructor(firestoreAdapter, stripeAdapter) {
    this.firestoreAdapter = firestoreAdapter;
    this.stripeAdapter = stripeAdapter;
  }

  async execute(userId, data) {
    const { stripeSubscriptionId, stripeCustomerId, planId, stripePriceId } =
      data;

    console.log("Checking for customer with clientId:", userId);
    const userData = await this.firestoreAdapter.findById("users", userId);

    console.log("Customer found:", userData);

    if (!userData) {
      throw new Error("Customer not found");
    }

    console.log("[INFO] - Getting plan by planId - ", planId);
    const plan = this.stripeAdapter.getPlanById(planId);
    console.log("[INFO] - Plan found - ", plan);

    const user = new User(userData);
    console.log("[INFO] - User created - ", user);
    user.setPlan({
      name: plan.planId,
      credits: plan.credits,
      expiresAt: nowFrom1Month(),
      stripeSubscriptionId,
      stripeCustomerId,
      planId,
      stripePriceId,
      status: "active",
    });

    console.log("[INFO] - Updating user - ", user.toFirestore());
    await this.firestoreAdapter.setWithMerge(
      "users",
      userId,
      user.toFirestore(),
    );

    console.log("[END] - Checkout session completed for user:", userId);
  }
}

module.exports = {
  CheckoutSessionCompletedUseCase,
};
