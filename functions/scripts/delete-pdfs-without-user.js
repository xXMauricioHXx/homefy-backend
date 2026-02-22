import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import * as dotenv from "dotenv";
import { initializeApp, cert } from "firebase-admin/app";
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
  const pdfCollection = "pdfs-dev";
  const userCollection = "users-dev";

  const pdfsDocs = await db.collection(pdfCollection).get();
  const usersDocs = await db.collection(userCollection).get();

  const pdfs = pdfsDocs.docs;
  const users = usersDocs.docs;

  console.log("Total PDFs:", pdfs.length);
  console.log("Total Users:", users.length);

  const pdfsWithoutUser = pdfs.filter((pdf) => {
    return !users.some((user) => user.id === pdf.data().userId);
  });

  console.log("PDFs sem usuário:", pdfsWithoutUser.length);
  pdfsWithoutUser.forEach((pdf) => {
    console.log(" -", pdf.id);
  });

  pdfsWithoutUser.forEach((pdf) => {
    db.collection(pdfCollection).doc(pdf.id).delete();
  });
};

setImmediate(async () => {
  await main();
});
