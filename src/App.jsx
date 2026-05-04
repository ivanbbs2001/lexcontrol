import { useState, useEffect, useRef, useCallback } from "react";
import * as mammoth from "mammoth";
import {
  saveList,
  saveSetting,
  subscribeList,
  subscribeSetting,
} from "./firebase.js";

/* ═══════════════════════════════════════════════════════════════
   THEMES
═══════════════════════════════════════════════════════════════ */
const THEMES = {
  dark: {
    id: "dark", label: "🌙 Escuro",
    bg: "#06101e", card: "#0c1828", card2: "#091422",
    border: "#192c44", border2: "#243d5c",
    text: "#c2d2e6", muted: "#4e6278", strong: "#daeaf8",
    accent: "#d4b86a", accentText: "#06101e", accentDim: "#1c1508",
    hover: "#112033", inp: "#091422",
    dangerBg: "#270d0d", dangerText: "#f87171", dangerBorder: "#7f1d1d",
    successBg: "#051e0f", successText: "#4ade80",
    warnBg: "#27190a", warnText: "#fbbf24",
    infoBg: "#081a34", infoText: "#60a5fa",
    hdr: "#040c18", stripe: "#081322",
    tabActive: "#d4b86a", tabActiveText: "#06101e",
    scrollThumb: "#243d5c",
  },
  light: {
    id: "light", label: "☀️ Claro",
    bg: "#f0ebe0", card: "#fdfaf4", card2: "#f5f0e8",
    border: "#d8cdb8", border2: "#b8a888",
    text: "#241808", muted: "#7a6850", strong: "#100c04",
    accent: "#8a6010", accentText: "#ffffff", accentDim: "#fdf5e0",
    hover: "#ebe4d4", inp: "#f5f0e8",
    dangerBg: "#fff3f3", dangerText: "#991c1c", dangerBorder: "#fca5a5",
    successBg: "#ecfdf5", successText: "#166534",
    warnBg: "#fffbeb", warnText: "#b45309",
    infoBg: "#eff6ff", infoText: "#1e40af",
    hdr: "#e4ddd0", stripe: "#f8f3ea",
    tabActive: "#8a6010", tabActiveText: "#ffffff",
    scrollThumb: "#b8a888",
  },
  industrial: {
    id: "industrial", label: "🔩 Industrial",
    bg: "#c5bdb0", card: "#d5cfc3", card2: "#cdc7ba",
    border: "#a09890", border2: "#767068",
    text: "#1a1410", muted: "#58504a", strong: "#0c0804",
    accent: "#bf4e18", accentText: "#ffffff", accentDim: "#f2ddd4",
    hover: "#beb8ac", inp: "#c8c2b6",
    dangerBg: "#eedcdc", dangerText: "#7a1010", dangerBorder: "#cc9090",
    successBg: "#d4ecd4", successText: "#185018",
    warnBg: "#ece4c8", warnText: "#7a4808",
    infoBg: "#d0e0ec", infoText: "#183060",
    hdr: "#b4ada0", stripe: "#cfc9bc",
    tabActive: "#bf4e18", tabActiveText: "#ffffff",
    scrollThumb: "#767068",
  },
};

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════ */
const MONTHS_FULL  = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const MONTHS_SHORT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const COST_CATS    = ["Aluguel","Energia","Internet","Telefone","Software","Pessoal","Contabilidade","Material de Escritório","Transporte","Outros"];
const STATUS_CFG   = {
  pendente:      { label: "Pendente",               icon: "⏳", color: "#f59e0b" },
  em_pagamento:  { label: "Em Pagamento",            icon: "💳", color: "#3b82f6" },
  pago:          { label: "Pago",                    icon: "✅", color: "#10b981" },
  pago_pendente: { label: "Pago · Serviço Pendente", icon: "⚠️", color: "#a78bfa" },
};
const EXTRACTION_PROMPT = `Você é especialista em análise de contratos jurídicos brasileiros.
Analise o contrato e retorne SOMENTE um JSON válido, sem texto extra, sem markdown:
{
  "advogado": "nome do advogado ou escritório prestador do serviço",
  "cliente": "nome completo do cliente contratante",
  "valorTotal": "valor numérico com ponto decimal ex: 8500.00",
  "formaPagamento": "forma de pagamento ex: À vista / Parcelado / PIX / Boleto / Transferência",
  "totalParcelas": "número inteiro de parcelas ex: 3",
  "valorParcela": "valor de cada parcela com ponto ex: 2833.33",
  "prazos": "descrição dos prazos ou datas de pagamento",
  "observacoes": "cláusulas relevantes sobre honorários, multas, reajuste ou condições especiais"
}
Se não encontrar algum campo, deixe como string vazia "".`;

/* ═══════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════ */
const genId  = () => Date.now() + Math.floor(Math.random() * 10000);
const fmt    = (v) => {
  const n = parseFloat(String(v ?? 0).replace(/[^\d.,-]/g,"").replace(",","."));
  return isNaN(n) ? (String(v)||"—") : n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
};
const fmtNum = (v) => parseFloat(String(v ?? 0).replace(/[^\d.,-]/g,"").replace(",",".")) || 0;

async function toBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res(r.result.split(",")[1]);
    r.onerror = () => rej(new Error("Falha ao ler arquivo"));
    r.readAsDataURL(file);
  });
}
async function docxToText(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = async (e) => { try { res((await mammoth.extractRawText({arrayBuffer:e.target.result})).value); } catch(err){rej(err);} };
    r.onerror = () => rej(new Error("Falha ao ler Word"));
    r.readAsArrayBuffer(file);
  });
}

/* ═══════════════════════════════════════════════════════════════
   SHARED UI ATOMS
═══════════════════════════════════════════════════════════════ */
const Btn = ({ T, variant="primary", onClick, children, style={}, disabled }) => {
  const base = { border:"none", borderRadius:7, padding:"8px 18px", cursor:disabled?"not-allowed":"pointer", fontFamily:"'DM Mono',monospace", fontSize:12, fontWeight:600, transition:"opacity .15s", opacity:disabled?.5:1, ...style };
  const variants = {
    primary:   { background:T.accent,    color:T.accentText },
    secondary: { background:T.border,    color:T.text, fontWeight:400 },
    danger:    { background:T.dangerBg,  color:T.dangerText, border:`1px solid ${T.dangerBorder}` },
    ghost:     { background:"transparent", color:T.muted, border:`1px solid ${T.border2}` },
  };
  return <button onClick={onClick} disabled={disabled} style={{...base,...variants[variant]}}>{children}</button>;
};

