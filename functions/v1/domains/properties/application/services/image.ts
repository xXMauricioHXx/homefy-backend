import { HttpClient } from "../../../../core/infrastructure/http/HttpClient";
import { DewatermarkHttp } from "../../../../core/infrastructure/http/DewatermarkHttp";
import { StorageClient } from "../../../../core/infrastructure/storage/StorageClient";

export class ImageService {
  private environment: string;

  constructor(
    readonly http: HttpClient,
    readonly dewatermarkHttp: DewatermarkHttp,
    readonly storageClient: StorageClient,
  ) {
    this.environment = process.env.NODE_ENV == "development" ? "-dev" : "";
  }

  async uploadImage(
    userId: string,
    propertyId: string,
    assetId: string,
    imageUrl: string,
  ): Promise<string> {
    console.log("[START] - Uploading image");
    console.log("[INFO] - Getting image buffer");
    const { contentType, arrayBuffer } = await this.http.getBuffer(imageUrl);
    const buffer = Buffer.from(arrayBuffer) as Buffer;

    let cleanedBuffer = buffer;

    console.log("[INFO] - Checking if dewatermark is enabled");
    if (
      process.env.ENABLE_DEWATERMARK === "true" &&
      userId !== "i5XMe0LL8XZPf4t7KJmwr5fzglo2"
    ) {
      console.log("[INFO] - Starting remove water mark");
      cleanedBuffer = await this.dewatermarkHttp.removeWaterMark(buffer);
    }

    console.log("[INFO] - Getting image extension");
    const extension = this.getImageExtension(contentType);
    const destinationPath = `properties${this.environment}/${userId}/${propertyId}/${assetId}.${extension}`;

    console.log("[INFO] - Uploading image to storage ", destinationPath);
    const url = await this.storageClient.uploadFromBuffer(
      destinationPath,
      cleanedBuffer,
      contentType,
    );

    return url;
  }

  private getImageExtension(contentType: string) {
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
