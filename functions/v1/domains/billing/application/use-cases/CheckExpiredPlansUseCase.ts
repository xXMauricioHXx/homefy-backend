import { UserRepository } from "../../infrastructure/repositories/UserRepository";

export class CheckExpiredPlansUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(): Promise<void> {
    console.log("[START] Starting expired plans check...");

    const expiredUsers = await this.userRepository.findExpiredSubscriptions();

    if (expiredUsers.length === 0) {
      console.log("[END] No expired plans found.");
      return;
    }

    console.log(
      `[INFO] Found ${expiredUsers.length} users with expired plans. Updating to free plan...`,
    );

    const updatePromises = expiredUsers.map(async (user) => {
      try {
        user.expirePlan();
        await this.userRepository.save(user);
        console.log(`[INFO] User ${user.id} reverted to free plan.`);
      } catch (error) {
        console.error(`[ERROR] Failed to update user ${user.id}:`, error);
      }
    });

    await Promise.all(updatePromises);

    console.log("[END] Done.");
  }
}
