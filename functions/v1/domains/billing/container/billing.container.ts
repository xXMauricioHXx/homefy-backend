import { FirestoreClient } from "../../../core/infrastructure/firestore/FirestoreClient";
import { StripeClient } from "../../../core/infrastructure/stripe/StripeClient";
import { UserRepository } from "../infrastructure/repositories/UserRepository";
import { CheckoutSessionCompletedUseCase } from "../application/use-cases/CheckoutSessionCompletedUseCase";
import { InvoicePaidUseCase } from "../application/use-cases/InvoicePaidUseCase";
import { CancelPlanUseCase } from "../application/use-cases/CancelPlanUseCase";
import { CheckExpiredPlansUseCase } from "../application/use-cases/CheckExpiredPlansUseCase";
import { CreateCheckoutUseCase } from "../application/use-cases/CreateCheckoutUseCase";

export class BillingContainer {
  public readonly userRepository: UserRepository;

  public readonly checkoutSessionCompletedUseCase: CheckoutSessionCompletedUseCase;
  public readonly invoicePaidUseCase: InvoicePaidUseCase;
  public readonly cancelPlanUseCase: CancelPlanUseCase;
  public readonly checkExpiredPlansUseCase: CheckExpiredPlansUseCase;
  public readonly createCheckoutUseCase: CreateCheckoutUseCase;

  constructor(
    readonly db: FirestoreClient,
    readonly stripeClient: StripeClient,
  ) {
    this.userRepository = new UserRepository(db);
    this.createCheckoutUseCase = new CreateCheckoutUseCase(stripeClient);
    this.checkoutSessionCompletedUseCase = new CheckoutSessionCompletedUseCase(
      this.userRepository,
    );
    this.invoicePaidUseCase = new InvoicePaidUseCase(this.userRepository);
    this.cancelPlanUseCase = new CancelPlanUseCase(this.userRepository);
    this.checkExpiredPlansUseCase = new CheckExpiredPlansUseCase(
      this.userRepository,
    );
  }
}
