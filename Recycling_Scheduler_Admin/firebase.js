import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyCmwSLC_J2KvhOj9nWxZd1d_O2pgpH_iaQ",
    authDomain: "obra-padre-cacho.firebaseapp.com",
    projectId: "obra-padre-cacho",
    storageBucket: "obra-padre-cacho.firebasestorage.app",
    messagingSenderId: "517656003079",
    appId: "1:517656003079:web:aa7170af4d136a7b2f60a2"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);