const Field = ({ T, label, value, onChange, type="text", options, style={} }) => (
  <div style={{display:"flex",flexDirection:"column",gap:5}}>
    <label style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em"}}>{label}</label>
    {options ? (
      <select value={value} onChange={e=>onChange(e.target.value)} style={{background:T.inp,border:`1px solid ${T.border2}`,borderRadius:6,padding:"7px 10px",color:T.text,fontFamily:"'DM Mono',monospace",fontSize:12,...style}}>
        {options.map(o=><option key={o.value??o} value={o.value??o}>{o.label??o}</option>)}
      </select>
    ) : type==="textarea" ? (
      <textarea value={value} onChange={e=>onChange(e.target.value)} rows={3} style={{background:T.inp,border:`1px solid ${T.border2}`,borderRadius:6,padding:"7px 10px",color:T.text,fontFamily:"'DM Mono',monospace",fontSize:12,resize:"vertical",...style}}/>
    ) : (
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} style={{background:T.inp,border:`1px solid ${T.border2}`,borderRadius:6,padding:"7px 10px",color:T.text,fontFamily:"'DM Mono',monospace",fontSize:12,...style}}/>
    )}
  </div>
);

const StatCard = ({ T, label, value, color, sub }) => (
  <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"14px 18px",flex:"1 1 110px",textAlign:"center"}}>
    <div style={{fontSize:26,fontWeight:700,color:color??T.accent,fontFamily:"'Cormorant Garamond',serif",lineHeight:1}}>{value}</div>
    {sub&&<div style={{fontSize:12,color:color??T.accent,fontWeight:600,marginTop:2}}>{sub}</div>}
    <div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginTop:4}}>{label}</div>
  </div>
);

