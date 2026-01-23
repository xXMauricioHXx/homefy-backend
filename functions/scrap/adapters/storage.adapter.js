const { Storage } = require("@google-cloud/storage");

class StorageAdapter {
  bucketName = process.env.FIREBASE_STORAGE_BUCKET;

  constructor() {
    this.storage = new Storage({
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  }

  async uploadImage(buffer, destinationFileName) {
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(destinationFileName);

    await file.save(buffer, {
      metadata: {
        cacheControl: "no-cache",
      },
    });

    console.log(
      `${destinationFileName} uploaded to gs://${this.bucketName}/${destinationFileName}`,
    );

    await file.makePublic();

    return file.publicUrl();
  }
}

module.exports = {
  StorageAdapter,
};
