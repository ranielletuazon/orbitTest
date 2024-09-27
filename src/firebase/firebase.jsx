
import { initializeApp } from "firebase/app";
import {getAuth} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBPbBdav4i3qO_9ijTn9mqGWxgnhBg2GaE",
  authDomain: "orbit-5c69d.firebaseapp.com",
  projectId: "orbit-5c69d",
  storageBucket: "orbit-5c69d.appspot.com",
  messagingSenderId: "617016224424",
  appId: "1:617016224424:web:085153bef4271edf7a309d",
  measurementId: "G-1VGQJ08MHZ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


export { auth, db };