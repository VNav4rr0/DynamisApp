
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';


const firebaseConfig = {
  apiKey: "AIzaSyDfbivc7RnKt1bILmuxYzJ8MvOEBWnAE18",
  authDomain: "dynamis-85157.firebaseapp.com",
  projectId: "dynamis-85157",
  storageBucket: "dynamis-85157.firebasestorage.app",
  messagingSenderId: "441186452486",
  appId: "1:441186452486:web:4fe2170e7b4464017caf87"
};

let app;


if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}


export const auth = getAuth(app);
