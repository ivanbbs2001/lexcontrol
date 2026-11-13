/* Modelos Word (.docx) do escritório: contratos (6 tipos), procurações (2) e declaração de hipossuficiência.
   Os arquivos em public/modelos/ têm marcadores {{CAMPO}}; aqui montamos os textos e preenchemos o .docx
   (mantém timbre, fontes e formatação originais). Carregado sob demanda. */
import JSZip from "jszip";

import { MODELOS_CONTRATO, MODELOS_PROCURACAO, MODELO_HIPO, num } from "./docConfig";
export { MODELOS_CONTRATO, MODELOS_PROCURACAO, MODELO_HIPO, num };

const BL = "________________";
const MESES = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];

/* ── números por extenso ── */
const U = ["zero","um","dois","três","quatro","cinco","seis","sete","oito","nove","dez","onze","doze","treze","quatorze","quinze","dezesseis","dezessete","dezoito","dezenove"];
const D = ["","","vinte","trinta","quarenta","cinquenta","sessenta","setenta","oitenta","noventa"];
const C = ["","cento","duzentos","trezentos","quatrocentos","quinhentos","seiscentos","setecentos","oitocentos","novecentos"];
function ate999(n) {
  if (n === 0) return "";
  if (n === 100) return "cem";
  const c = Math.floor(n / 100), r = n % 100, p = [];
  if (c) p.push(C[c]);
  if (r) p.push(r < 20 ? U[r] : D[Math.floor(r / 10)] + (r % 10 ? " e " + U[r % 10] : ""));
  return p.join(" e ");
}
export function extenso(n) {
  n = Math.floor(Math.abs(Number(n) || 0));
  if (n === 0) return "zero";
  const mi = Math.floor(n / 1e6), mil = Math.floor((n % 1e6) / 1000), r = n % 1000, partes = [];
  if (mi) partes.push(mi === 1 ? "um milhão" : ate999(mi) + " milhões");
  if (mil) partes.push(mil === 1 ? "mil" : ate999(mil) + " mil");
  if (r) partes.push(ate999(r));
  if (partes.length === 1) return partes[0];
  const ultimo = partes[partes.length - 1], precisaE = r ? (r < 100 || r % 100 === 0) : true;
  return partes.slice(0, -1).join(", ") + (precisaE ? " e " : ", ") + ultimo;
}
export function moeda(v) {
  const n = Math.round(num(v) * 100) / 100;
  const reais = Math.floor(n), cents = Math.round((n - reais) * 100);
  const fmt = n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  let ext = "";
  if (reais > 0) ext = extenso(reais) + (reais >= 1e6 && reais % 1e6 === 0 ? " de reais" : reais === 1 ? " real" : " reais");
  if (cents > 0) ext += (ext ? " e " : "") + extenso(cents) + (cents === 1 ? " centavo" : " centavos");
  return `R$ ${fmt} (${ext || "zero reais"})`;
}
export const percentual = v => {
  const n = num(v); if (!n) return `${BL}% (${BL})`;
  const [i, f] = String(n).split(".");
  return `${n.toLocaleString("pt-BR")}% (${extenso(i)}${f ? " vírgula " + f.split("").map(d => U[+d]).join(" ") : ""} por cento)`;
};
const dBR = iso => { if (!iso) return BL; const [y, m, d] = iso.split("-"); return `${d}/${m}/${y}`; };
const dExt = iso => { const [y, m, d] = (iso || new Date().toISOString().slice(0, 10)).split("-"); return `${d} de ${MESES[+m - 1]} de ${y}`; };
const diaDe = iso => iso ? String(+iso.split("-")[2]).padStart(2, "0") : BL;

/* ── texto de honorários fixos (parcelados, com ou sem entrada) ── */
export function fixoTexto(f) {
  const total = num(f.valorTotal), entrada = num(f.entrada), n = Math.max(1, parseInt(f.nParcelas) || 1);
  const restante = Math.max(0, total - entrada);
  const parcela = num(f.valorParcela) || Math.round(restante / n * 100) / 100;
  const pix = f.pix ? f.pix : BL;
  const dia = diaDe(f.primeiraData);
  if (!total) return `${BL}.`;
  if (entrada > 0)
    return `${moeda(total)}, a serem pagos via PIX, por meio da chave ${pix}, da seguinte forma: entrada de ${moeda(entrada)}, com vencimento em ${dBR(f.entradaData)}, e ${n} (${extenso(n)}) prestações mensais subsequentes de ${moeda(parcela)} cada, com vencimento todo dia ${dia} de cada mês, iniciando-se em ${dBR(f.primeiraData)}.`;
  if (n > 1)
    return `${moeda(total)} a serem pagos via PIX (chave: ${pix}) em ${n} (${extenso(n)}) prestações subsequentes de igual valor de ${moeda(parcela)}, em todo dia ${dia} de cada mês, iniciando-se em ${dBR(f.primeiraData)}.`;
  return `${moeda(total)}, a serem pagos via PIX (chave: ${pix}), à vista, com vencimento em ${dBR(f.primeiraData)}.`;
}

/* ── qualificação do cliente ── */
const flex = (w, fem) => !w ? "" : fem ? w.replace(/o$/i, "a").replace(/or$/i, "ora") : w;
export function dadosCliente(f) {
  const fem = f.sexo === "F";
  const nac = f.nacionalidade || (fem ? "brasileira" : "brasileiro");
  const civil = flex(f.estadoCivil, fem) || BL;
  const prof = f.profissao || BL;
  const rg = f.rg || BL, cpf = f.cpf || BL;
  const end = f.endereco || BL;
  const cep = f.cep ? `, CEP ${f.cep}` : `, CEP ${BL}`;
  const cid = f.cidade || BL, uf = f.uf || "PR";
  return `${nac}, ${civil}, ${prof}, ${fem ? "portadora" : "portador"} do RG nº. ${rg}, ${fem ? "inscrita" : "inscrito"} no CPF sob o nº. ${cpf}, ${fem ? "residente e domiciliada" : "residente e domiciliado"} na ${end}${cep}, na Cidade de ${cid} - ${uf}, telefone para contato ${f.telefone || BL}, e-mail ${f.email || BL}`;
}

export function valoresDoModelo(modelo, f) {
  const nome = (f.nome || BL).trim();
  const v = {
    NOME: nome.toUpperCase(), NOME_MAI: nome.toUpperCase(),
    DADOS: dadosCliente(f), DATA: dExt(f.data),
    OBJETO: (f.objeto || BL).trim().replace(/\.+$/, ""),
    PERC: percentual(f.perc),
    FIXO_TEXTO: fixoTexto(f),
    FIXO_EXTRAJ: f.fixoExtraj ? moeda(f.fixoExtraj) : `R$ ${BL} (${BL})`,
  };
  return v;
}

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function gerarDocx(modeloId, valores) {
  const url = `${import.meta.env.BASE_URL}modelos/${modeloId}.docx`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Modelo não encontrado: " + modeloId);
  const zip = await JSZip.loadAsync(await res.arrayBuffer());
  let xml = await zip.file("word/document.xml").async("string");
  xml = xml.replace(/\{\{([A-Z_]+)\}\}/g, (_, k) => esc(valores[k] ?? BL));
  zip.file("word/document.xml", xml);
  return zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
}

const slug = t => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
export async function baixarModelo(modelo, form) {
  const blob = await gerarDocx(modelo.id, valoresDoModelo(modelo, form));
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${modelo.id}-${slug(form.nome) || "cliente"}.docx`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
