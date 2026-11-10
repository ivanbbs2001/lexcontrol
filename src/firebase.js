import firebase from "firebase/compat/app";
import "firebase/compat/firestore";

// Config pública do Firebase (a proteção real vem das regras do Firestore, não do sigilo desta chave)
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDbTPc2dJ-4nZHL5nVwZFyfxBsA92s1Tzw",
  authDomain: "escritorioju2.firebaseapp.com",
  projectId: "escritorioju2",
  storageBucket: "escritorioju2.firebasestorage.app",
  messagingSenderId: "29136072854",
  appId: "1:29136072854:web:86a1d93e2373c79e2952b7",
};

// Mesmo valor em todos os dispositivos = dados compartilhados
export const WS = "meu-escritorio";

if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
export const db = firebase.firestore();
