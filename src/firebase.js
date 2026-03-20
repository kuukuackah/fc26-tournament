import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// 🔥 Replace these values with your Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyCJOVCCNJRF-EDeLdb-Go6EOwBC-00ma1s",
  authDomain: "game-ccd9a.firebaseapp.com",
  projectId: "game-ccd9a",
  storageBucket: "game-ccd9a.firebasestorage.app",
  messagingSenderId: "410937076160",
  appId: "1:410937076160:web:274995a631e8ace0da0025"
};


const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);