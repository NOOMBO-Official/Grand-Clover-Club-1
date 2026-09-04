import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB69BSnYaLg8J8ZReFyujyWBOmL7cHoWNk",
  authDomain: "cosmic-backbone-489617-j1.firebaseapp.com",
  projectId: "cosmic-backbone-489617-j1",
  storageBucket: "cosmic-backbone-489617-j1.firebasestorage.app",
  messagingSenderId: "273263374519",
  appId: "1:273263374519:web:6f7606f20be2743d5fdd32"
};

export const app = initializeApp(firebaseConfig);

// Force long polling to prevent "client is offline" errors in iframe environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, "ai-studio-fe50f7b2-1769-43b4-a49f-39e1d21e2429");

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
