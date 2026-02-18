require("dotenv").config();
const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const container = require("./container");
const {
  AuthMiddleware,
} = require("./infrastructure/middlewares/auth.middleware");
const {
  NoCreditsAvailableException,
} = require("./domain/exceptions/no-credits-available.exception");

const authMiddleware = new AuthMiddleware();

const checkExpiredPlans = onSchedule(
  {
    schedule: process.env.CHECK_EXPIRED_PLANS_SCHEDULE || "0 0 * * *",
    timeZone: "America/Sao_Paulo",
    region: "us-central1",
  },
  async () => {
    console.log(
      `[TRIGGER] - Start check plan expired - ${new Date().toISOString()}`,
    );
    const useCase = container.checkExpiredPlansUseCase;
    const result = await useCase.execute();
    console.log(
      `[TRIGGER] - End check plan expired - ${new Date().toISOString()}`,
    );
    return result;
  },
);

const checkExpiredPlansManual = onRequest(
  { region: "us-central1", cors: true, memory: "1GiB", timeoutSeconds: 300 },
  async (req, res) => {
    try {
      if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
      }

      const useCase = container.checkExpiredPlansUseCase;
      const result = await useCase.execute();

      return res.status(200).json(result);
    } catch (error) {
      console.error("Error to check expired plans:", error);

      return res.status(500).json({ error: "Error to check expired plans" });
    }
  },
);

const getPageContent = onRequest(
  { region: "us-central1", cors: true, memory: "1GiB", timeoutSeconds: 300 },
  async (req, res) => {
    try {
      if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
      }

      await new Promise((resolve, reject) => {
        authMiddleware.verifyToken(req, res, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });

      const { url } = req.body;

      if (!url) {
        return res.status(400).json({ error: "URL é obrigatória" });
      }
      const userId = req.user.uid;

      const useCase = container.getPageContentUseCase;
      const result = await useCase.execute(url, userId);

      return res.status(200).json(result);
    } catch (error) {
      console.error("Error to try scrap URL:", error);

      if (
        error.status === 401 ||
        (error.message && error.message.includes("Unauthorized"))
      ) {
        return res.status(error.status || 401).json({ error: error.message });
      }

      if (error.message && error.message.includes("Nenhum mapper encontrado")) {
        return res.status(400).json({
          error: "URL não suportada",
          message: error.message,
        });
      }

      return res.status(500).json({ error: "Error to try scrap URL" });
    }
  },
);

const getPdfById = onRequest(
  { region: "us-central1", cors: true, memory: "1GiB", timeoutSeconds: 300 },
  async (req, res) => {
    try {
      if (req.method !== "GET") {
        return res.status(405).send("Method Not Allowed");
      }

      const { pdfId } = req.query;

      if (!pdfId) {
        return res.status(400).json({ error: "PDF ID é obrigatório" });
      }

      const useCase = container.getPdfByIdUseCase;
      const pdfData = await useCase.execute(pdfId);

      return res.status(200).json(pdfData);
    } catch (error) {
      console.error("Error to get PDF by ID:", error);

      if (error.message && error.message.includes("not found")) {
        return res.status(404).json({ error: "PDF não encontrado" });
      }

      return res.status(500).json({ error: "Erro ao buscar PDF" });
    }
  },
);

