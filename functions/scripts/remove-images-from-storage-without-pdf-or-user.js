import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import * as dotenv from "dotenv";
import { initializeApp, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, "../.env") });

const main = async () => {
  const appConfig = {};
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const serviceAccount = JSON.parse(
      readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, "utf8"),
    );
    appConfig.credential = cert(serviceAccount);
  }

  if (process.env.HOMEFY_FIREBASE_PROJECT_ID) {
    appConfig.projectId = process.env.HOMEFY_FIREBASE_PROJECT_ID;
  }

  if (process.env.HOMEFY_FIREBASE_STORAGE_BUCKET) {
    appConfig.storageBucket = process.env.HOMEFY_FIREBASE_STORAGE_BUCKET;
  }

  initializeApp(appConfig);

  const db = getFirestore();
  const bucket = getStorage().bucket();
  const [files] = await bucket.getFiles();
  let totalFilesDeleted = 0;

  console.log(`Total de arquivos no storage: ${files.length}`);
  await Promise.all(
    files.map(async (file) => {
      const fileData = file?.name?.split("/");

      const folder = fileData[0];
      console.log(folder);
    }),
  );

  console.log(`Total de arquivos deletados: ${totalFilesDeleted}`);
};

setImmediate(async () => {
  await main();
});
