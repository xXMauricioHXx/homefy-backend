const { initializeApp } = require("firebase-admin/app");
const { onRequest } = require("firebase-functions/v2/https");

initializeApp({
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

exports.hello = onRequest({ region: "us-central1" }, (req, res) => {
  const name = req.query.name || "Mundo";
  res.status(200).send(`Hello ${name}`);
});

const scrapFunctions = require("./scrap");

exports.scrap = scrapFunctions;
