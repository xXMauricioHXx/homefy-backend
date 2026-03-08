import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import * as dotenv from "dotenv";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { v4 as uuidv4 } from "uuid";

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
  const pdfCollection = "pdfs";

  const pdfsDocs = await db.collection(pdfCollection).get();

  await Promise.all(
    pdfsDocs.docs.map(async (pdf, index) => {
      const oldData = pdf.data();

      if (oldData.pdfId == "995e4684-ce8a-4a2f-a3a7-c62c884ee61a") return;

      const date = oldData.createdAt.toDate();

      const assets = oldData.property?.gallery?.map((image, index) => {
        const type = index == 0 ? "MAIN" : "GALLERY";

        return {
          id: uuidv4(),
          type,
          order: index,
          status: "CLEANED",
          clean: {
            provider: "dewatermark",
            url: image,
          },
          original: {
            provider: "",
            url: "",
          },
          createdAt: date,
          updatedAt: date,
        };
      });

      const rendition = {
        id: uuidv4(),
        type: "PDF",
        status: "READY",
        config: {
          ...(oldData.config?.colors && { colors: oldData.config?.colors }),
        },
        createdAt: date,
        updatedAt: date,
      };

      const newStructure = {
        id: oldData.pdfId,
        source: {
          providerKey: "foxter",
          url: "",
          fingerprint: oldData.enterpriseId,
        },
        brand: {
          name: oldData.brand?.name,
          location: oldData.brand?.location,
          headline: oldData.brand?.description,
        },
        details: {
          title: oldData.property?.resume,
          description: oldData.property?.description,
          areaSqm: oldData.property?.area,
          bedrooms: oldData.property?.bedrooms,
          bathrooms: oldData.property?.bathrooms,
          parking: oldData.property?.parking,
          pricing: {
            priceText: oldData.property?.price,
            pricePerSqmText: oldData.property?.pricePerSqm,
            condominiumText: oldData.property?.condominium,
            iptuText: oldData.property?.iptu,
          },
          features: oldData.property?.features,
          infrastructures: oldData.property?.infrastructures,
        },
        status: "CREATED",
        createdAt: date,
        updatedAt: date,
        ownerUserId: oldData.userId,
      };

      await db.collection("properties").doc(oldData.pdfId).set(newStructure);

      assets.map((asset) => {
        db.collection("properties")
          .doc(oldData.pdfId)
          .collection("assets")
          .doc(asset.id)
          .set(asset);
      });

      await db
        .collection("properties")
        .doc(oldData.pdfId)
        .collection("renditions")
        .doc(rendition.id)
        .set(rendition);
    }),
  );
};

setImmediate(async () => {
  await main();
});
