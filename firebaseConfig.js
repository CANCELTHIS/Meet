import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDFkMKLy8OaTMjtZGY-1j1lYU1RX0zZ_zY",
  authDomain: "shekla-837ef.firebaseapp.com",
  projectId: "shekla-837ef",
  storageBucket: "shekla-837ef.appspot.com",
  messagingSenderId: "700085300091",
  appId: "1:700085300091:web:592d096ba959c7c9846bde",
  measurementId: "G-SPPE99YYYR",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Add calendar scope
googleProvider.addScope("https://www.googleapis.com/auth/calendar.readonly");

export { auth, googleProvider };
