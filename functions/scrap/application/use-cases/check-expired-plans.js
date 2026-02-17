const { User } = require("../../domain/entities/user.entity");

class CheckExpiredPlansUseCase {
  constructor(firestoreAdapter) {
    this.firestoreAdapter = firestoreAdapter;
  }

  async execute() {
    console.log("[START] - Checking for expired plans");

    const expiredUsers =
      await this.firestoreAdapter.findExpiredSubscriptions("users");

    if (expiredUsers.length === 0) {
      console.log("[INFO] - No expired plans found.");
      return;
    }

    console.log(
      `[INFO] - Found ${expiredUsers.length} users with expired plans. Updating to free plan...`,
    );

    const updatePromises = expiredUsers.map(async (userData) => {
      try {
        const user = new User(userData);
        const freePlan = user.freePlan();

        await this.firestoreAdapter.update("users", user.id, {
          plan: freePlan,
        });

        console.log(
          `[INFO] - User ${user.id} plan updated to free (expired at: ${userData.plan.expiresAt.toDate()})`,
        );
      } catch (error) {
        console.error(
          `[ERROR] - Failed to update user ${userData.id} plan:`,
          error,
        );
      }
    });

    await Promise.all(updatePromises);

    console.log("[END] - Finished updating expired plans");
  }
}

module.exports = {
  CheckExpiredPlansUseCase,
};
