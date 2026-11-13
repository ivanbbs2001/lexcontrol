/* Listas de modelos e utilitário numérico (leve; sem dependências) */
export const MODELOS_CONTRATO = [
  { id: "contrato-fixo",               nome: "Valor fixo",             grupo: "Juliana",  honor: "fixo" },
  { id: "contrato-percentual",         nome: "Percentual",             grupo: "Juliana",  honor: "perc" },
  { id: "contrato-misto",              nome: "Misto (fixo + percentual)", grupo: "Juliana", honor: "misto" },
  { id: "contrato-parceria-fixo",      nome: "Valor fixo (parceria)",  grupo: "Parceria", honor: "fixo" },
  { id: "contrato-parceria-percentual",nome: "Percentual (parceria)",  grupo: "Parceria", honor: "perc" },
  { id: "contrato-parceria-misto",     nome: "Misto (parceria)",       grupo: "Parceria", honor: "misto" },
];
export const MODELOS_PROCURACAO = [
  { id: "procuracao-juliana",  nome: "Procuração — Juliana",  grupo: "Juliana" },
  { id: "procuracao-parceria", nome: "Procuração — Parceria (Juliana e Talita)", grupo: "Parceria" },
];
export const MODELO_HIPO = { id: "declaracao-hipossuficiencia", nome: "Declaração de hipossuficiência" };

export const num = v => {
  const s = String(v ?? "").trim().replace(/[R$\s]/g, "");
  if (!s) return 0;
  const n = s.includes(",") ? Number(s.replace(/\./g, "").replace(",", ".")) : Number(s);
  return Number.isFinite(n) ? n : 0;
};
