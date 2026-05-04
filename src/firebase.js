import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Workspace ID — one firm = one workspace, all devices share data
export const WORKSPACE_ID = import.meta.env.VITE_WORKSPACE_ID || "default";

// ─── helpers ────────────────────────────────────────────────────────────────

/** Reference to a data document inside the workspace */
export const workspaceDoc = (name) =>
  doc(db, "workspaces", WORKSPACE_ID, "data", name);

/** Save an array to Firestore (overwrites) */
export async function saveList(name, items) {
  await setDoc(workspaceDoc(name), { items }, { merge: false });
}

/** Save a single value to Firestore */
export async function saveSetting(name, value) {
  await setDoc(workspaceDoc(name), { value }, { merge: false });
}

/** Subscribe to a list document; calls onChange(items[]) on every update */
export function subscribeList(name, onChange) {
  return onSnapshot(workspaceDoc(name), (snap) => {
    if (snap.exists()) onChange(snap.data().items ?? []);
    else onChange([]);
  });
}

/** Subscribe to a setting document; calls onChange(value) on every update */
export function subscribeSetting(name, onChange) {
  return onSnapshot(workspaceDoc(name), (snap) => {
    if (snap.exists()) onChange(snap.data().value);
  });
}