const Modal = ({ T, title, subtitle, onClose, children, footer, width=660 }) => (
  <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:"#00000088",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20}}>
    <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,width:"100%",maxWidth:width,maxHeight:"92vh",display:"flex",flexDirection:"column",boxShadow:"0 30px 90px #0009"}}>
      <div style={{padding:"20px 24px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:T.accent,fontWeight:700}}>{title}</div>
          {subtitle&&<div style={{fontSize:11,color:T.muted,marginTop:2}}>{subtitle}</div>}
        </div>
        <button onClick={onClose} style={{background:"none",border:"none",color:T.muted,fontSize:20,cursor:"pointer",lineHeight:1}}>✕</button>
      </div>
      <div style={{overflowY:"auto",flex:1,padding:"20px 24px"}}>{children}</div>
      {footer&&<div style={{padding:"14px 24px",borderTop:`1px solid ${T.border}`,display:"flex",justifyContent:"flex-end",gap:10}}>{footer}</div>}
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   TAB: CONTRATOS
═══════════════════════════════════════════════════════════════ */
function ContractsTab({ T, contracts, setContracts }) {
  const [loading,   setLoading]   = useState(false);
  const [loadMsg,   setLoadMsg]   = useState("");
  const [error,     setError]     = useState("");
  const [drag,      setDrag]      = useState(false);
  const [modal,     setModal]     = useState(null);
  const [editMode,  setEditMode]  = useState(false);
  const [editData,  setEditData]  = useState({});
  const [newAdv,    setNewAdv]    = useState({ nome:"", percentual:"" });
  const [newSched,  setNewSched]  = useState({ mes:new Date().getMonth()+1, ano:new Date().getFullYear(), valor:"", descricao:"", pago:false });
  const fileRef = useRef();

  async function processFile(file) {
    setError(""); setLoading(true); setLoadMsg("Lendo arquivo...");
    try {
      const isPdf  = file.type === "application/pdf";
      const isDocx = file.name.toLowerCase().endsWith(".docx");
      if (!isPdf && !isDocx) throw new Error("Formato inválido. Use PDF ou .docx");

      let messages;
      if (isPdf) {
        setLoadMsg("Enviando para análise IA...");
        const b64 = await toBase64(file);
        messages = [{ role:"user", content:[
          { type:"document", source:{ type:"base64", media_type:"application/pdf", data:b64 } },
          { type:"text", text:EXTRACTION_PROMPT }
        ]}];
      } else {
        setLoadMsg("Extraindo texto do Word...");
        const text = await docxToText(file);
        messages = [{ role:"user", content:`${EXTRACTION_PROMPT}\n\n---\n${text}` }];
      }

      setLoadMsg("Analisando contrato com IA...");
      const res  = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json", "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY, "anthropic-version":"2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, messages }),
      });
      const data = await res.json();
      const txt  = data.content?.find(b=>b.type==="text")?.text ?? "{}";
      const p    = JSON.parse(txt.replace(/```json|```/g,"").trim());

      const nc = {
        id:genId(), nomeArquivo:file.name,
        advogado:p.advogado||"", cliente:p.cliente||"",
        valorTotal:p.valorTotal||"", formaPagamento:p.formaPagamento||"",
        totalParcelas:parseInt(p.totalParcelas)||1,
        valorParcela:p.valorParcela||"", prazos:p.prazos||"",
        observacoes:p.observacoes||"", status:"pendente",
        dataUpload:new Date().toLocaleDateString("pt-BR"),
        coAdvogados:[], schedule:[],
      };
      setContracts(prev => [nc, ...prev]);
    } catch(e) { setError(e.message||"Erro ao processar contrato."); }
    finally { setLoading(false); setLoadMsg(""); }
  }

  function openModal(c) { setModal(c); setEditData({...c}); setEditMode(false); setNewAdv({nome:"",percentual:""}); setNewSched({mes:new Date().getMonth()+1,ano:new Date().getFullYear(),valor:"",descricao:"",pago:false}); }

  function saveEdit() {
    setContracts(p=>p.map(c=>c.id===editData.id?{...editData}:c));
    setModal({...editData}); setEditMode(false);
  }

  function updateStatus(id, status) {
    setContracts(p=>p.map(c=>c.id===id?{...c,status}:c));
    if (modal?.id===id) setModal(s=>({...s,status}));
  }

  function deleteContract(id) {
    if (!window.confirm("Remover este contrato permanentemente?")) return;
    setContracts(p=>p.filter(c=>c.id!==id)); setModal(null);
  }

  function addCoAdv() {
    if (!newAdv.nome||!newAdv.percentual) return;
    setEditData(d=>({...d, coAdvogados:[...(d.coAdvogados||[]),{id:genId(),...newAdv}]}));
    setNewAdv({nome:"",percentual:""});
  }
  function removeCoAdv(id) { setEditData(d=>({...d,coAdvogados:d.coAdvogados.filter(a=>a.id!==id)})); }

  function addSched() {
    if (!newSched.valor) return;
    setEditData(d=>({...d, schedule:[...(d.schedule||[]),{id:genId(),...newSched,valor:fmtNum(newSched.valor)}]}));
    setNewSched({mes:new Date().getMonth()+1,ano:new Date().getFullYear(),valor:"",descricao:"",pago:false});
  }
  function toggleSchedPago(sid) { setEditData(d=>({...d,schedule:d.schedule.map(s=>s.id===sid?{...s,pago:!s.pago}:s)})); }
  function removeSched(sid)      { setEditData(d=>({...d,schedule:d.schedule.filter(s=>s.id!==sid)})); }

  const totalValue = contracts.reduce((s,c)=>s+fmtNum(c.valorTotal),0);

  return (
    <div>
      {/* Stats */}
      <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>
        <StatCard T={T} label="Contratos"    value={contracts.length} />
        <StatCard T={T} label="Pendentes"    value={contracts.filter(c=>c.status==="pendente").length}                             color="#f59e0b"/>
        <StatCard T={T} label="Em Pagamento" value={contracts.filter(c=>c.status==="em_pagamento").length}                         color="#3b82f6"/>
        <StatCard T={T} label="Quitados"     value={contracts.filter(c=>c.status==="pago"||c.status==="pago_pendente").length}     color="#10b981"/>
        <StatCard T={T} label="Carteira Total" sub={fmt(totalValue)} value="" />
      </div>

      {/* Upload zone */}
      <div
        onDragOver={e=>{e.preventDefault();setDrag(true);}}
        onDragLeave={()=>setDrag(false)}
        onDrop={e=>{e.preventDefault();setDrag(false);const f=e.dataTransfer.files?.[0];if(f)processFile(f);}}
        onClick={()=>!loading&&fileRef.current?.click()}
        style={{border:`2px dashed ${drag?T.accent:T.border2}`,background:drag?T.accentDim:T.card2,borderRadius:12,padding:"26px",textAlign:"center",cursor:loading?"wait":"pointer",marginBottom:16,transition:"all .2s",minHeight:96,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <input ref={fileRef} type="file" accept=".pdf,.docx" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(f)processFile(f);e.target.value="";}}/>
        {loading ? (
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
            <div className="spin" style={{width:26,height:26,border:`3px solid ${T.border2}`,borderTopColor:T.accent,borderRadius:"50%"}}/>
            <span style={{color:T.muted,fontSize:12}}>{loadMsg}</span>
          </div>
        ) : <>
          <div style={{fontSize:26,marginBottom:6}}>📄</div>
          <div style={{color:T.text,fontWeight:500,fontSize:14}}>Enviar Contrato</div>
          <div style={{color:T.muted,fontSize:11,marginTop:3}}>Clique ou arraste — PDF ou Word (.docx) · IA extrai os dados automaticamente</div>
        </>}
      </div>

      {error&&<div style={{background:T.dangerBg,border:`1px solid ${T.dangerBorder}`,color:T.dangerText,borderRadius:8,padding:"9px 14px",marginBottom:14,fontSize:12}}>⚠ {error}</div>}

      {/* Table */}
      {contracts.length===0
        ? <div style={{textAlign:"center",color:T.muted,padding:"60px 0",fontSize:13}}>Nenhum contrato cadastrado. Envie o primeiro acima.</div>
        : <div style={{overflowX:"auto",borderRadius:10,border:`1px solid ${T.border}`}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr style={{background:T.card2}}>
                {["Arquivo","Advogado","Cliente","Valor Total","Forma Pgto","Parcelas","Status","Cadastro",""].map(h=>(
                  <th key={h} style={{padding:"9px 13px",textAlign:"left",fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em",borderBottom:`1px solid ${T.border}`,whiteSpace:"nowrap",fontWeight:500}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contracts.map((c,i)=>{
                const st=STATUS_CFG[c.status]||STATUS_CFG.pendente;
                return (
                  <tr key={c.id} className="row-hover" style={{background:i%2===0?T.card:T.stripe,borderBottom:`1px solid ${T.border}`}}>
                    <td style={{padding:"10px 13px",fontSize:11,color:T.muted,maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={c.nomeArquivo}>{c.nomeArquivo||"—"}</td>
                    <td style={{padding:"10px 13px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:4}}>
                        <span style={{background:T.infoBg,color:T.infoText,borderRadius:4,padding:"2px 8px",fontSize:12,whiteSpace:"nowrap"}}>{c.advogado||"—"}</span>
                        {(c.coAdvogados||[]).length>0&&<span title={`+${c.coAdvogados.length} advogado(s)`} style={{background:T.warnBg,color:T.warnText,borderRadius:10,padding:"1px 6px",fontSize:10}}>+{c.coAdvogados.length}</span>}
                      </div>
                    </td>
                    <td style={{padding:"10px 13px"}}>{c.cliente||"—"}</td>
                    <td style={{padding:"10px 13px",color:T.accent,fontWeight:700}}>{fmt(c.valorTotal)}</td>
                    <td style={{padding:"10px 13px",color:T.muted,fontSize:12}}>{c.formaPagamento||"—"}</td>
                    <td style={{padding:"10px 13px",color:T.muted,fontSize:12}}>{c.totalParcelas>1?`${c.totalParcelas}× ${fmt(c.valorParcela)}`:"À vista"}</td>
                    <td style={{padding:"10px 13px"}}>
                      <select value={c.status} onChange={e=>updateStatus(c.id,e.target.value)}
                        style={{background:T.card2,color:st.color,border:`1px solid ${st.color}55`,borderRadius:6,padding:"3px 8px",fontSize:11,fontFamily:"'DM Mono',monospace",cursor:"pointer",appearance:"none",outline:"none"}}>
                        {Object.entries(STATUS_CFG).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
                      </select>
                    </td>
                    <td style={{padding:"10px 13px",color:T.muted,fontSize:11,whiteSpace:"nowrap"}}>{c.dataUpload}</td>
                    <td style={{padding:"10px 13px"}}>
                      <div style={{display:"flex",gap:5}}>
                        <button onClick={()=>openModal(c)} className="btn-hover" style={{background:T.infoBg,border:"none",borderRadius:5,padding:"5px 9px",cursor:"pointer",fontSize:13}}>🔍</button>
                        <button onClick={()=>deleteContract(c.id)} className="btn-hover" style={{background:T.dangerBg,border:"none",borderRadius:5,padding:"5px 9px",cursor:"pointer",fontSize:13}}>🗑</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>}

      {/* Contract Modal */}
      {modal&&(
        <Modal T={T} title={modal.cliente||"Contrato"} subtitle={modal.nomeArquivo} onClose={()=>setModal(null)} width={720}
          footer={editMode
            ? <><Btn T={T} variant="secondary" onClick={()=>{setEditMode(false);setEditData({...modal});}}>Cancelar</Btn><Btn T={T} onClick={saveEdit}>💾 Salvar Alterações</Btn></>
            : <><Btn T={T} variant="danger" onClick={()=>deleteContract(modal.id)}>Remover</Btn><Btn T={T} onClick={()=>setEditMode(true)}>✏ Editar</Btn></>}>
          {editMode ? (
            <div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
                <Field T={T} label="Advogado"           value={editData.advogado}       onChange={v=>setEditData(d=>({...d,advogado:v}))}/>
                <Field T={T} label="Cliente"            value={editData.cliente}        onChange={v=>setEditData(d=>({...d,cliente:v}))}/>
                <Field T={T} label="Valor Total (R$)"   value={editData.valorTotal}     onChange={v=>setEditData(d=>({...d,valorTotal:v}))}/>
                <Field T={T} label="Forma de Pagamento" value={editData.formaPagamento} onChange={v=>setEditData(d=>({...d,formaPagamento:v}))}/>
                <Field T={T} label="Total de Parcelas"  value={editData.totalParcelas}  onChange={v=>setEditData(d=>({...d,totalParcelas:v}))} type="number"/>
                <Field T={T} label="Valor por Parcela"  value={editData.valorParcela}   onChange={v=>setEditData(d=>({...d,valorParcela:v}))}/>
                <div style={{gridColumn:"1/-1"}}><Field T={T} label="Prazos"       value={editData.prazos}       onChange={v=>setEditData(d=>({...d,prazos:v}))}/></div>
                <div style={{gridColumn:"1/-1"}}><Field T={T} label="Observações"  value={editData.observacoes}  onChange={v=>setEditData(d=>({...d,observacoes:v}))} type="textarea"/></div>
                <div style={{gridColumn:"1/-1"}}><Field T={T} label="Status" value={editData.status} onChange={v=>setEditData(d=>({...d,status:v}))} options={Object.entries(STATUS_CFG).map(([k,v])=>({value:k,label:`${v.icon} ${v.label}`}))}/></div>
              </div>

              {/* Co-lawyers */}
              <div style={{marginBottom:20}}>
                <div style={{fontSize:11,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Co-advogados / Divisão de Honorários</div>
                {(editData.coAdvogados||[]).map(a=>(
                  <div key={a.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,background:T.card2,borderRadius:7,padding:"7px 10px"}}>
                    <span style={{flex:1,color:T.infoText}}>{a.nome}</span>
                    <span style={{color:T.accent,fontWeight:600}}>{a.percentual}%</span>
                    <span style={{color:T.muted,fontSize:11}}>{fmt(fmtNum(editData.valorTotal)*fmtNum(a.percentual)/100)}</span>
                    <button onClick={()=>removeCoAdv(a.id)} style={{background:"none",border:"none",color:T.dangerText,cursor:"pointer",fontSize:14}}>✕</button>
                  </div>
                ))}
                {(editData.coAdvogados||[]).length>0&&(
                  <div style={{background:T.successBg,borderRadius:7,padding:"7px 10px",fontSize:12,color:T.successText,marginBottom:8}}>
                    {editData.advogado||"Adv. Principal"}: {100-(editData.coAdvogados||[]).reduce((s,a)=>s+fmtNum(a.percentual),0)}% = {fmt(fmtNum(editData.valorTotal)*(100-(editData.coAdvogados||[]).reduce((s,a)=>s+fmtNum(a.percentual),0))/100)}
                  </div>
                )}
                <div style={{display:"flex",gap:8}}>
                  <input placeholder="Nome do co-advogado" value={newAdv.nome} onChange={e=>setNewAdv(d=>({...d,nome:e.target.value}))} style={{flex:1,background:T.inp,border:`1px solid ${T.border2}`,borderRadius:6,padding:"6px 10px",color:T.text,fontFamily:"'DM Mono',monospace",fontSize:12}}/>
                  <input placeholder="%" value={newAdv.percentual} onChange={e=>setNewAdv(d=>({...d,percentual:e.target.value}))} type="number" min="0" max="100" style={{width:70,background:T.inp,border:`1px solid ${T.border2}`,borderRadius:6,padding:"6px 10px",color:T.text,fontFamily:"'DM Mono',monospace",fontSize:12}}/>
                  <Btn T={T} variant="ghost" onClick={addCoAdv}>+ Adicionar</Btn>
                </div>
              </div>

              {/* Schedule */}
              <div>
                <div style={{fontSize:11,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Cronograma de Pagamentos</div>
                {(editData.schedule||[]).map(s=>(
                  <div key={s.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,background:s.pago?T.successBg:T.card2,borderRadius:7,padding:"7px 10px"}}>
                    <input type="checkbox" checked={s.pago} onChange={()=>toggleSchedPago(s.id)} style={{cursor:"pointer"}}/>
                    <span style={{color:T.muted,fontSize:11,whiteSpace:"nowrap"}}>{MONTHS_SHORT[s.mes-1]}/{s.ano}</span>
                    <span style={{color:T.accent,fontWeight:600}}>{fmt(s.valor)}</span>
                    <span style={{flex:1,color:T.muted,fontSize:11}}>{s.descricao}</span>
                    <span style={{fontSize:11,color:s.pago?T.successText:T.warnText}}>{s.pago?"✅ Pago":"⏳ Pendente"}</span>
                    <button onClick={()=>removeSched(s.id)} style={{background:"none",border:"none",color:T.muted,cursor:"pointer"}}>✕</button>
                  </div>
                ))}
                <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:8}}>
                  <select value={newSched.mes} onChange={e=>setNewSched(d=>({...d,mes:Number(e.target.value)}))} style={{background:T.inp,border:`1px solid ${T.border2}`,borderRadius:6,padding:"6px 10px",color:T.text,fontFamily:"'DM Mono',monospace",fontSize:12}}>
                    {MONTHS_FULL.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
                  </select>
                  <input type="number" value={newSched.ano} onChange={e=>setNewSched(d=>({...d,ano:Number(e.target.value)}))} style={{width:80,background:T.inp,border:`1px solid ${T.border2}`,borderRadius:6,padding:"6px 10px",color:T.text,fontFamily:"'DM Mono',monospace",fontSize:12}}/>
                  <input placeholder="Valor R$" value={newSched.valor} onChange={e=>setNewSched(d=>({...d,valor:e.target.value}))} style={{width:110,background:T.inp,border:`1px solid ${T.border2}`,borderRadius:6,padding:"6px 10px",color:T.text,fontFamily:"'DM Mono',monospace",fontSize:12}}/>
                  <input placeholder="Descrição (ex: Parcela 1/3)" value={newSched.descricao} onChange={e=>setNewSched(d=>({...d,descricao:e.target.value}))} style={{flex:1,minWidth:140,background:T.inp,border:`1px solid ${T.border2}`,borderRadius:6,padding:"6px 10px",color:T.text,fontFamily:"'DM Mono',monospace",fontSize:12}}/>
                  <Btn T={T} variant="ghost" onClick={addSched}>+ Parcela</Btn>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
                {[
                  ["Advogado",modal.advogado],["Cliente",modal.cliente],
                  ["Valor Total",fmt(modal.valorTotal)],["Forma de Pagamento",modal.formaPagamento],
                  ["Parcelas",modal.totalParcelas>1?`${modal.totalParcelas}× ${fmt(modal.valorParcela)}`:"À vista"],
                  ["Status",`${STATUS_CFG[modal.status]?.icon} ${STATUS_CFG[modal.status]?.label}`],
                  ["Prazos",modal.prazos||"—"],["Cadastrado em",modal.dataUpload],
                ].map(([l,v])=>(
                  <div key={l} style={{background:T.card2,borderRadius:8,padding:"10px 13px",border:`1px solid ${T.border}`}}>
                    <div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:3}}>{l}</div>
                    <div style={{color:T.strong,fontSize:13}}>{v||"—"}</div>
                  </div>
                ))}
                {modal.observacoes&&(
                  <div style={{gridColumn:"1/-1",background:T.card2,borderRadius:8,padding:"10px 13px",border:`1px solid ${T.border}`}}>
                    <div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:3}}>Observações</div>
                    <div style={{color:T.text,fontSize:12,whiteSpace:"pre-wrap"}}>{modal.observacoes}</div>
                  </div>
                )}
              </div>

              {(modal.coAdvogados||[]).length>0&&(
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:11,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Divisão de Honorários</div>
                  <div style={{background:T.card2,borderRadius:8,border:`1px solid ${T.border}`,overflow:"hidden"}}>
                    {[{nome:modal.advogado||"Adv. Principal",percentual:100-(modal.coAdvogados||[]).reduce((s,a)=>s+fmtNum(a.percentual),0),principal:true},...(modal.coAdvogados||[])].map((a,i)=>(
                      <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"9px 13px",borderBottom:i<modal.coAdvogados.length?`1px solid ${T.border}`:"none"}}>
                        <span style={{flex:1,color:a.principal?T.accent:T.infoText,fontWeight:a.principal?600:400}}>{a.nome}</span>
                        <span style={{color:T.muted}}>{a.percentual}%</span>
                        <span style={{color:T.accent,fontWeight:600}}>{fmt(fmtNum(modal.valorTotal)*fmtNum(a.percentual)/100)}</span>
                        <div style={{width:60,height:4,background:T.border,borderRadius:2,overflow:"hidden"}}>
                          <div style={{width:`${a.percentual}%`,height:"100%",background:a.principal?T.accent:T.infoText,borderRadius:2}}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(modal.schedule||[]).length>0&&(
                <div>
                  <div style={{fontSize:11,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Cronograma de Pagamentos</div>
                  {(modal.schedule||[]).map(s=>(
                    <div key={s.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,background:s.pago?T.successBg:T.card2,borderRadius:7,padding:"8px 12px",border:`1px solid ${s.pago?T.successText+"33":T.border}`}}>
                      <span style={{color:T.muted,fontSize:11,minWidth:52}}>{MONTHS_SHORT[s.mes-1]}/{s.ano}</span>
                      <span style={{color:T.accent,fontWeight:700}}>{fmt(s.valor)}</span>
                      <span style={{flex:1,color:T.muted,fontSize:11}}>{s.descricao}</span>
                      <span style={{fontSize:11,color:s.pago?T.successText:T.warnText,fontWeight:600}}>{s.pago?"✅ Pago":"⏳ Pendente"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB: PAGAMENTOS
═══════════════════════════════════════════════════════════════ */
function PaymentsTab({ T, contracts, setContracts }) {
  const now = new Date();
  const [selMes, setSelMes] = useState(now.getMonth()+1);
  const [selAno, setSelAno] = useState(now.getFullYear());

  const entries = contracts.flatMap(c=>
    (c.schedule||[]).filter(s=>s.mes===selMes&&s.ano===selAno).map(s=>({...s,contrato:c}))
  );

  const totalEsperado = entries.reduce((s,e)=>s+fmtNum(e.valor),0);
  const totalRecebido = entries.filter(e=>e.pago).reduce((s,e)=>s+fmtNum(e.valor),0);
  const totalPendente = totalEsperado - totalRecebido;

  function togglePago(contratoId, schedId) {
    setContracts(prev=>prev.map(c=>c.id===contratoId?{...c,schedule:c.schedule.map(s=>s.id===schedId?{...s,pago:!s.pago}:s)}:c));
  }

  const noSchedule = contracts.filter(c=>c.status==="em_pagamento"&&!(c.schedule||[]).some(s=>s.mes===selMes&&s.ano===selAno));
  const years = Array.from({length:6},(_,i)=>now.getFullYear()-2+i);

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:T.accent,fontWeight:700}}>Pagamentos —</div>
        <select value={selMes} onChange={e=>setSelMes(Number(e.target.value))} style={{background:T.card,border:`1px solid ${T.border2}`,borderRadius:8,padding:"8px 14px",color:T.strong,fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600,cursor:"pointer"}}>
          {MONTHS_FULL.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
        </select>
        <select value={selAno} onChange={e=>setSelAno(Number(e.target.value))} style={{background:T.card,border:`1px solid ${T.border2}`,borderRadius:8,padding:"8px 14px",color:T.strong,fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600,cursor:"pointer"}}>
          {years.map(y=><option key={y} value={y}>{y}</option>)}
        </select>
        <div style={{flex:1}}/>
        {[-1,1].map(dir=>(
          <Btn key={dir} T={T} variant="ghost" onClick={()=>{let m=selMes+dir,a=selAno;if(m<1){m=12;a--;}if(m>12){m=1;a++;}setSelMes(m);setSelAno(a);}} style={{padding:"6px 12px"}}>{dir===-1?"← Anterior":"Próximo →"}</Btn>
        ))}
      </div>

      <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>
        <StatCard T={T} label="Esperado"    sub={fmt(totalEsperado)} value="" color={T.accent}/>
        <StatCard T={T} label="Recebido"    sub={fmt(totalRecebido)} value="" color="#10b981"/>
        <StatCard T={T} label="Pendente"    sub={fmt(totalPendente)} value="" color="#f59e0b"/>
        <StatCard T={T} label="Lançamentos" value={entries.length}/>
      </div>

      {totalEsperado>0&&(
        <div style={{marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:T.muted,marginBottom:4}}>
            <span>Progresso de recebimentos</span>
            <span>{Math.round(totalRecebido/totalEsperado*100)}%</span>
          </div>
          <div style={{height:8,background:T.border,borderRadius:4,overflow:"hidden"}}>
            <div style={{width:`${Math.min(100,totalRecebido/totalEsperado*100)}%`,height:"100%",background:T.accent,borderRadius:4,transition:"width .4s"}}/>
          </div>
        </div>
      )}

      {entries.length===0&&noSchedule.length===0 ? (
        <div style={{textAlign:"center",color:T.muted,padding:"60px 0"}}>
          <div style={{fontSize:32,marginBottom:12}}>📭</div>
          Nenhum pagamento registrado para {MONTHS_FULL[selMes-1]} de {selAno}.<br/>
          <span style={{fontSize:11}}>Adicione parcelas no cronograma de cada contrato.</span>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {entries.map(e=>{
            const c=e.contrato;
            const coAdvs=c.coAdvogados||[];
            const primPerc=100-coAdvs.reduce((s,a)=>s+fmtNum(a.percentual),0);
            const hasSplit=coAdvs.length>0;
            return (
              <div key={e.id} style={{background:e.pago?T.successBg:T.card,border:`1px solid ${e.pago?T.successText+"44":T.border}`,borderRadius:12,overflow:"hidden"}}>
                <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 18px"}}>
                  <input type="checkbox" checked={e.pago} onChange={()=>togglePago(c.id,e.id)} style={{width:18,height:18,cursor:"pointer",accentColor:T.accent}}/>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",gap:8,alignItems:"baseline",flexWrap:"wrap"}}>
                      <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,color:T.strong,fontWeight:600}}>{c.cliente}</span>
                      <span style={{fontSize:11,color:T.muted}}>·</span>
                      <span style={{fontSize:12,color:T.infoText}}>{c.advogado}</span>
                      {e.descricao&&<span style={{fontSize:11,color:T.muted}}>{e.descricao}</span>}
                    </div>
                    <div style={{fontSize:11,color:T.muted,marginTop:2}}>{c.formaPagamento} · {c.nomeArquivo}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:20,fontWeight:700,color:T.accent,fontFamily:"'Cormorant Garamond',serif"}}>{fmt(e.valor)}</div>
                    <div style={{fontSize:11,color:e.pago?T.successText:T.warnText,fontWeight:600}}>{e.pago?"✅ Recebido":"⏳ Aguardando"}</div>
                  </div>
                </div>
                {hasSplit&&(
                  <div style={{borderTop:`1px solid ${T.border}`,padding:"10px 18px",background:T.card2}}>
                    <div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Divisão Proporcional</div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      {[{nome:c.advogado||"Adv. Principal",percentual:primPerc},...coAdvs].map((a,i)=>(
                        <div key={i} style={{background:T.card,borderRadius:8,padding:"8px 12px",border:`1px solid ${T.border}`,flex:"1 1 140px"}}>
                          <div style={{fontSize:11,color:i===0?T.accent:T.infoText,fontWeight:600}}>{a.nome}</div>
                          <div style={{fontSize:13,color:T.strong,fontWeight:700}}>{fmt(fmtNum(e.valor)*fmtNum(a.percentual)/100)}</div>
                          <div style={{fontSize:10,color:T.muted}}>{a.percentual}% do pagamento</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {noSchedule.length>0&&(
            <div style={{background:T.warnBg,border:`1px solid ${T.warnText}44`,borderRadius:12,padding:"14px 18px"}}>
              <div style={{fontSize:11,color:T.warnText,fontWeight:600,marginBottom:8}}>⚠ Contratos Em Pagamento sem parcela registrada neste mês</div>
              {noSchedule.map(c=>(
                <div key={c.id} style={{fontSize:12,color:T.muted,marginBottom:4}}>· {c.cliente} ({c.advogado}) — {fmt(c.valorTotal)}</div>
              ))}
              <div style={{fontSize:11,color:T.muted,marginTop:6}}>Adicione parcelas no cronograma via aba Contratos.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB: CUSTOS OPERACIONAIS
═══════════════════════════════════════════════════════════════ */
function CostsTab({ T, costs, setCosts }) {
  const now = new Date();
  const [selMes,    setSelMes]   = useState(now.getMonth()+1);
  const [selAno,    setSelAno]   = useState(now.getFullYear());
  const [showForm,  setShowForm] = useState(false);
  const [form,      setForm]     = useState({descricao:"",categoria:"Aluguel",valor:"",recorrente:false,mes:now.getMonth()+1,ano:now.getFullYear(),pago:false});
  const [editId,    setEditId]   = useState(null);

  const monthly = costs.filter(c=>c.mes===selMes&&c.ano===selAno);
  const years = Array.from({length:6},(_,i)=>now.getFullYear()-2+i);

  function saveCost() {
    if (!form.descricao||!form.valor) return;
    if (editId) {
      setCosts(p=>p.map(c=>c.id===editId?{...form,id:editId,valor:fmtNum(form.valor)}:c));
      setEditId(null);
    } else {
      const base = {...form,id:genId(),valor:fmtNum(form.valor)};
      if (form.recorrente) {
        const all = Array.from({length:12},(_,i)=>{let m=form.mes+i,a=form.ano;while(m>12){m-=12;a++;}return{...base,id:i===0?base.id:genId(),mes:m,ano:a};});
        setCosts(p=>[...p,...all]);
      } else {
        setCosts(p=>[...p,base]);
      }
    }
    setForm({descricao:"",categoria:"Aluguel",valor:"",recorrente:false,mes:selMes,ano:selAno,pago:false});
    setShowForm(false);
  }

  function editCost(c)   { setForm({...c,valor:String(c.valor)}); setEditId(c.id); setShowForm(true); }
  function deleteCost(id){ setCosts(p=>p.filter(c=>c.id!==id)); }
  function togglePago(id){ setCosts(p=>p.map(c=>c.id===id?{...c,pago:!c.pago}:c)); }

  const totalMes     = monthly.reduce((s,c)=>s+fmtNum(c.valor),0);
  const totalPago    = monthly.filter(c=>c.pago).reduce((s,c)=>s+fmtNum(c.valor),0);
  const totalPendente= totalMes-totalPago;

  const byCat = COST_CATS.map(cat=>({cat,items:monthly.filter(c=>c.categoria===cat),total:monthly.filter(c=>c.categoria===cat).reduce((s,c)=>s+fmtNum(c.valor),0)})).filter(g=>g.items.length>0);

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:T.accent,fontWeight:700}}>Custos —</div>
        <select value={selMes} onChange={e=>setSelMes(Number(e.target.value))} style={{background:T.card,border:`1px solid ${T.border2}`,borderRadius:8,padding:"8px 14px",color:T.strong,fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600,cursor:"pointer"}}>
          {MONTHS_FULL.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
        </select>
        <select value={selAno} onChange={e=>setSelAno(Number(e.target.value))} style={{background:T.card,border:`1px solid ${T.border2}`,borderRadius:8,padding:"8px 14px",color:T.strong,fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600,cursor:"pointer"}}>
          {years.map(y=><option key={y} value={y}>{y}</option>)}
        </select>
        <div style={{flex:1}}/>
        <Btn T={T} onClick={()=>{setEditId(null);setForm({descricao:"",categoria:"Aluguel",valor:"",recorrente:false,mes:selMes,ano:selAno,pago:false});setShowForm(true);}}>+ Novo Custo</Btn>
      </div>

      <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>
        <StatCard T={T} label="Total do Mês" sub={fmt(totalMes)}     value="" color={T.accent}/>
        <StatCard T={T} label="Pago"         sub={fmt(totalPago)}    value="" color="#10b981"/>
        <StatCard T={T} label="A Pagar"      sub={fmt(totalPendente)} value="" color="#f59e0b"/>
        <StatCard T={T} label="Lançamentos"  value={monthly.length}/>
      </div>

      {byCat.length>0&&(
        <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
          {byCat.map(g=>(
            <div key={g.cat} style={{background:T.card2,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 12px",flex:"1 1 100px",textAlign:"center"}}>
              <div style={{fontSize:12,color:T.accent,fontWeight:700}}>{fmt(g.total)}</div>
              <div style={{fontSize:10,color:T.muted,marginTop:2}}>{g.cat}</div>
            </div>
          ))}
        </div>
      )}

      {showForm&&(
        <div style={{background:T.card,border:`1px solid ${T.border2}`,borderRadius:12,padding:18,marginBottom:18}}>
          <div style={{fontSize:13,color:T.accent,fontWeight:600,marginBottom:14}}>{editId?"✏ Editar Custo":"+ Novo Custo Operacional"}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:12}}>
            <div style={{gridColumn:"1/-1"}}><Field T={T} label="Descrição" value={form.descricao} onChange={v=>setForm(d=>({...d,descricao:v}))}/></div>
            <Field T={T} label="Categoria" value={form.categoria} onChange={v=>setForm(d=>({...d,categoria:v}))} options={COST_CATS}/>
            <Field T={T} label="Valor (R$)" value={form.valor} onChange={v=>setForm(d=>({...d,valor:v}))}/>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              <label style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em"}}>Mês</label>
              <select value={form.mes} onChange={e=>setForm(d=>({...d,mes:Number(e.target.value)}))} style={{background:T.inp,border:`1px solid ${T.border2}`,borderRadius:6,padding:"7px 10px",color:T.text,fontFamily:"'DM Mono',monospace",fontSize:12}}>
                {MONTHS_FULL.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
              </select>
            </div>
            <Field T={T} label="Ano" value={form.ano} onChange={v=>setForm(d=>({...d,ano:Number(v)}))} type="number"/>
          </div>
          <div style={{display:"flex",gap:16,alignItems:"center",marginBottom:14}}>
            <label style={{display:"flex",gap:8,alignItems:"center",cursor:"pointer",fontSize:12,color:T.text}}>
              <input type="checkbox" checked={form.pago} onChange={e=>setForm(d=>({...d,pago:e.target.checked}))} style={{accentColor:T.accent}}/> Já pago
            </label>
            {!editId&&(
              <label style={{display:"flex",gap:8,alignItems:"center",cursor:"pointer",fontSize:12,color:T.text}}>
                <input type="checkbox" checked={form.recorrente} onChange={e=>setForm(d=>({...d,recorrente:e.target.checked}))} style={{accentColor:T.accent}}/> Recorrente (12 meses)
              </label>
            )}
          </div>
          <div style={{display:"flex",gap:8}}>
            <Btn T={T} variant="secondary" onClick={()=>setShowForm(false)}>Cancelar</Btn>
            <Btn T={T} onClick={saveCost}>💾 Salvar</Btn>
          </div>
        </div>
      )}

      {monthly.length===0 ? (
        <div style={{textAlign:"center",color:T.muted,padding:"60px 0"}}>
          <div style={{fontSize:32,marginBottom:12}}>🏢</div>
          Nenhum custo registrado para {MONTHS_FULL[selMes-1]} de {selAno}.
        </div>
      ) : (
        <div style={{overflowX:"auto",borderRadius:10,border:`1px solid ${T.border}`}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr style={{background:T.card2}}>
                {["","Descrição","Categoria","Valor","Mês/Ano","Status",""].map(h=>(
                  <th key={h} style={{padding:"9px 13px",textAlign:"left",fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em",borderBottom:`1px solid ${T.border}`,fontWeight:500,whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthly.map((c,i)=>(
                <tr key={c.id} className="row-hover" style={{background:i%2===0?T.card:T.stripe,borderBottom:`1px solid ${T.border}`}}>
                  <td style={{padding:"9px 13px"}}><input type="checkbox" checked={c.pago} onChange={()=>togglePago(c.id)} style={{cursor:"pointer",accentColor:T.accent}}/></td>
                  <td style={{padding:"9px 13px",color:T.strong}}>{c.descricao}</td>
                  <td style={{padding:"9px 13px"}}><span style={{background:T.card2,border:`1px solid ${T.border2}`,borderRadius:4,padding:"2px 8px",fontSize:11,color:T.muted}}>{c.categoria}</span></td>
                  <td style={{padding:"9px 13px",color:T.accent,fontWeight:700}}>{fmt(c.valor)}</td>
                  <td style={{padding:"9px 13px",color:T.muted,fontSize:11}}>{MONTHS_SHORT[c.mes-1]}/{c.ano}</td>
                  <td style={{padding:"9px 13px"}}><span style={{fontSize:11,color:c.pago?T.successText:T.dangerText,fontWeight:600}}>{c.pago?"✅ Pago":"🔴 Pendente"}</span></td>
                  <td style={{padding:"9px 13px"}}>
                    <div style={{display:"flex",gap:5}}>
                      <button onClick={()=>editCost(c)} className="btn-hover" style={{background:T.infoBg,border:"none",borderRadius:5,padding:"4px 8px",cursor:"pointer",fontSize:12}}>✏</button>
                      <button onClick={()=>deleteCost(c.id)} className="btn-hover" style={{background:T.dangerBg,border:"none",borderRadius:5,padding:"4px 8px",cursor:"pointer",fontSize:12}}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{background:T.card2,borderTop:`2px solid ${T.border2}`}}>
                <td colSpan={3} style={{padding:"10px 13px",fontSize:11,color:T.muted,textTransform:"uppercase",letterSpacing:"0.06em"}}>Total do mês</td>
                <td style={{padding:"10px 13px",color:T.accent,fontWeight:700,fontSize:14}}>{fmt(totalMes)}</td>
                <td colSpan={3} style={{padding:"10px 13px",fontSize:11,color:T.muted}}>Pago: {fmt(totalPago)} · Pendente: {fmt(totalPendente)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN APP  —  Firebase subscriptions replace window.storage
═══════════════════════════════════════════════════════════════ */
export default function App() {
  const [themeId,   setThemeId]   = useState("dark");
  const [tab,       setTab]       = useState("contratos");
  const [contracts, setContracts] = useState([]);
  const [costs,     setCosts]     = useState([]);
  const [loaded,    setLoaded]    = useState(false);
  const [syncing,   setSyncing]   = useState(false);
  const [syncErr,   setSyncErr]   = useState("");

  const T = THEMES[themeId];

  // ── Firebase real-time subscriptions ────────────────────────
  useEffect(() => {
    let unsubC, unsubCo, unsubTh;
    try {
      unsubC  = subscribeList("contracts", (items) => { setContracts(items); setLoaded(true); });
      unsubCo = subscribeList("costs",     (items) => setCosts(items));
      unsubTh = subscribeSetting("theme",  (val)   => { if (val) setThemeId(val); });
    } catch(e) {
      console.error("Firebase subscription error:", e);
      setSyncErr("Erro ao conectar com Firebase. Verifique as variáveis de ambiente.");
      setLoaded(true);
    }
    return () => { unsubC?.(); unsubCo?.(); unsubTh?.(); };
  }, []);

  // ── Write to Firebase whenever state changes (debounced) ────
  const saveTimer = useRef({});
  const debouncedSave = useCallback((key, fn) => {
    clearTimeout(saveTimer.current[key]);
    saveTimer.current[key] = setTimeout(async () => {
      setSyncing(true);
      try { await fn(); } catch(e) { setSyncErr("Erro ao sincronizar: " + e.message); }
      finally { setSyncing(false); }
    }, 800);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    debouncedSave("contracts", () => saveList("contracts", contracts));
  }, [contracts, loaded]);

  useEffect(() => {
    if (!loaded) return;
    debouncedSave("costs", () => saveList("costs", costs));
  }, [costs, loaded]);

  useEffect(() => {
    debouncedSave("theme", () => saveSetting("theme", themeId));
  }, [themeId]);

  const TABS = [
    { id:"contratos",  label:"📄 Contratos" },
    { id:"pagamentos", label:"💰 Pagamentos" },
    { id:"custos",     label:"🏢 Custos Operacionais" },
  ];

  return (
    <div style={{background:T.bg,minHeight:"100vh",color:T.text,fontFamily:"'DM Mono', monospace",fontSize:13}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:6px;height:6px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:${T.scrollThumb};border-radius:3px;}
        input,select,textarea{outline:none;}
        .row-hover:hover{background:${T.hover}!important;cursor:default;}
        .btn-hover:hover{opacity:0.75;}
        @keyframes spin{to{transform:rotate(360deg);}}
        .spin{animation:spin .7s linear infinite;}
      `}</style>

      {/* HEADER */}
      <div style={{background:T.hdr,borderBottom:`1px solid ${T.border}`,padding:"13px 24px",display:"flex",alignItems:"center",gap:14,flexWrap:"wrap",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginRight:8}}>
          <span style={{fontSize:26,filter:`drop-shadow(0 0 10px ${T.accent}88)`}}>⚖️</span>
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:21,fontWeight:700,color:T.accent,lineHeight:1}}>LexControl</div>
            <div style={{fontSize:9,color:T.muted,textTransform:"uppercase",letterSpacing:"0.12em"}}>Gestão de Escritório</div>
          </div>
        </div>

        <div style={{display:"flex",gap:3,background:T.card2,borderRadius:10,padding:3,border:`1px solid ${T.border}`}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} className="btn-hover"
              style={{background:tab===t.id?T.tabActive:"transparent",color:tab===t.id?T.tabActiveText:T.muted,border:"none",borderRadius:7,padding:"6px 14px",cursor:"pointer",fontSize:12,fontFamily:"'DM Mono',monospace",fontWeight:tab===t.id?600:400,transition:"all .18s",whiteSpace:"nowrap"}}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{flex:1}}/>

        {/* Sync indicator */}
        {syncing&&<span style={{fontSize:10,color:T.muted,display:"flex",alignItems:"center",gap:5}}><span className="spin" style={{display:"inline-block",width:10,height:10,border:`2px solid ${T.border2}`,borderTopColor:T.accent,borderRadius:"50%"}}/>Sincronizando...</span>}

        {/* Theme switcher */}
        <div style={{display:"flex",gap:4}}>
          {Object.values(THEMES).map(th=>(
            <button key={th.id} onClick={()=>setThemeId(th.id)} className="btn-hover"
              style={{background:themeId===th.id?T.accent:T.card2,color:themeId===th.id?T.accentText:T.muted,border:`1px solid ${T.border}`,borderRadius:7,padding:"5px 10px",cursor:"pointer",fontSize:11,fontFamily:"'DM Mono',monospace",transition:"all .18s",whiteSpace:"nowrap"}}>
              {th.label}
            </button>
          ))}
        </div>
      </div>

      {/* SYNC ERROR */}
      {syncErr&&<div style={{background:T.dangerBg,borderBottom:`1px solid ${T.dangerBorder}`,color:T.dangerText,padding:"8px 24px",fontSize:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span>⚠ {syncErr}</span><button onClick={()=>setSyncErr("")} style={{background:"none",border:"none",color:T.dangerText,cursor:"pointer"}}>✕</button></div>}

      {/* CONTENT */}
      <div style={{padding:"22px 24px",maxWidth:1200,margin:"0 auto"}}>
        {!loaded
          ? <div style={{textAlign:"center",padding:"80px 0",color:T.muted,display:"flex",flexDirection:"column",alignItems:"center",gap:14}}>
              <div className="spin" style={{width:32,height:32,border:`3px solid ${T.border2}`,borderTopColor:T.accent,borderRadius:"50%"}}/>
              Conectando ao Firebase...
            </div>
          : tab==="contratos"  ? <ContractsTab T={T} contracts={contracts} setContracts={setContracts}/>
          : tab==="pagamentos" ? <PaymentsTab  T={T} contracts={contracts} setContracts={setContracts}/>
          : <CostsTab T={T} costs={costs} setCosts={setCosts}/>
        }
      </div>
    </div>
  );
}
