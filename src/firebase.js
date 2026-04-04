import { initializeApp } from "firebase/app";
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

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA9w4m9lRm96skuohivcdLp2kboFXZ5z3c",
  authDomain: "publicpolicyhub-2f323.firebaseapp.com",
  projectId: "publicpolicyhub-2f323",
  storageBucket: "publicpolicyhub-2f323.firebasestorage.app",
  messagingSenderId: "75188438645",
  appId: "1:75188438645:web:c97a12b870645a368fda3c",
  measurementId: "G-GZ1TM8SERY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  prompt: "select_account",
});

export {
  auth,
  createUserWithEmailAndPassword,
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
