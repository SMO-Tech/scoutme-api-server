import admin, { ServiceAccount } from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PROJECT_ID) {
  throw new Error("Missing required Firebase environment variables");
}

// Properly format the private key - handle escaped newlines
let privateKey = process.env.FIREBASE_PRIVATE_KEY;
// Replace escaped newlines (both \\n and \n formats)
privateKey = privateKey.replace(/\\n/g, "\n");
// Ensure the key has proper PEM format markers
if (!privateKey.includes("-----BEGIN")) {
  throw new Error("Invalid private key format: Missing BEGIN marker. Ensure FIREBASE_PRIVATE_KEY includes -----BEGIN PRIVATE KEY-----");
}
if (!privateKey.includes("-----END")) {
  throw new Error("Invalid private key format: Missing END marker. Ensure FIREBASE_PRIVATE_KEY includes -----END PRIVATE KEY-----");
}

const serviceAccount = {
  type: process.env.FIREBASE_TYPE || "service_account", 
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: privateKey,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
  token_uri: process.env.FIREBASE_TOKEN_URI || "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN || "googleapis.com",
} as ServiceAccount;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

}

export default admin;
