import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export default app;

// // Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";


// const firebaseConfig = {
//   apiKey: "AIzaSyCtc_V6wURp2eehFPoFfJustybBa5bWZP4",
//   authDomain: "lexguard-ai-35414.firebaseapp.com",
//   projectId: "lexguard-ai-35414",
//   storageBucket: "lexguard-ai-35414.firebasestorage.app",
//   messagingSenderId: "454568419885",
//   appId: "1:454568419885:web:4fd5ac395bb5ef2f1ccea4",
//   measurementId: "G-ZT7FE5VFT6"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
