import { db, WS } from "./firebase";

// Backups ficam na mesma coleção "data" (ids "backup-AAAA-MM-DD"), assim as regras atuais do Firestore já cobrem.
const col = () => db.collection("workspaces").doc(WS).collection("data");
const KEEP = 8, EVERY_DAYS = 7;

export const backupPayload = d => ({ ...d, savedAt: new Date().toISOString() });

export async function listBackups() {
  const snap = await col().get();
  return snap.docs.filter(d => d.id.startsWith("backup-"))
    .map(d => ({ id: d.id, data: d.data() }))
    .sort((a, b) => b.id.localeCompare(a.id));
}

export async function runAutoBackup(payload) {
  const all = await listBackups();
  const last = all[0];
  if (last && Date.now() - new Date(last.data.savedAt || 0).getTime() < EVERY_DAYS * 864e5) return false;
  const today = new Date();
  const id = `backup-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  await col().doc(id).set(payload);
  const extra = [{ id }, ...all.filter(b => b.id !== id)].slice(KEEP);
  await Promise.all(extra.map(b => col().doc(b.id).delete()));
  return true;
}
