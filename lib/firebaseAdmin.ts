import admin from "firebase-admin";
import path from "path";
import fs from "fs";

// Using a module-level variable to prevent re-initialization in Next.js development mode
if (!admin.apps.length) {
  try {
    const serviceAccountPath = path.resolve(process.cwd(), "config/serviceAccountKey.json");
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin initialized successfully.");
  } catch (error) {
    console.error("Firebase Admin initialization error", error);
  }
}

export const adminAuth = admin.auth();
