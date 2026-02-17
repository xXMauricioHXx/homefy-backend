const { User } = require("../../domain/entities/user.entity");

class CancelPlanUseCase {
  constructor(firestoreAdapter) {
    this.firestoreAdapter = firestoreAdapter;
  }

  async execute(stripeCustomerId) {
    const userData = await this.firestoreAdapter.findByStripeCustomerId(
      "users",
      stripeCustomerId,
    );

    if (!userData) {
      throw new Error("User not found");
    }

    const user = new User(userData);
    const plan = user.freePlan();

    user.setPlan({
      ...plan,
      credits: user.plan.credits,
    });

    await this.firestoreAdapter.setWithMerge(
      "users",
      user.id,
      user.toFirestore(),
    );

    console.log("[CANCEL_PLAN] Plan cancelled for user:", user.id);
  }
}

module.exports = {
  CancelPlanUseCase,
};
