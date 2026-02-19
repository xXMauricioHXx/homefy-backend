class CreateCheckoutUseCase {
  constructor(stripeAdapter) {
    this.stripeAdapter = stripeAdapter;
  }

  async execute(userId, planId) {
    console.log(
      `[START] - Creating checkout session for user: ${userId} and plan: ${planId}`,
    );
    const session = await this.stripeAdapter.createCheckoutSession(
      userId,
      planId,
    );

    console.log("[END] - Creating checkout session for user:", userId);
    return session;
  }
}

module.exports = {
  CreateCheckoutUseCase,
};
