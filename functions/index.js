const { initializeApp } = require("firebase-admin/app");

initializeApp({
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

const scrapFunctions = require("./scrap");

exports.scrap = scrapFunctions;
