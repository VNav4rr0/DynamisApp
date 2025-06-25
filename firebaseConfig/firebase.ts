// firebaseConfig.ts
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDFbivc7RnkTbiLmuxyZJ8MvOEBWnAE18",
  authDomain: "dynamis-85157.firebaseapp.com",
  projectId: "dynamis-85157",
  storageBucket: "dynamis-85157.firebasestorage.app",
  messagingSenderId: "441186452486",
  appId: "1:441186452486:web:4fe2170e7b4464017caf87"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
export const db = firebase.firestore();