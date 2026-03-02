import { getStorage, Storage } from "firebase-admin/storage";

export class StorageClient {
  private static instance: StorageClient;
  private readonly storage: Storage;
  private readonly bucket: string;

  private constructor() {
    this.storage = getStorage();
    this.bucket = process.env.HOMEFY_FIREBASE_STORAGE_BUCKET ?? "";
  }

  public static getInstance(): StorageClient {
    if (!StorageClient.instance) {
      StorageClient.instance = new StorageClient();
    }
    return StorageClient.instance;
  }

  getBucket() {
    return this.storage.bucket(this.bucket);
  }

  async uploadFromBuffer(
    destination: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string> {
    const file = this.getBucket().file(destination);
    await file.save(buffer, { contentType });
    await file.makePublic();
    return file.publicUrl();
  }

  async deleteFile(filePath: string): Promise<void> {
    await this.getBucket().file(filePath).delete();
  }
}
