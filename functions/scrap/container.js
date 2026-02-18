class Container {
  constructor() {
    this._instances = {};
  }

  // Helper para garantir Singleton e Lazy Loading
  get(name, factory) {
    if (!this._instances[name]) {
      this._instances[name] = factory();
    }
    return this._instances[name];
  }

  // Adaptadores
  get firestoreAdapter() {
    return this.get("firestoreAdapter", () => {
      const { FirestoreAdapter } = require("./adapters/firestore.adapter");
      return new FirestoreAdapter();
    });
  }
  get stripeAdapter() {
    return this.get("stripeAdapter", () => {
      const { StripeAdapter } = require("./adapters/stripe");
      return new StripeAdapter();
    });
  }
  get storageAdapter() {
    return this.get("storageAdapter", () => {
      const { StorageAdapter } = require("./adapters/storage.adapter");
      return new StorageAdapter();
    });
  }
  get httpAdapter() {
    return this.get("httpAdapter", () => {
      const { HttpAdapter } = require("./adapters/http.adapter");
      return new HttpAdapter();
    });
  }
  get dewatermarkHttp() {
    return this.get("dewatermarkHttp", () => {
      const {
        DewatermarkHttp,
      } = require("./infrastructure/http/dewatermark.http");
      return new DewatermarkHttp();
    });
  }
  get mapperFactory() {
    return this.get("mapperFactory", () => {
      const {
        MapperFactory,
      } = require("./application/factories/mapper-factory");
      return new MapperFactory();
    });
  }
  get pdfRepository() {
    return this.get("pdfRepository", () => {
      const {
        PdfRepository,
      } = require("./infrastructure/repositories/pdf.repository");
      return new PdfRepository();
    });
  }

  // Use Cases
  get getPageContentUseCase() {
    return this.get("getPageContentUseCase", () => {
      const {
        GetPageContentUseCase,
      } = require("./application/use-cases/get-page-content");
      return new GetPageContentUseCase(this.httpAdapter, this.mapperFactory);
    });
  }

  get createCheckoutUseCase() {
    return this.get("createCheckoutUseCase", () => {
      const {
        CreateCheckoutUseCase,
      } = require("./application/use-cases/create-checkout");
      return new CreateCheckoutUseCase(this.stripeAdapter);
    });
  }

  get getUserByIdUseCase() {
    return this.get("getUserByIdUseCase", () => {
      const {
        GetUserByIdUseCase,
      } = require("./application/use-cases/get-user-by-id");
      return new GetUserByIdUseCase(this.firestoreAdapter);
    });
  }

  get uploadImagesUseCase() {
    return this.get("uploadImagesUseCase", () => {
      const {
        UploadImagesUseCase,
      } = require("./application/use-cases/upload-images");
      return new UploadImagesUseCase(
        this.dewatermarkHttp,
        this.storageAdapter,
        this.httpAdapter,
        this.getUserByIdUseCase,
        this.firestoreAdapter,
      );
    });
  }

  get createPdfUseCase() {
    return this.get("createPdfUseCase", () => {
      const {
        CreatePdfUseCase,
      } = require("./application/use-cases/create-pdf");
      return new CreatePdfUseCase(
        this.uploadImagesUseCase,
        this.firestoreAdapter,
      );
    });
  }

  get createUserUseCase() {
    return this.get("createUserUseCase", () => {
      const {
        CreateUserUseCase,
      } = require("./application/use-cases/create-user");
      return new CreateUserUseCase(this.firestoreAdapter);
    });
  }

  get updateUserUseCase() {
    return this.get("updateUserUseCase", () => {
      const {
        UpdateUserUseCase,
      } = require("./application/use-cases/update-user");
      return new UpdateUserUseCase(this.firestoreAdapter);
    });
  }

  get updatePdfUseCase() {
    return this.get("updatePdfUseCase", () => {
      const {
        UpdatePdfUseCase,
      } = require("./application/use-cases/update-pdf");
      return new UpdatePdfUseCase(this.firestoreAdapter);
    });
  }

  get updateUserPhotoUseCase() {
    return this.get("updateUserPhotoUseCase", () => {
      const {
        UpdateUserPhotoUseCase,
      } = require("./application/use-cases/update-user-photo");
      return new UpdateUserPhotoUseCase(this.firestoreAdapter);
    });
  }

  get getPdfByIdUseCase() {
    return this.get("getPdfByIdUseCase", () => {
      const {
        GetPdfByIdUseCase,
      } = require("./application/use-cases/get-pdf-by-id");
      return new GetPdfByIdUseCase(this.pdfRepository);
    });
  }

  get getPdfsByUserIdUseCase() {
    return this.get("getPdfsByUserIdUseCase", () => {
      const {
        GetPdfsByUserIdUseCase,
      } = require("./application/use-cases/get-pdfs-by-user-id");
      return new GetPdfsByUserIdUseCase(this.pdfRepository);
    });
  }

  get getGalleryByPdfIdUseCase() {
    return this.get("getGalleryByPdfIdUseCase", () => {
      const {
        GetGalleryByPdfIdUseCase,
      } = require("./application/use-cases/get-gallery-by-pdf-id");
      return new GetGalleryByPdfIdUseCase(this.pdfRepository);
    });
  }

  get checkExpiredPlansUseCase() {
    return this.get("checkExpiredPlansUseCase", () => {
      const {
        CheckExpiredPlansUseCase,
      } = require("./application/use-cases/check-expired-plans");
      return new CheckExpiredPlansUseCase(this.firestoreAdapter);
    });
  }

  get checkoutSessionCompletedUseCase() {
    return this.get("checkoutSessionCompletedUseCase", () => {
      const {
        CheckoutSessionCompletedUseCase,
      } = require("./application/use-cases/checkout-session-completed");
      return new CheckoutSessionCompletedUseCase(
        this.firestoreAdapter,
        this.stripeAdapter,
      );
    });
  }

  get invoicePaidUseCase() {
    return this.get("invoicePaidUseCase", () => {
      const {
        InvoicePaidUseCase,
      } = require("./application/use-cases/invoice-paid");
      return new InvoicePaidUseCase(this.stripeAdapter, this.firestoreAdapter);
    });
  }

  get cancelPlanUseCase() {
    return this.get("cancelPlanUseCase", () => {
      const {
        CancelPlanUseCase,
      } = require("./application/use-cases/cancel-plan");
      return new CancelPlanUseCase(this.firestoreAdapter);
    });
  }
}

module.exports = new Container();
