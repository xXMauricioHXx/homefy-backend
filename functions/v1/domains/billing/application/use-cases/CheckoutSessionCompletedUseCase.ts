import { UserRepository } from "../../infrastructure/repositories/UserRepository";
import { CheckoutSessionCompletedDto } from "../dto/BillingDtos";

export class CheckoutSessionCompletedUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: CheckoutSessionCompletedDto): Promise<void> {
    const {
      userId,
      stripeSubscriptionId,
      stripeCustomerId,
      planId,
      stripePriceId,
    } = input;

    console.log("[START] Processing for userId:", userId);

    const user = await this.userRepository.findById(userId);

    if (!user) {
      console.error("[ERROR] User not found:", userId);
      throw new Error(`User not found: ${userId}`);
    }

    user.plan.setStripeData(
      planId,
      stripeCustomerId,
      stripeSubscriptionId,
      stripePriceId,
    );

    await this.userRepository.save(user);

    console.log("[END] Plan updated for user:", userId, {
      planId,
    });
  }
}
