const { randomUUID } = require("crypto");

class UploadImagesUseCase {
  constructor(dewatermarkHttp, storageAdapter, http) {
    this.storageAdapter = storageAdapter;
    this.http = http;
    this.dewatermarkHttp = dewatermarkHttp;
  }

  async execute(urls, pdfId) {
    console.log("[START] - Uploading images");
    const imageBuffers = await this.getImageBuffer(urls);
    const validImageBuffers = imageBuffers.filter((image) => image !== null);

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
        const destinationPath = `${pdfId}/${randomUUID()}.${extension}`;
        const url = await this.storageAdapter.uploadImage(
          cleanedBuffer,
          destinationPath,
        );

        return url;
      }),
    );

    console.log("[END] - Images uploaded successfully");
    return imageUrls;
  }

  async getImageBuffer(data) {
    return await Promise.all(
      data.map(async (image) => {
        if (!image || image === "N/A") {
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
