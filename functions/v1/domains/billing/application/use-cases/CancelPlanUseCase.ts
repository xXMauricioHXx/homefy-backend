import { UserRepository } from "../../infrastructure/repositories/UserRepository";

export class CancelPlanUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(stripeCustomerId: string): Promise<void> {
    console.log(
      "[START] Handling cancellation for stripeCustomerId:",
      stripeCustomerId,
    );

    const user =
      await this.userRepository.findByStripeCustomerId(stripeCustomerId);

    if (!user) {
      console.error(
        "[ERROR] User not found for stripeCustomerId:",
        stripeCustomerId,
      );
      throw new Error(
        `User not found for stripeCustomerId: ${stripeCustomerId}`,
      );
    }

    user.cancelPlan();

    await this.userRepository.save(user);

    console.log("[END] Plan cancelled for user:", user.id);
  }
}
