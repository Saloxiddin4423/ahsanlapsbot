const admin = require("firebase-admin");
const dotenvConfig = require("./dotenv");

// Firebase sozlamalari
const serviceAccount = {
  type: "service_account",
  project_id: dotenvConfig.FIREBASE_PROJECT_ID,
  private_key: dotenvConfig.FIREBASE_PRIVATE_KEY,
  client_email: dotenvConfig.FIREBASE_CLIENT_EMAIL,
};

// Firebase ulash
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
module.exports = db;
