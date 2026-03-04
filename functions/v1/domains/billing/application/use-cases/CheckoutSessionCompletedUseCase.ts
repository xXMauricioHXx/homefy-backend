import { UserRepository } from "../../infrastructure/repositories/UserRepository";
import { CheckoutSessionCompletedDto } from "../dto/BillingDtos";
import { PLANS } from "../../../../core/domain/constants/plan";

export class CheckoutSessionCompletedUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: CheckoutSessionCompletedDto): Promise<void> {
    const { userId, stripeSubscriptionId, stripeCustomerId, planId } = input;

    console.log("[START] Processing for userId:", userId);

    const user = await this.userRepository.findById(userId);

    if (!user) {
      console.error("[ERROR] User not found:", userId);
      throw new Error(`User not found: ${userId}`);
    }

    const priceId = PLANS[planId].priceId;

    if (!priceId) {
      throw new Error(`Invalid plan ID: ${planId}`);
    }

    user.plan.setStripeData(
      planId,
      stripeCustomerId,
      stripeSubscriptionId,
      priceId,
    );

    await this.userRepository.save(user);

    console.log("[END] Plan updated for user:", userId, {
      planId,
    });
  }
}
