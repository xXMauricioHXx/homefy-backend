import { onRequest } from "firebase-functions/https";
import { BillingContainer } from "../container/billing.container";
import { coreContainer } from "../../../core/container/container";
import { handleError } from "../../../shared/ErrorHandle";
import { PlanType } from "../../../core/domain/constants/plan";
import { AuthMiddleware } from "../../../core/infrastructure/middlewares/auth";

export const container = new BillingContainer(
  coreContainer.firestoreClient,
  coreContainer.stripeClient,
);

export const createCheckoutSession = onRequest(
  coreContainer.cloudFunction.defaultConfig(),
  async (req: any, res: any) => {
    try {
      if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
      }

      try {
        await AuthMiddleware.verifyToken(req as any, res as any);
      } catch (error) {
        handleError(res, error, "billing.http");
        return;
      }

      const { planId } = req.body;

      if (!planId) {
        return res.status(400).json({ error: "Plan ID é obrigatório" });
      }

      const userId = req.user.uid;

      const useCase = container.createCheckoutUseCase;
      const session = await useCase.execute(userId, planId);

      return res.status(201).json(session);
    } catch (error) {
      handleError(res, error, "billing.http");
    }
  },
);

const handleCheckoutSessionCompleted = async (req: any, res: any) => {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const data = req.body.data.object;

  const clientId = data.client_reference_id;
  const stripeSubscriptionId = data.subscription as string;
  const stripeCustomerId = data.customer as string;
  const stripePriceId = data.metadata.priceId as string;
  const checkoutStatus = data.status;
  const userId = data.metadata.userId;
  const planId = data.metadata.planId as PlanType;
  const paymentStatus = data.payment_status;

  if (checkoutStatus !== "complete") {
    return res.status(200).send("Webhook processed");
  }

  if (!clientId || !stripeSubscriptionId || !stripeCustomerId || !userId) {
    return res.status(400).send("Missing parameters");
  }

  console.log("Checking for customer with clientId:", clientId);

  if (paymentStatus !== "paid") {
    return res.status(200).send("Webhook processed");
  }

  const useCase = container.checkoutSessionCompletedUseCase;
  await useCase.execute({
    planId,
    userId,
    stripeSubscriptionId,
    stripeCustomerId,
    stripePriceId,
  });

  res.status(200).send("Webhook processed");
};

const handleInvoicePaid = async (req: any, res: any) => {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const data = req.body.data.object;

  const stripeCustomerId = data.customer;
  const billingReason = data.billing_reason;

  if (!stripeCustomerId || !billingReason) {
    return res.status(400).send("Missing parameters");
  }

  const useCase = container.invoicePaidUseCase;
  await useCase.execute({
    stripeCustomerId,
    billingReason,
  });

  res.status(200).send("Webhook processed");
};

const handleSubscriptionSessionCompleted = async (req: any, res: any) => {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const data = req.body.data.object;

  const stripeCustomerId = data.customer;
  const stripeSubscriptionId = data.subscription;
  const stripePriceId = data.metadata.priceId;
  const checkoutStatus = data.status;
  const userId = data.metadata.userId;
  const paymentStatus = data.payment_status;

  if (checkoutStatus !== "complete") {
    return res.status(200).send("Webhook processed");
  }

  if (!stripeCustomerId || !stripeSubscriptionId || !stripePriceId || !userId) {
    return res.status(400).send("Missing parameters");
  }

  console.log("Checking for customer with clientId:", stripeCustomerId);

  if (paymentStatus !== "paid") {
    return res.status(200).send("Webhook processed");
  }

  res.status(200).send("Webhook processed");
};

const handleCancelPlan = async (req: any, res: any) => {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  console.log("Handling cancel plan webhook");
  const data = req.body.data.object;

  const stripeCustomerId = data.customer;

  const useCase = container.cancelPlanUseCase;
  await useCase.execute(stripeCustomerId);

  res.status(200).send("Webhook processed");
};

export const webhookHandlers = onRequest(
  coreContainer.cloudFunction.defaultConfig(),
  async (req, res) => {
    let event = req.body;
    console.log("Received webhook:", req.body);
    console.log("Header stripe-signature:", req.headers["stripe-signature"]);
    console.log("Headers", JSON.stringify(req.headers, null, 2));

    try {
      event = await coreContainer.stripeClient.constructWebhookEvent(
        req.body,
        req.headers["stripe-signature"] as string,
        process.env.STRIPE_WEBHOOK_SECRET as string,
      );

      switch (event.type) {
        case "checkout.session.completed":
          await handleCheckoutSessionCompleted(req, res);
          break;
        case "customer.subscription.created":
        case "customer.subscription.updated":
          await handleSubscriptionSessionCompleted(req, res);
          break;
        case "customer.subscription.deleted":
          await handleCancelPlan(req, res);
          break;
        case "invoice.paid":
          await handleInvoicePaid(req, res);
          break;
        default:
          res.status(200).send("Event type not handled");
      }
    } catch (error) {
      handleError(res, error, "billing.http");
    }
  },
);
