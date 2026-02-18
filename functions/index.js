require("dotenv").config({ path: __dirname + "/.env" });
const { initializeApp } = require("firebase-admin/app");

initializeApp({
  storageBucket: process.env.HOMEFY_FIREBASE_STORAGE_BUCKET,
});

const scrapFunctions = require("./scrap");

console.log("Starting functions");
exports.scrap = scrapFunctions;
