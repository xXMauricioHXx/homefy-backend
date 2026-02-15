const { randomUUID } = require("crypto");
const SHA256 = require("crypto-js/sha256");

const {
  NoCreditsAvailableException,
} = require("../../domain/exceptions/no-credits-available.exception");

class UploadImagesUseCase {
  constructor(
    dewatermarkHttp,
    storageAdapter,
    http,
    getUserByIdUseCase,
    firestoreAdapter,
  ) {
    this.storageAdapter = storageAdapter;
    this.http = http;
    this.dewatermarkHttp = dewatermarkHttp;
    this.getUserByIdUseCase = getUserByIdUseCase;
    this.firestoreAdapter = firestoreAdapter;
  }

  async execute(urls, userId, url) {
    const enterpriseId = SHA256(url.trim()).toString();
    console.log("[START] - Uploading images");

    console.log("[INFO] - Verifying user existence");
    const user = await this.getUserByIdUseCase.execute(userId);

    console.log(user);
    console.log("[INFO] - Checking credits");
    if (user.plan.credits <= 0) {
      throw new NoCreditsAvailableException("No credits available");
    }

    console.log("[INFO] - Checking gallery size");
    if (urls.length > process.env.MAX_IMAGES) {
      throw new Error(`Gallery size is greater than ${process.env.MAX_IMAGES}`);
    }

    console.log("[INFO] - Getting image buffers");
    const imageBuffers = await this.getImageBuffer(urls);
    const validImageBuffers = imageBuffers.filter((image) => image !== null);

    console.log("[INFO] - Uploading images");
    const imageUrls = await Promise.all(
      validImageBuffers.map(async (data) => {
        const { buffer, contentType } = data;
        let cleanedBuffer = buffer;

        if (process.env.ENABLE_DEWATERMARK === "true") {
          console.log("[INFO] - Starting remove water mark");
          cleanedBuffer = await this.dewatermarkHttp.removeWaterMark(buffer);
        }

        console.log(`[INFO] - Upload image to storage`);

        const extension = this.getImageExtension(contentType);

        const environment = process.env.NODE_ENV == "development" ? "-dev" : "";

        const destinationPath = `gallery${environment}/${userId}/${enterpriseId}/${randomUUID()}.${extension}`;
        const url = await this.storageAdapter.uploadImage(
          cleanedBuffer,
          destinationPath,
        );

        return url;
      }),
    );

    console.log("[INFO] - Decrementing user credits");
    user.useCredit();

    console.log(user.toFirestore());
    await this.firestoreAdapter.update("users", userId, user.toFirestore());

    console.log("[END] - Images uploaded successfully");
    return imageUrls;
  }

  async getImageBuffer(data) {
    return await Promise.all(
      data.map(async (image) => {
        if (!image || image === "N/D") {
          return;
        }

        const { arrayBuffer, contentType } = await this.http.get(
          image,
          "arrayBuffer",
        );

        return {
          buffer: Buffer.from(arrayBuffer),
          contentType,
        };
      }),
    );
  }

  getImageExtension(contentType) {
    if (contentType?.includes("png")) {
      return "png";
    } else if (contentType?.includes("webp")) {
      return "webp";
    } else if (contentType?.includes("jpeg") || contentType?.includes("jpg")) {
      return "jpg";
    }

    return "jpg";
  }
}

module.exports = {
  UploadImagesUseCase,
};
