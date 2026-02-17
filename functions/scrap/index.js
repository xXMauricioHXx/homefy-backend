require("dotenv").config();
const { onRequest } = require("firebase-functions/v2/https");
const { HttpAdapter } = require("./adapters/http.adapter");
const { MapperFactory } = require("./application/factories/mapper-factory");
const {
  GetPageContentUseCase,
} = require("./application/use-cases/get-page-content");
const {
  UploadImagesUseCase,
} = require("./application/use-cases/upload-images");
const { GetPdfByIdUseCase } = require("./application/use-cases/get-pdf-by-id");
const {
  GetPdfsByUserIdUseCase,
} = require("./application/use-cases/get-pdfs-by-user-id");
const { StorageAdapter } = require("./adapters/storage.adapter");
const { DewatermarkHttp } = require("./infrastructure/http/dewatermark.http");
const { FirestoreAdapter } = require("./adapters/firestore.adapter");
const {
  AuthMiddleware,
} = require("./infrastructure/middlewares/auth.middleware");

const { CreatePdfUseCase } = require("./application/use-cases/create-pdf");
const { CreateUserUseCase } = require("./application/use-cases/create-user");
const { UpdateUserUseCase } = require("./application/use-cases/update-user");
const {
  GetUserByIdUseCase,
} = require("./application/use-cases/get-user-by-id");
const { UpdatePdfUseCase } = require("./application/use-cases/update-pdf");
const {
  UpdateUserPhotoUseCase,
} = require("./application/use-cases/update-user-photo");
const {
  NoCreditsAvailableException,
} = require("./domain/exceptions/no-credits-available.exception");
const {
  PdfRepository,
} = require("./infrastructure/repositories/pdf.repository");
const {
  GetGalleryByPdfIdUseCase,
} = require("./application/use-cases/get-gallery-by-pdf-id");
const {
  CheckExpiredPlansUseCase,
} = require("./application/use-cases/check-expired-plans");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { StripeAdapter } = require("./adapters/stripe");
const {
  CreateCheckoutUseCase,
} = require("./application/use-cases/create-checkout");
const {
  CheckoutSessionCompletedUseCase,
} = require("./application/use-cases/checkout-session-completed");
const { InvoicePaidUseCase } = require("./application/use-cases/invoice-paid");
const { CancelPlanUseCase } = require("./application/use-cases/cancel-plan");

const storageAdapter = new StorageAdapter();
const httpAdapter = new HttpAdapter();
const dewatermarkHttp = new DewatermarkHttp();
const firestoreAdapter = new FirestoreAdapter();
const authMiddleware = new AuthMiddleware();
const stripeAdapter = new StripeAdapter();
const invoicePaidUseCase = new InvoicePaidUseCase(
  stripeAdapter,
  firestoreAdapter,
);

const mapperFactory = new MapperFactory();
const getPageContentUseCase = new GetPageContentUseCase(
  httpAdapter,
  mapperFactory,
);
const getUserByIdUseCase = new GetUserByIdUseCase(firestoreAdapter);

const uploadImagesUseCase = new UploadImagesUseCase(
  dewatermarkHttp,
  storageAdapter,
  httpAdapter,
  getUserByIdUseCase,
  firestoreAdapter,
);

const pdfRepository = new PdfRepository();
const getPdfByIdUseCase = new GetPdfByIdUseCase(pdfRepository);
const getPdfsByUserIdUseCase = new GetPdfsByUserIdUseCase(pdfRepository);

const createPdfUseCase = new CreatePdfUseCase(
  uploadImagesUseCase,
  firestoreAdapter,
);

const createUserUseCase = new CreateUserUseCase(firestoreAdapter);

const updateUserUseCase = new UpdateUserUseCase(firestoreAdapter);

const updatePdfUseCase = new UpdatePdfUseCase(firestoreAdapter);

const updateUserPhotoUseCase = new UpdateUserPhotoUseCase(firestoreAdapter);

const getGalleryByPdfIdUseCase = new GetGalleryByPdfIdUseCase(pdfRepository);

const checkExpiredPlansUseCase = new CheckExpiredPlansUseCase(firestoreAdapter);

const checkoutSessionCompletedUseCase = new CheckoutSessionCompletedUseCase(
  firestoreAdapter,
  stripeAdapter,
);

const cancelPlanUseCase = new CancelPlanUseCase(firestoreAdapter);

const createCheckoutUseCase = new CreateCheckoutUseCase(stripeAdapter);

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
    const result = await checkExpiredPlansUseCase.execute();
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

      const result = await checkExpiredPlansUseCase.execute();

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

      const result = await getPageContentUseCase.execute(url, userId);

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

      const pdfData = await getPdfByIdUseCase.execute(pdfId);

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

      const pdfs = await getPdfsByUserIdUseCase.execute(userId);

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
      const pdfData = await createPdfUseCase.execute(data, userId);
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

      const userData = await createUserUseCase.execute({
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

      const userData = await updateUserUseCase.execute(userId, {
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

      const userData = await getUserByIdUseCase.execute(userId);

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

      const pdfData = await updatePdfUseCase.execute(pdfId, config);

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

      const userData = await updateUserPhotoUseCase.execute(userId, photoUrl);

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

      const galleryData = await getGalleryByPdfIdUseCase.execute(
        req.query.pdfId,
      );

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

      const session = await createCheckoutUseCase.execute(userId, planId);

      return res.status(201).json(session);
    } catch (error) {
      console.error("Error to create checkout session:", error);

      return res
        .status(500)
        .json({ error: "Error to create checkout session" });
    }
  },
);

const handleCheckoutSessionCompleted = onRequest(async (req, res) => {
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

  await checkoutSessionCompletedUseCase.execute(userId, {
    stripeSubscriptionId,
    stripeCustomerId,
    planId,
    stripePriceId,
  });

  res.status(200).send("Webhook processed");
});

const handleInvoicePaid = onRequest(async (req, res) => {
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

  await invoicePaidUseCase.execute({
    stripeCustomerId,
    stripeSubscriptionId,
    billingReason,
    stripeEventId,
    invoiceId,
  });

  res.status(200).send("Webhook processed");
});

const handleSubscriptionSessionCompleted = onRequest(async (req, res) => {
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
});

const handleCancelPlan = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  console.log("Handling cancel plan webhook");
  const data = req.body.data.object;

  const stripeCustomerId = data.customer;

  await cancelPlanUseCase.execute(stripeCustomerId);

  res.status(200).send("Webhook processed");
});

const webhookHandlers = onRequest(
  { region: "us-central1", cors: true, memory: "1GiB", timeoutSeconds: 300 },
  async (req, res) => {
    const stripeAdapter = new StripeAdapter();

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
