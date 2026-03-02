import { onSchedule } from "firebase-functions/v2/scheduler";
import { BillingContainer } from "../../domains/billing/container/billing.container";
import { coreContainer } from "../../core/container/container";

export const checkExpiredPlansSchedule = onSchedule(
  { schedule: "0 0 * * *", region: "southamerica-east1", timeZone: "UTC" },
  async () => {
    const billingContainer = new BillingContainer(
      coreContainer.firestoreClient,
      coreContainer.stripeClient,
    );

    await billingContainer.checkExpiredPlansUseCase.execute();
  },
);
