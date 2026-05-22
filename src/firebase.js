import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  createUserWithEmailAndPassword,
  getRedirectResult,
  getAuth,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
} from "firebase/auth";

// Firebase web config is public at runtime, but keeping it in env files avoids
// hardcoding project identifiers in tracked source.
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || '',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.FIREBASE_APP_ID || '',
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || ''
};

const hasFirebaseConfig = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.appId,
].every((value) => value && !value.startsWith('your_') && !value.startsWith('your-'));

const firebaseAuthConfigError = hasFirebaseConfig
  ? ''
  : 'Firebase authentication is not configured. Replace the placeholder FIREBASE_* values in .env with your Firebase web app credentials.';

function ensureFirebaseAuthConfigured() {
  if (firebaseAuthConfigError) {
    throw new Error(firebaseAuthConfigError);
  }
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = hasFirebaseConfig && typeof window !== 'undefined'
  ? getAnalytics(app)
  : null;
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  prompt: "select_account",
});

export {
  auth,
  analytics,
  createUserWithEmailAndPassword,
  ensureFirebaseAuthConfigured,
  firebaseAuthConfigError,
  provider,
  RecaptchaVerifier,
  getRedirectResult,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
};
