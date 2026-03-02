import { UserRepository } from "../../infrastructure/repositories/UserRepository";
import { InvoicePaidDto } from "../dto/BillingDtos";

export class InvoicePaidUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: InvoicePaidDto): Promise<void> {
    const { stripeCustomerId, billingReason } = input;

    const user =
      await this.userRepository.findByStripeCustomerId(stripeCustomerId);

    if (!user) {
      console.warn(
        "[START] User not found for stripeCustomerId:",
        stripeCustomerId,
      );
      return;
    }

    if (!user.plan.name) {
      console.warn("[WARN] Missing planId in user plan for user:", user.id);
      return;
    }

    user.setPlan(user.plan.name);

    await this.userRepository.save(user);

    console.log("[END] Credits renewed for user:", user.id, {
      planId: user.plan.name,
      credits: user.plan.credits,
      billingReason,
    });
  }
}
