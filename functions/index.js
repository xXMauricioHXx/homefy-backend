require("dotenv").config({ path: __dirname + "/.env" });
const { initializeApp } = require("firebase-admin/app");

initializeApp({
  storageBucket: process.env.HOMEFY_FIREBASE_STORAGE_BUCKET,
});

const scrapFunctions = require("./scrap");

console.log("Starting functions");
exports.scrap = scrapFunctions;

try {
  const v1Functions = require("./v1/dist");
  exports.v1 = v1Functions;
  console.log("v1 functions loaded successfully");
} catch (e) {
  console.warn("[WARN] v1 not built yet");
}