const getPdfsByUserId = onRequest(
  { region: "us-central1", cors: true, memory: "1GiB", timeoutSeconds: 300 },
  async (req, res) => {
    try {
      if (req.method !== "GET") {
        return res.status(405).send("Method Not Allowed");
      }

      await new Promise((resolve, reject) => {
        authMiddleware.verifyToken(req, res, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });

      const userId = req.user.uid;
      console.log("Fetching PDFs for user ID:", userId);

      const useCase = container.getPdfsByUserIdUseCase;
      const pdfs = await useCase.execute(userId);

      return res.status(200).json({ pdfs, total: pdfs.length });
    } catch (error) {
      console.error("Error to get PDFs by user ID:", error);

      if (
        error.status === 401 ||
        (error.message && error.message.includes("Unauthorized"))
      ) {
        return res.status(error.status || 401).json({ error: error.message });
      }

      return res.status(500).json({ error: "Erro ao buscar PDFs do usuário" });
    }
  },
);

const createPdf = onRequest(
  { region: "us-central1", cors: true, memory: "1GiB", timeoutSeconds: 300 },
  async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    await new Promise((resolve, reject) => {
      authMiddleware.verifyToken(req, res, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    const userId = req.user.uid;

    const data = req.body;

    try {
      const useCase = container.createPdfUseCase;
      const pdfData = await useCase.execute(data, userId);
      return res.status(200).json(pdfData);
    } catch (error) {
      if (error instanceof NoCreditsAvailableException) {
        return res.status(400).json({ error: error.message, code: error.code });
      }

      console.error("Error to create PDF:", error);
      const status = error.status || 500;
      return res.status(status).json({
        error: error.message || "Erro ao criar PDF",
        code: error.code || "Unexpected exception",
      });
    }
  },
);

const createUser = onRequest(
  { region: "us-central1", cors: true, memory: "1GiB", timeoutSeconds: 300 },
  async (req, res) => {
    try {
      if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
      }

      await new Promise((resolve, reject) => {
        authMiddleware.verifyToken(req, res, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });

      const { name, email, phone } = req.body;

      if (!name || !email || !phone) {
        return res.status(400).json({
          error: "Name, email e phone são obrigatórios",
        });
      }

      const useCase = container.createUserUseCase;
      const userData = await useCase.execute({
        id: req.user.uid,
        name,
        email,
        phone,
      });

      return res.status(200).json(userData);
    } catch (error) {
      console.error("Error to create user:", error);

      if (error.message && error.message.includes("required")) {
        return res.status(400).json({ error: error.message });
      }

      if (error.message && error.message.includes("Invalid email")) {
        return res.status(400).json({ error: error.message });
      }

      const status = error.status || 500;
      return res
        .status(status)
        .json({ error: error.message || "Erro ao criar usuário" });
    }
  },
);

const updateUser = onRequest(
  { region: "us-central1", cors: true, memory: "1GiB", timeoutSeconds: 300 },
  async (req, res) => {
    try {
      if (req.method !== "PUT") {
        return res.status(405).send("Method Not Allowed");
      }

      await new Promise((resolve, reject) => {
        authMiddleware.verifyToken(req, res, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });

      const userId = req.user.uid;
      const { name, email, phone } = req.body;

      if (!name || !email || !phone) {
        return res.status(400).json({
          error: "Name, email e phone são obrigatórios",
        });
      }

      const useCase = container.updateUserUseCase;
      const userData = await useCase.execute(userId, {
        name,
        email,
        phone,
      });

      return res.status(200).json(userData);
    } catch (error) {
      console.error("Error to update user:", error);

      if (error.message && error.message.includes("not found")) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      if (error.message && error.message.includes("required")) {
        return res.status(400).json({ error: error.message });
      }

      if (error.message && error.message.includes("Invalid email")) {
        return res.status(400).json({ error: error.message });
      }

      if (
        error.status === 401 ||
        (error.message && error.message.includes("Unauthorized"))
      ) {
        return res.status(error.status || 401).json({ error: error.message });
      }

      return res.status(500).json({ error: "Erro ao atualizar usuário" });
    }
  },
);

const getUserById = onRequest(
  { region: "us-central1", cors: true, memory: "1GiB", timeoutSeconds: 300 },
  async (req, res) => {
    try {
      if (req.method !== "GET") {
        return res.status(405).send("Method Not Allowed");
      }

      await new Promise((resolve, reject) => {
        authMiddleware.verifyToken(req, res, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });

      const userId = req.user.uid;

      const useCase = container.getUserByIdUseCase;
      const userData = await useCase.execute(userId);

      return res.status(200).json(userData);
    } catch (error) {
      console.error("Error to get user by ID:", error);

      if (error.message && error.message.includes("not found")) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      if (
        error.status === 401 ||
        (error.message && error.message.includes("Unauthorized"))
      ) {
        return res.status(error.status || 401).json({ error: error.message });
      }

      const status = error.status || 500;
      return res
        .status(status)
        .json({ error: error.message || "Erro ao buscar usuário" });
    }
  },
);

const updatePdf = onRequest(
  { region: "us-central1", cors: true, memory: "1GiB", timeoutSeconds: 300 },
  async (req, res) => {
    try {
      if (req.method !== "PUT") {
        return res.status(405).send("Method Not Allowed");
      }

      await new Promise((resolve, reject) => {
        authMiddleware.verifyToken(req, res, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });

      const { pdfId, config } = req.body;

      if (!pdfId) {
        return res.status(400).json({ error: "PDF ID é obrigatório" });
      }

      if (!config) {
        return res.status(400).json({ error: "Config é obrigatório" });
      }

      const useCase = container.updatePdfUseCase;
      const pdfData = await useCase.execute(pdfId, config);

      return res.status(200).json(pdfData);
    } catch (error) {
      console.error("Error to update PDF config:", error);

      if (error.message && error.message.includes("not found")) {
        return res.status(404).json({ error: "PDF não encontrado" });
      }

      if (
        error.status === 401 ||
        (error.message && error.message.includes("Unauthorized"))
      ) {
        return res.status(error.status || 401).json({ error: error.message });
      }

      return res
        .status(500)
        .json({ error: "Erro ao atualizar configuração do PDF" });
    }
  },
);

const updateUserPhoto = onRequest(
  { region: "us-central1", cors: true, memory: "1GiB", timeoutSeconds: 300 },
  async (req, res) => {
    try {
      if (req.method !== "PUT") {
        return res.status(405).send("Method Not Allowed");
      }

      await new Promise((resolve, reject) => {
        authMiddleware.verifyToken(req, res, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });

      const userId = req.user.uid;
      const { photoUrl } = req.body;

      if (!photoUrl) {
        return res.status(400).json({
          error: "Photo URL é obrigatória",
        });
      }

      const useCase = container.updateUserPhotoUseCase;
      const userData = await useCase.execute(userId, photoUrl);

      return res.status(200).json(userData);
    } catch (error) {
      console.error("Error to update user photo:", error);

      if (error.message && error.message.includes("not found")) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      if (error.message && error.message.includes("required")) {
        return res.status(400).json({ error: error.message });
      }

      if (
        error.status === 401 ||
        (error.message && error.message.includes("Unauthorized"))
      ) {
        return res.status(error.status || 401).json({ error: error.message });
      }

      return res
        .status(500)
        .json({ error: "Erro ao atualizar foto do usuário" });
    }
  },
);

const getGalleryByPdfId = onRequest(
  { region: "us-central1", cors: true, memory: "1GiB", timeoutSeconds: 300 },
  async (req, res) => {
    try {
      if (req.method !== "GET") {
        return res.status(405).send("Method Not Allowed");
      }

      await new Promise((resolve, reject) => {
        authMiddleware.verifyToken(req, res, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });

      if (!req.query.pdfId) {
        return res.status(400).json({ error: "PDF ID é obrigatório" });
      }

      const useCase = container.getGalleryByPdfIdUseCase;
      const galleryData = await useCase.execute(req.query.pdfId);

      return res.status(200).json(galleryData);
    } catch (error) {
      console.error("Error to get gallery by user ID:", error);

      if (
        error.status === 401 ||
        (error.message && error.message.includes("Unauthorized"))
      ) {
        return res.status(error.status || 401).json({ error: error.message });
      }

      if (error.message && error.message.includes("found")) {
        return res.status(404).json({ error: "Galeria não encontrada" });
      }

      return res.status(500).json({ error: "Erro ao buscar galeria" });
    }
  },
);

const createCheckoutSession = onRequest(
  { region: "us-central1", cors: true, memory: "1GiB", timeoutSeconds: 300 },
  async (req, res) => {
    try {
      if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
      }

      await new Promise((resolve, reject) => {
        authMiddleware.verifyToken(req, res, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });

      const { planId } = req.body;

      if (!planId) {
        return res.status(400).json({ error: "Plan ID é obrigatório" });
      }

      const userId = req.user.uid;

      const useCase = container.createCheckoutUseCase;
      const session = await useCase.execute(userId, planId);

      return res.status(201).json(session);
    } catch (error) {
      console.error("Error to create checkout session:", error);

      return res
        .status(500)
        .json({ error: "Error to create checkout session" });
    }
  },
);

const handleCheckoutSessionCompleted = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const data = req.body.data.object;

  const clientId = data.client_reference_id;
  const stripeSubscriptionId = data.subscription;
  const stripeCustomerId = data.customer;
  const stripePriceId = data.metadata.priceId;
  const checkoutStatus = data.status;
  const userId = data.metadata.userId;
  const planId = data.metadata.planId;
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
  await useCase.execute(userId, {
    stripeSubscriptionId,
    stripeCustomerId,
    planId,
    stripePriceId,
  });

  res.status(200).send("Webhook processed");
};

const handleInvoicePaid = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const data = req.body.data.object;

  const stripeCustomerId = data.customer;
  const stripeSubscriptionId = data.subscription;
  const billingReason = data.billing_reason;
  const stripeEventId = data.id;
  const invoiceId = data.invoice;

  if (
    !stripeCustomerId ||
    !stripeSubscriptionId ||
    !billingReason ||
    !stripeEventId ||
    !invoiceId
  ) {
    return res.status(400).send("Missing parameters");
  }

  const useCase = container.invoicePaidUseCase;
  await useCase.execute({
    stripeCustomerId,
    stripeSubscriptionId,
    billingReason,
    stripeEventId,
    invoiceId,
  });

  res.status(200).send("Webhook processed");
};

const handleSubscriptionSessionCompleted = async (req, res) => {
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

const handleCancelPlan = async (req, res) => {
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

const webhookHandlers = onRequest(
  { region: "us-central1", cors: true, memory: "1GiB", timeoutSeconds: 300 },
  async (req, res) => {
    const stripeAdapter = container.stripeAdapter;

    console.log("Received webhook:", req.body);
    let event = req.body;
    console.log("Header stripe-signature:", req.headers["stripe-signature"]);
    console.log("Headers", JSON.stringify(req.headers, null, 2));

    try {
      event = await stripeAdapter.constructEvent(req);
    } catch (error) {
      res.status(400).send(`Webhook Error: ${error.message}`);
      return;
    }

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
  },
);

module.exports = {
  getPageContent,
  getPdfById,
  getPdfsByUserId,
  createPdf,
  createUser,
  updateUser,
  getUserById,
  updatePdf,
  updateUserPhoto,
  getGalleryByPdfId,
  checkExpiredPlans,
  checkExpiredPlansManual,
  createCheckoutSession,
  webhookHandlers,
};
