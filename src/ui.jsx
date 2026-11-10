import { useState, useEffect } from "react";

// Diálogos próprios (substituem confirm()/alert() do navegador)
let push = null;
const queue = [];
const open = d => new Promise(res => { const item = { ...d, res }; push ? push(item) : queue.push(item); });
export const askConfirm = message => open({ kind: "confirm", message });
export const notify = message => open({ kind: "alert", message });

export function DialogHost({ T }) {
  const [cur, setCur] = useState(null);
  useEffect(() => { push = setCur; if (queue.length) setCur(queue.shift()); return () => { push = null; }; }, []);
  if (!cur) return null;
  const done = v => { cur.res(v); setCur(queue.length ? queue.shift() : null); };
  const btn = (primary, label, v) => (
    <button onClick={() => done(v)} className="bhov" autoFocus={primary}
      style={{ background: primary ? T.accent : T.card2, color: primary ? T.accentText : T.text, border: `1px solid ${T.border2}`, borderRadius: 8, padding: "9px 20px", fontFamily: "'DM Mono',monospace", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{label}</button>
  );
  return (
    <div onClick={e => e.target === e.currentTarget && done(cur.kind === "alert")}
      style={{ position: "fixed", inset: 0, background: "#000a", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
      <div role="dialog" style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, maxWidth: 420, width: "100%", padding: "22px 24px", boxShadow: "0 30px 90px #0009" }}>
        <div style={{ whiteSpace: "pre-line", color: T.strong, fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>{cur.message}</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          {cur.kind === "confirm" ? <>{btn(false, "Cancelar", false)}{btn(true, "Confirmar", true)}</> : btn(true, "OK", true)}
        </div>
      </div>
    </div>
  );
}
