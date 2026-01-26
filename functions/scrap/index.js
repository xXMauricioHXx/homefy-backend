const { onRequest } = require("firebase-functions/v2/https");
const { HttpAdapter } = require("./adapters/http.adapter");
const { FoxterMapper } = require("./application/mappers/foxter-mapper");
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

const storageAdapter = new StorageAdapter();
const httpAdapter = new HttpAdapter();
const dewatermarkHttp = new DewatermarkHttp();
const firestoreAdapter = new FirestoreAdapter();
const authMiddleware = new AuthMiddleware();

const foxterMapper = new FoxterMapper();
const getPageContentUseCase = new GetPageContentUseCase(
  httpAdapter,
  foxterMapper,
);

const uploadImagesUseCase = new UploadImagesUseCase(
  dewatermarkHttp,
  storageAdapter,
  httpAdapter,
);

const getPdfByIdUseCase = new GetPdfByIdUseCase(firestoreAdapter);
const getPdfsByUserIdUseCase = new GetPdfsByUserIdUseCase(firestoreAdapter);

const createPdfUseCase = new CreatePdfUseCase(
  uploadImagesUseCase,
  firestoreAdapter,
);

const createUserUseCase = new CreateUserUseCase(firestoreAdapter);

const getPageContent = onRequest(
  { region: "us-central1" },
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

      if (error.message && error.message.includes("Unauthorized")) {
        return res.status(401).json({ error: error.message });
      }

      return res.status(500).json({ error: "Error to try scrap URL" });
    }
  },
);

const uploadImages = onRequest({ region: "us-central1" }, async (req, res) => {
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

    const { urls, pdfId } = req.body;

    if (!urls.length) {
      return res.status(400).json({ error: "URLs é obrigatória" });
    }

    if (!pdfId) {
      return res.status(400).json({ error: "PDF ID é obrigatório" });
    }

    const data = await uploadImagesUseCase.execute(urls, pdfId);

    return res.status(200).json(data);
  } catch (error) {
    console.error("Error to try upload images:", error);
    return res.status(500).json({ error: "Error to try upload images" });
  }
});

const getPdfById = onRequest({ region: "us-central1" }, async (req, res) => {
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
});

const getPdfsByUserId = onRequest(
  { region: "us-central1" },
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

      if (error.message && error.message.includes("Unauthorized")) {
        return res.status(401).json({ error: error.message });
      }

      return res.status(500).json({ error: "Erro ao buscar PDFs do usuário" });
    }
  },
);

const createPdf = onRequest({ region: "us-central1" }, async (req, res) => {
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

    const userId = req.user.uid;

    const data = req.body;
    const pdfData = await createPdfUseCase.execute(data, userId);

    return res.status(200).json(pdfData);
  } catch (error) {
    console.error("Error to create PDF:", error);
    return res.status(500).json({ error: "Erro ao criar PDF" });
  }
});

const createUser = onRequest({ region: "us-central1" }, async (req, res) => {
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

    return res.status(500).json({ error: "Erro ao criar usuário" });
  }
});

module.exports = {
  getPageContent,
  uploadImages,
  getPdfById,
  getPdfsByUserId,
  createPdf,
  createUser,
};
