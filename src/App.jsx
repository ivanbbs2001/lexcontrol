
import {useState,useEffect,useRef} from "react";
import Chart from "chart.js/auto";
import mammoth from "mammoth/mammoth.browser";
import {db,WS,auth,USUARIOS} from "./firebase";
import {askConfirm,notify,DialogHost} from "./ui";
import {getAntKey,setAntKey} from "./aiKey";
import {runAutoBackup,listBackups,backupPayload} from "./backup";

/* ═══════════════════════════════════════════════════════
   THEMES
═══════════════════════════════════════════════════════ */
const THEMES={
  industrial:{id:"industrial",label:"🔩 Industrial",
    bg:"#c5bdb0",card:"#d5cfc3",card2:"#cdc7ba",border:"#a09890",border2:"#767068",
    text:"#1a1410",muted:"#58504a",strong:"#0c0804",
    accent:"#bf4e18",accentText:"#fff",accentDim:"#f2ddd4",
    hover:"#beb8ac",inp:"#c8c2b6",
    dangerBg:"#eedcdc",dangerText:"#7a1010",dangerBorder:"#cc9090",
    successBg:"#d4ecd4",successText:"#185018",
    warnBg:"#ece4c8",warnText:"#7a4808",
    infoBg:"#d0e0ec",infoText:"#183060",
    hdr:"#b4ada0",stripe:"#cfc9bc",
    tabActive:"#bf4e18",tabActiveText:"#fff",
    chartGrid:"rgba(0,0,0,0.08)",chartText:"#58504a",
    sOkBg:"#d4ecd4",sOkTx:"#185018",sOkDot:"#22c55e",
    sErrBg:"#eedcdc",sErrTx:"#7a1010",sErrDot:"#ef4444",
    sWaitBg:"#ece4c8",sWaitTx:"#7a4808",sWaitDot:"#f59e0b",
  },
  dark:{id:"dark",label:"🌙 Escuro",
    bg:"#06101e",card:"#0c1828",card2:"#091422",border:"#192c44",border2:"#243d5c",
    text:"#c2d2e6",muted:"#4e6278",strong:"#daeaf8",
    accent:"#d4b86a",accentText:"#06101e",accentDim:"#1c1508",
    hover:"#112033",inp:"#091422",
    dangerBg:"#270d0d",dangerText:"#f87171",dangerBorder:"#7f1d1d",
    successBg:"#051e0f",successText:"#4ade80",
    warnBg:"#27190a",warnText:"#fbbf24",
    infoBg:"#081a34",infoText:"#60a5fa",
    hdr:"#040c18",stripe:"#081322",
    tabActive:"#d4b86a",tabActiveText:"#06101e",
    chartGrid:"rgba(255,255,255,0.06)",chartText:"#4e6278",
    sOkBg:"#051e0f",sOkTx:"#4ade80",sOkDot:"#4ade80",
    sErrBg:"#270d0d",sErrTx:"#f87171",sErrDot:"#ef4444",
    sWaitBg:"#1a1a08",sWaitTx:"#fbbf24",sWaitDot:"#f59e0b",
  },
  light:{id:"light",label:"☀️ Claro",
    bg:"#f0ebe0",card:"#fdfaf4",card2:"#f5f0e8",border:"#d8cdb8",border2:"#b8a888",
    text:"#241808",muted:"#7a6850",strong:"#100c04",
    accent:"#8a6010",accentText:"#fff",accentDim:"#fdf5e0",
    hover:"#ebe4d4",inp:"#f5f0e8",
    dangerBg:"#fff3f3",dangerText:"#991c1c",dangerBorder:"#fca5a5",
    successBg:"#ecfdf5",successText:"#166534",
    warnBg:"#fffbeb",warnText:"#b45309",
    infoBg:"#eff6ff",infoText:"#1e40af",
    hdr:"#e4ddd0",stripe:"#f8f3ea",
    tabActive:"#8a6010",tabActiveText:"#fff",
    chartGrid:"rgba(0,0,0,0.06)",chartText:"#7a6850",
    sOkBg:"#ecfdf5",sOkTx:"#166534",sOkDot:"#22c55e",
    sErrBg:"#fff3f3",sErrTx:"#991c1c",sErrDot:"#ef4444",
    sWaitBg:"#fffbeb",sWaitTx:"#b45309",sWaitDot:"#f59e0b",
  },
};

/* ═══════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════ */
const MFL=["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const MFS=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const COST_CATS=["Aluguel","Energia","Internet","Telefone","Software","Pessoal","Contabilidade","Material de Escritório","Transporte","Outros"];
const COST_EMOJI={"Aluguel":"🏠","Energia":"⚡","Internet":"🌐","Telefone":"📱","Software":"💻","Pessoal":"👤","Contabilidade":"📊","Material de Escritório":"📎","Transporte":"🚗","Outros":"📌"};
const AREAS=["Cível","Previdenciária","Penal / Criminal","Trabalhista","Administrativa","Consumidor","Família e Sucessões","Tributária / Fiscal","Empresarial","Imobiliária","Ambiental","Eleitoral","Militar","Internacional","Outro"];
const FORMAS=["PIX","Boleto","Transferência","Dinheiro","Cartão de Crédito","Cartão de Débito","Cheque","Outro"];
const AREA_COLORS={"Cível":"#3b82f6","Previdenciária":"#10b981","Penal / Criminal":"#ef4444","Trabalhista":"#f59e0b","Administrativa":"#8b5cf6","Consumidor":"#06b6d4","Família e Sucessões":"#ec4899","Tributária / Fiscal":"#f97316","Empresarial":"#6366f1","Imobiliária":"#84cc16","Ambiental":"#14b8a6","Outro":"#94a3b8"};
const STATUS_CFG={
  pendente:     {label:"Pendente",              icon:"⏳",color:"#f59e0b"},
  em_pagamento: {label:"Em Pagamento",           icon:"💳",color:"#3b82f6"},
  pago:         {label:"Pago",                   icon:"✅",color:"#10b981"},
  pago_pendente:{label:"Pago · Serviço Pendente",icon:"⚠️",color:"#a78bfa"},
};
const AI_PROMPT=`Você é especialista em contratos jurídicos brasileiros.
Retorne SOMENTE JSON válido, sem texto extra, sem markdown:
{"advogado":"","cliente":"","telefone":"","numeroProcesso":"","areaAtuacao":"Cível","valorTotal":"8500.00","formaPagamento":"","totalParcelas":"3","valorParcela":"2833.33","prazos":"","observacoes":""}
Se não encontrar, deixe como string vazia.`;

/* ═══════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════ */
const genId=()=>Date.now()+Math.floor(Math.random()*9999);
const fmt=v=>{const n=parseFloat(String(v??0).replace(/[^\d.,-]/g,"").replace(",","."));return isNaN(n)?(String(v)||"—"):n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});};
const fmtN=v=>parseFloat(String(v??0).replace(/[^\d.,-]/g,"").replace(",","."))||0;
const waLink=phone=>{const d=phone.replace(/\D/g,"");const num=d.length===11||d.length===10?"55"+d:d;return`https://wa.me/${num}`;};
const ADV_PRINCIPAL = "Juliana";
const LOGO_SRC=import.meta.env.BASE_URL+"logo.png";

const newC=()=>({id:null,nomeArquivo:"",advogado:ADV_PRINCIPAL,cliente:"",telefone:"",numeroProcesso:"",areaAtuacao:"Cível",valorTotal:"",formaPagamento:"",totalParcelas:1,valorParcela:"",prazos:"",observacoes:"",status:"pendente",dataUpload:new Date().toLocaleDateString("pt-BR"),coAdvogados:[],schedule:[]});
const newP=()=>({id:null,cliente:"",advogado:ADV_PRINCIPAL,coAdvogado:"",percCoAdv:"",telefone:"",numeroProcesso:"",areaAtuacao:"Cível",descricao:"",valor:"",mes:new Date().getMonth()+1,ano:new Date().getFullYear(),formaPagamento:"PIX",pago:false,dataLancamento:new Date().toLocaleDateString("pt-BR")});

/* ═══════════════════════════════════════════════════════
/* ═══════════════════════════════════════════════════════
   ATOMS
═══════════════════════════════════════════════════════ */
const Btn=({T,variant="primary",onClick,children,style={},disabled})=>{
  const v={primary:{background:T.accent,color:T.accentText},secondary:{background:T.border,color:T.text,fontWeight:400},danger:{background:T.dangerBg,color:T.dangerText,border:`1px solid ${T.dangerBorder}`},ghost:{background:"transparent",color:T.muted,border:`1px solid ${T.border2}`}};
  return <button onClick={onClick} disabled={disabled} style={{border:"none",borderRadius:7,padding:"8px 16px",cursor:disabled?"not-allowed":"pointer",fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:600,opacity:disabled?.5:1,...v[variant],...style}}>{children}</button>;
};
const Fld=({T,label,value,onChange,type="text",options,ph="",style={}})=>(
  <div style={{display:"flex",flexDirection:"column",gap:5}}>
    <label style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em"}}>{label}</label>
    {options
      ?<select value={value} onChange={e=>onChange(e.target.value)} style={{background:T.inp,border:`1px solid ${T.border2}`,borderRadius:6,padding:"7px 10px",color:T.text,fontFamily:"'DM Mono',monospace",fontSize:12,...style}}>{options.map(o=><option key={o.v??o} value={o.v??o}>{o.l??o}</option>)}</select>
      :type==="textarea"
        ?<textarea value={value} onChange={e=>onChange(e.target.value)} rows={3} placeholder={ph} style={{background:T.inp,border:`1px solid ${T.border2}`,borderRadius:6,padding:"7px 10px",color:T.text,fontFamily:"'DM Mono',monospace",fontSize:12,resize:"vertical",...style}}/>
        :<input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={ph} style={{background:T.inp,border:`1px solid ${T.border2}`,borderRadius:6,padding:"7px 10px",color:T.text,fontFamily:"'DM Mono',monospace",fontSize:12,...style}}/>}
  </div>
);
const StatCard=({T,label,value,color,sub,accent=false})=>(
  <div style={{background:accent?color+"22":T.card,border:`1px solid ${accent?color+"66":T.border}`,borderRadius:10,padding:"13px 16px",flex:"1 1 105px",textAlign:"center"}}>
    <div style={{fontSize:24,fontWeight:700,color:color??T.accent,fontFamily:"'Cormorant Garamond',serif",lineHeight:1}}>{value}</div>
    {sub&&<div style={{fontSize:12,color:color??T.accent,fontWeight:600,marginTop:2}}>{sub}</div>}
    <div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginTop:4}}>{label}</div>
  </div>
);
const Modal=({T,title,sub,onClose,children,footer,width=720})=>(
  <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:"#00000088",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20}}>
    <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,width:"100%",maxWidth:width,maxHeight:"92vh",display:"flex",flexDirection:"column",boxShadow:"0 30px 90px #0009"}}>
      <div style={{padding:"18px 24px 14px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:T.accent,fontWeight:700}}>{title}</div>{sub&&<div style={{fontSize:11,color:T.muted,marginTop:2}}>{sub}</div>}</div>
        <button onClick={onClose} style={{background:"none",border:"none",color:T.muted,fontSize:20,cursor:"pointer"}}>✕</button>
      </div>
      <div style={{overflowY:"auto",flex:1,padding:"18px 24px"}}>{children}</div>
      {footer&&<div style={{padding:"12px 24px",borderTop:`1px solid ${T.border}`,display:"flex",justifyContent:"flex-end",gap:10}}>{footer}</div>}
    </div>
  </div>
);
const ABadge=({area})=>{const c=AREA_COLORS[area]||"#94a3b8";return <span style={{background:c+"22",color:c,border:`1px solid ${c}44`,borderRadius:4,padding:"2px 8px",fontSize:11,whiteSpace:"nowrap",fontWeight:500}}>{area||"—"}</span>;};
const SecTitle=({T,children})=><div style={{fontSize:11,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10,borderBottom:`1px solid ${T.border}`,paddingBottom:6,marginTop:4}}>{children}</div>;
const PhoneLink=({phone})=>{
  if(!phone)return <span style={{color:"inherit"}}>—</span>;
  return <a href={waLink(phone)} target="_blank" rel="noopener noreferrer" style={{color:"#25d366",fontWeight:500,display:"inline-flex",alignItems:"center",gap:4}}>
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
    {phone}
  </a>;
};

/* ═══════════════════════════════════════════════════════
   CONTRATO FORM
═══════════════════════════════════════════════════════ */
function CForm({T,data,set,nA,sA,nS,sS}){
  function addA(){if(!nA.nome||!nA.pct)return;set(d=>({...d,coAdvogados:[...(d.coAdvogados||[]),{id:genId(),nome:nA.nome,percentual:nA.pct}]}));sA({nome:"",pct:""});}
  function remA(id){set(d=>({...d,coAdvogados:d.coAdvogados.filter(a=>a.id!==id)}));}
  function addS(){if(!nS.valor)return;set(d=>({...d,schedule:[...(d.schedule||[]),{id:genId(),...nS,valor:fmtN(nS.valor)}]}));sS({mes:new Date().getMonth()+1,ano:new Date().getFullYear(),valor:"",descricao:"",pago:false});}
  function togS(sid){set(d=>({...d,schedule:d.schedule.map(s=>s.id===sid?{...s,pago:!s.pago}:s)}));}
  function remS(sid){set(d=>({...d,schedule:d.schedule.filter(s=>s.id!==sid)}));}
  const coSum=(data.coAdvogados||[]).reduce((s,a)=>s+fmtN(a.percentual),0);
  return(
    <div>
      <SecTitle T={T}>Dados do Processo</SecTitle>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
        <Fld T={T} label="Advogado Responsável" value={data.advogado} onChange={v=>set(d=>({...d,advogado:v}))}/>
        <Fld T={T} label="Cliente" value={data.cliente} onChange={v=>set(d=>({...d,cliente:v}))}/>
        <Fld T={T} label="Telefone / WhatsApp" value={data.telefone||""} onChange={v=>set(d=>({...d,telefone:v}))} ph="(00) 00000-0000"/>
        <Fld T={T} label="Nº do Processo" value={data.numeroProcesso||""} onChange={v=>set(d=>({...d,numeroProcesso:v}))} ph="0000000-00.0000.0.00.0000"/>
        <div style={{gridColumn:"1/-1"}}><Fld T={T} label="Área de Atuação" value={data.areaAtuacao||"Cível"} onChange={v=>set(d=>({...d,areaAtuacao:v}))} options={AREAS}/></div>
      </div>
      <SecTitle T={T}>Honorários</SecTitle>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
        <Fld T={T} label="Valor Total (R$)" value={data.valorTotal} onChange={v=>set(d=>({...d,valorTotal:v}))}/>
        <Fld T={T} label="Forma de Pagamento" value={data.formaPagamento} onChange={v=>set(d=>({...d,formaPagamento:v}))} options={FORMAS}/>
        <Fld T={T} label="Nº de Parcelas" value={data.totalParcelas} onChange={v=>set(d=>({...d,totalParcelas:v}))} type="number"/>
        <Fld T={T} label="Valor por Parcela" value={data.valorParcela} onChange={v=>set(d=>({...d,valorParcela:v}))}/>
        <div style={{gridColumn:"1/-1"}}><Fld T={T} label="Prazos" value={data.prazos} onChange={v=>set(d=>({...d,prazos:v}))}/></div>
        <div style={{gridColumn:"1/-1"}}><Fld T={T} label="Observações" value={data.observacoes} onChange={v=>set(d=>({...d,observacoes:v}))} type="textarea"/></div>
        <div style={{gridColumn:"1/-1"}}><Fld T={T} label="Status" value={data.status} onChange={v=>set(d=>({...d,status:v}))} options={Object.entries(STATUS_CFG).map(([k,v])=>({v:k,l:`${v.icon} ${v.label}`}))}/></div>
      </div>
      <SecTitle T={T}>Co-advogados</SecTitle>
      <div style={{marginBottom:16}}>
        {(data.coAdvogados||[]).map(a=>(
          <div key={a.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,background:T.card2,borderRadius:7,padding:"7px 10px"}}>
            <span style={{flex:1,color:T.infoText}}>{a.nome}</span>
            <span style={{color:T.accent,fontWeight:600}}>{a.percentual}%</span>
            <span style={{color:T.muted,fontSize:11}}>{fmt(fmtN(data.valorTotal)*fmtN(a.percentual)/100)}</span>
            <button className="bhov" onClick={()=>remA(a.id)} style={{background:"none",border:"none",color:T.dangerText,fontSize:14}}>✕</button>
          </div>
        ))}
        {(data.coAdvogados||[]).length>0&&<div style={{background:T.successBg,borderRadius:7,padding:"7px 10px",fontSize:12,color:T.successText,marginBottom:8}}>{data.advogado||"Adv. Principal"}: {100-coSum}% = {fmt(fmtN(data.valorTotal)*(100-coSum)/100)}</div>}
        <div style={{display:"flex",gap:8}}>
          <input placeholder="Nome" value={nA.nome} onChange={e=>sA(d=>({...d,nome:e.target.value}))} style={{flex:1,background:T.inp,border:`1px solid ${T.border2}`,borderRadius:6,padding:"6px 10px",color:T.text,fontFamily:"'DM Mono',monospace",fontSize:12}}/>
          <input placeholder="%" value={nA.pct} onChange={e=>sA(d=>({...d,pct:e.target.value}))} type="number" style={{width:70,background:T.inp,border:`1px solid ${T.border2}`,borderRadius:6,padding:"6px 10px",color:T.text,fontFamily:"'DM Mono',monospace",fontSize:12}}/>
          <Btn T={T} variant="ghost" onClick={addA}>+ Add</Btn>
        </div>
      </div>
      <SecTitle T={T}>Cronograma de Pagamentos</SecTitle>
      {(data.schedule||[]).map(s=>(
        <div key={s.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,background:s.pago?T.successBg:T.card2,borderRadius:7,padding:"7px 10px"}}>
          <input type="checkbox" checked={s.pago} onChange={()=>togS(s.id)} style={{cursor:"pointer"}}/>
          <span style={{color:T.muted,fontSize:11,minWidth:52}}>{MFS[s.mes-1]}/{s.ano}</span>
          <span style={{color:T.accent,fontWeight:600}}>{fmt(s.valor)}</span>
          <span style={{flex:1,color:T.muted,fontSize:11}}>{s.descricao}</span>
          <span style={{fontSize:11,color:s.pago?T.successText:T.warnText}}>{s.pago?"✅":"⏳"}</span>
          <button className="bhov" onClick={()=>remS(s.id)} style={{background:"none",border:"none",color:T.muted,fontSize:13}}>✕</button>
        </div>
      ))}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:8}}>
        <select value={nS.mes} onChange={e=>sS(d=>({...d,mes:Number(e.target.value)}))} style={{background:T.inp,border:`1px solid ${T.border2}`,borderRadius:6,padding:"6px 10px",color:T.text,fontFamily:"'DM Mono',monospace",fontSize:12}}>{MFL.map((m,i)=><option key={i} value={i+1}>{m}</option>)}</select>
        <input type="number" value={nS.ano} onChange={e=>sS(d=>({...d,ano:Number(e.target.value)}))} style={{width:80,background:T.inp,border:`1px solid ${T.border2}`,borderRadius:6,padding:"6px 10px",color:T.text,fontFamily:"'DM Mono',monospace",fontSize:12}}/>
        <input placeholder="R$" value={nS.valor} onChange={e=>sS(d=>({...d,valor:e.target.value}))} style={{width:100,background:T.inp,border:`1px solid ${T.border2}`,borderRadius:6,padding:"6px 10px",color:T.text,fontFamily:"'DM Mono',monospace",fontSize:12}}/>
        <input placeholder="Descrição (Parcela 1/3…)" value={nS.descricao} onChange={e=>sS(d=>({...d,descricao:e.target.value}))} style={{flex:1,minWidth:140,background:T.inp,border:`1px solid ${T.border2}`,borderRadius:6,padding:"6px 10px",color:T.text,fontFamily:"'DM Mono',monospace",fontSize:12}}/>
        <Btn T={T} variant="ghost" onClick={addS}>+ Parcela</Btn>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TAB CONTRATOS
═══════════════════════════════════════════════════════ */
function TabContratos({T,contracts,setContracts}){
  const [loading,setLoading]=useState(false);const [loadMsg,setLoadMsg]=useState("");const [error,setError]=useState("");
  const [drag,setDrag]=useState(false);const [modal,setModal]=useState(null);const [editMode,setEditMode]=useState(false);
  const [editData,setEditData]=useState({});const [nA,sA]=useState({nome:"",pct:""});
  const [nS,sS]=useState({mes:new Date().getMonth()+1,ano:new Date().getFullYear(),valor:"",descricao:"",pago:false});
  const [showNew,setShowNew]=useState(false);const [nd,setNd]=useState(newC());
  const [nA2,sA2]=useState({nome:"",pct:""});const [nS2,sS2]=useState({mes:new Date().getMonth()+1,ano:new Date().getFullYear(),valor:"",descricao:"",pago:false});
  const fileRef=useRef();

  async function processFile(file){
    setError("");setLoading(true);setLoadMsg("Lendo arquivo...");
    try{
      const isPdf=file.type==="application/pdf",isDocx=file.name.toLowerCase().endsWith(".docx");
      if(!isPdf&&!isDocx)throw new Error("Use PDF ou .docx");
      let messages;
      if(isPdf){setLoadMsg("Enviando para IA...");const b64=await new Promise((r,j)=>{const x=new FileReader();x.onload=()=>r(x.result.split(",")[1]);x.onerror=j;x.readAsDataURL(file);});messages=[{role:"user",content:[{type:"document",source:{type:"base64",media_type:"application/pdf",data:b64}},{type:"text",text:AI_PROMPT}]}];}
      else{setLoadMsg("Extraindo Word...");const text=await new Promise((r,j)=>{const x=new FileReader();x.onload=async e=>{try{r((await mammoth.extractRawText({arrayBuffer:e.target.result})).value);}catch(err){j(err);}};x.onerror=j;x.readAsArrayBuffer(file);});messages=[{role:"user",content:`${AI_PROMPT}\n\n---\n${text}`}];}
      if(!getAntKey())throw new Error("Chave da IA não configurada (veja Config. → Chave da IA).");setLoadMsg("IA analisando...");
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":getAntKey(),"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:800,messages})});
      const data=await res.json();const txt=data.content?.find(b=>b.type==="text")?.text??"{}";
      const p=JSON.parse(txt.replace(/```json|```/g,"").trim());
      setContracts(prev=>[{...newC(),id:genId(),nomeArquivo:file.name,advogado:p.advogado||ADV_PRINCIPAL,cliente:p.cliente||"",telefone:p.telefone||"",numeroProcesso:p.numeroProcesso||"",areaAtuacao:p.areaAtuacao||"Cível",valorTotal:p.valorTotal||"",formaPagamento:p.formaPagamento||"",totalParcelas:parseInt(p.totalParcelas)||1,valorParcela:p.valorParcela||"",prazos:p.prazos||"",observacoes:p.observacoes||""},...prev]);
    }catch(e){setError(e.message||"Erro.");}finally{setLoading(false);setLoadMsg("");}
  }
  function saveNew(){if(!nd.cliente)return;setContracts(p=>[{...nd,id:genId(),dataUpload:new Date().toLocaleDateString("pt-BR")},...p]);setShowNew(false);setNd(newC());sA2({nome:"",pct:""});}
  function openM(c){setModal(c);setEditData({...c});setEditMode(false);sA({nome:"",pct:""});sS({mes:new Date().getMonth()+1,ano:new Date().getFullYear(),valor:"",descricao:"",pago:false});}
  function saveEdit(){setContracts(p=>p.map(c=>c.id===editData.id?{...editData}:c));setModal({...editData});setEditMode(false);}
  function updSt(id,status){setContracts(p=>p.map(c=>c.id===id?{...c,status}:c));if(modal?.id===id)setModal(s=>({...s,status}));}
  async function del(id){if(!await askConfirm("Remover este contrato?"))return;setContracts(p=>p.filter(c=>c.id!==id));setModal(null);}
  const tot=contracts.reduce((s,c)=>s+fmtN(c.valorTotal),0);

  return(
    <div>
      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        <StatCard T={T} label="Contratos" value={contracts.length}/>
        <StatCard T={T} label="Pendentes" value={contracts.filter(c=>c.status==="pendente").length} color="#f59e0b"/>
        <StatCard T={T} label="Em Pagamento" value={contracts.filter(c=>c.status==="em_pagamento").length} color="#3b82f6"/>
        <StatCard T={T} label="Quitados" value={contracts.filter(c=>c.status==="pago"||c.status==="pago_pendente").length} color="#10b981"/>
        <StatCard T={T} label="Carteira" sub={fmt(tot)} value=""/>
      </div>
      <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap",alignItems:"stretch"}}>
        <div onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);const f=e.dataTransfer.files?.[0];if(f)processFile(f);}} onClick={()=>!loading&&fileRef.current?.click()}
          style={{border:`2px dashed ${drag?T.accent:T.border2}`,background:drag?T.accentDim:T.card2,borderRadius:10,padding:"12px 20px",cursor:loading?"wait":"pointer",transition:"all .2s",display:"flex",alignItems:"center",gap:10,flex:"1 1 250px"}}>
          <input ref={fileRef} type="file" accept=".pdf,.docx" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(f)processFile(f);e.target.value="";}}/>
          {loading?<><div className="spin" style={{width:20,height:20,border:`3px solid ${T.border2}`,borderTopColor:T.accent,borderRadius:"50%",flexShrink:0}}/><span style={{color:T.muted,fontSize:12}}>{loadMsg}</span></>:<><span style={{fontSize:20}}>📄</span><div><div style={{color:T.text,fontWeight:500,fontSize:13}}>Enviar Contrato (PDF / Word)</div><div style={{color:T.muted,fontSize:11}}>IA extrai dados automaticamente</div></div></>}
        </div>
        <Btn T={T} onClick={()=>setShowNew(true)} style={{whiteSpace:"nowrap",alignSelf:"center"}}>+ Cadastrar Manualmente</Btn>
      </div>
      {error&&<div style={{background:T.dangerBg,border:`1px solid ${T.dangerBorder}`,color:T.dangerText,borderRadius:8,padding:"9px 14px",marginBottom:12,fontSize:12}}>⚠ {error}</div>}
      {showNew&&(
        <div style={{background:T.card,border:`1px solid ${T.border2}`,borderRadius:12,padding:18,marginBottom:16}}>
          <div style={{fontSize:13,color:T.accent,fontWeight:600,marginBottom:14}}>+ Novo Contrato / Processo</div>
          <CForm T={T} data={nd} set={setNd} nA={nA2} sA={sA2} nS={nS2} sS={sS2}/>
          <div style={{display:"flex",gap:8,marginTop:14}}><Btn T={T} variant="secondary" onClick={()=>setShowNew(false)}>Cancelar</Btn><Btn T={T} onClick={saveNew}>💾 Salvar</Btn></div>
        </div>
      )}
      {contracts.length===0
        ?<div style={{textAlign:"center",color:T.muted,padding:"60px 0",fontSize:13}}>Nenhum contrato. Envie ou cadastre manualmente.</div>
        :<div style={{overflowX:"auto",borderRadius:10,border:`1px solid ${T.border}`}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr style={{background:T.card2}}>{["Área","Cliente / Contato","Advogado","Processo","Valor","Status","Data",""].map(h=><th key={h} style={{padding:"9px 12px",textAlign:"left",fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em",borderBottom:`1px solid ${T.border}`,fontWeight:500,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
            <tbody>
              {contracts.map((c,i)=>{const st=STATUS_CFG[c.status]||STATUS_CFG.pendente;return(
                <tr key={c.id} className="row-hover" style={{background:i%2===0?T.card:T.stripe,borderBottom:`1px solid ${T.border}`}}>
                  <td style={{padding:"10px 12px"}}><ABadge area={c.areaAtuacao}/></td>
                  <td style={{padding:"10px 12px"}}><div style={{fontWeight:500,color:T.strong,fontSize:13}}>{c.cliente||"—"}</div>{c.telefone&&<div style={{marginTop:2}}><PhoneLink phone={c.telefone}/></div>}</td>
                  <td style={{padding:"10px 12px",color:T.infoText,fontSize:12}}>{c.advogado||"—"}</td>
                  <td style={{padding:"10px 12px",fontSize:11,color:T.muted,maxWidth:130,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={c.numeroProcesso}>{c.numeroProcesso||"—"}</td>
                  <td style={{padding:"10px 12px",color:T.accent,fontWeight:700}}>{fmt(c.valorTotal)}</td>
                  <td style={{padding:"10px 12px"}}><select value={c.status} onChange={e=>updSt(c.id,e.target.value)} style={{background:T.card2,color:st.color,border:`1px solid ${st.color}55`,borderRadius:6,padding:"3px 8px",fontSize:11,fontFamily:"'DM Mono',monospace",cursor:"pointer",appearance:"none"}}>{Object.entries(STATUS_CFG).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}</select></td>
                  <td style={{padding:"10px 12px",color:T.muted,fontSize:11,whiteSpace:"nowrap"}}>{c.dataUpload}</td>
                  <td style={{padding:"10px 12px"}}><div style={{display:"flex",gap:5}}>
                    <button className="bhov" onClick={()=>openM(c)} style={{background:T.infoBg,border:"none",borderRadius:5,padding:"5px 9px",fontSize:13}}>🔍</button>
                    <button className="bhov" onClick={()=>del(c.id)} style={{background:T.dangerBg,border:"none",borderRadius:5,padding:"5px 9px",fontSize:13}}>🗑</button>
                  </div></td>
                </tr>);
              })}
            </tbody>
          </table>
        </div>}
      {modal&&(
        <Modal T={T} title={modal.cliente||"Contrato"} sub={`${modal.areaAtuacao||""}${modal.numeroProcesso?" · "+modal.numeroProcesso:""}`} onClose={()=>setModal(null)}
          footer={editMode?<><Btn T={T} variant="secondary" onClick={()=>{setEditMode(false);setEditData({...modal});}}>Cancelar</Btn><Btn T={T} onClick={saveEdit}>💾 Salvar</Btn></>:<><Btn T={T} variant="danger" onClick={()=>del(modal.id)}>Remover</Btn><Btn T={T} onClick={()=>setEditMode(true)}>✏ Editar</Btn></>}>
          {editMode?<CForm T={T} data={editData} set={setEditData} nA={nA} sA={sA} nS={nS} sS={sS}/>
          :<div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              {[["Área",<ABadge area={modal.areaAtuacao}/>],["Advogado",modal.advogado],["Cliente",modal.cliente],["Telefone",<PhoneLink phone={modal.telefone}/>],["Nº Processo",modal.numeroProcesso||"—"],["Valor Total",fmt(modal.valorTotal)],["Forma de Pgto",modal.formaPagamento||"—"],["Parcelas",modal.totalParcelas>1?`${modal.totalParcelas}× ${fmt(modal.valorParcela)}`:"À vista"],["Status",`${STATUS_CFG[modal.status]?.icon} ${STATUS_CFG[modal.status]?.label}`],["Cadastrado",modal.dataUpload]].map(([l,v])=>(
                <div key={l} style={{background:T.card2,borderRadius:8,padding:"10px 13px",border:`1px solid ${T.border}`}}><div style={{fontSize:10,color:T.muted,textTransform:"uppercase",marginBottom:3}}>{l}</div><div style={{color:T.strong,fontSize:13}}>{v||"—"}</div></div>
              ))}
              {modal.observacoes&&<div style={{gridColumn:"1/-1",background:T.card2,borderRadius:8,padding:"10px 13px",border:`1px solid ${T.border}`}}><div style={{fontSize:10,color:T.muted,textTransform:"uppercase",marginBottom:3}}>Observações</div><div style={{color:T.text,fontSize:12,whiteSpace:"pre-wrap"}}>{modal.observacoes}</div></div>}
            </div>
            {(modal.coAdvogados||[]).length>0&&<div style={{marginBottom:12}}><div style={{fontSize:11,color:T.muted,textTransform:"uppercase",marginBottom:8}}>Divisão de Honorários</div><div style={{background:T.card2,borderRadius:8,border:`1px solid ${T.border}`,overflow:"hidden"}}>{[{nome:modal.advogado||"Adv. Principal",percentual:100-(modal.coAdvogados||[]).reduce((s,a)=>s+fmtN(a.percentual),0),principal:true},...(modal.coAdvogados||[])].map((a,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"8px 13px",borderBottom:i<modal.coAdvogados.length?`1px solid ${T.border}`:"none"}}><span style={{flex:1,color:a.principal?T.accent:T.infoText,fontWeight:a.principal?600:400}}>{a.nome}</span><span style={{color:T.muted}}>{a.percentual}%</span><span style={{color:T.accent,fontWeight:600}}>{fmt(fmtN(modal.valorTotal)*fmtN(a.percentual)/100)}</span></div>)}</div></div>}
            {(modal.schedule||[]).length>0&&<div><div style={{fontSize:11,color:T.muted,textTransform:"uppercase",marginBottom:8}}>Cronograma</div>{modal.schedule.map(s=><div key={s.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,background:s.pago?T.successBg:T.card2,borderRadius:7,padding:"8px 12px",border:`1px solid ${s.pago?T.successText+"33":T.border}`}}><span style={{color:T.muted,fontSize:11,minWidth:52}}>{MFS[s.mes-1]}/{s.ano}</span><span style={{color:T.accent,fontWeight:700}}>{fmt(s.valor)}</span><span style={{flex:1,color:T.muted,fontSize:11}}>{s.descricao}</span><span style={{fontSize:11,color:s.pago?T.successText:T.warnText,fontWeight:600}}>{s.pago?"✅ Pago":"⏳ Pendente"}</span></div>)}</div>}
          </div>}
        </Modal>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TAB PAGAMENTOS — redesigned
═══════════════════════════════════════════════════════ */
function TabPagamentos({T,contracts,setContracts,manual,setManual}){
  const now=new Date();
  const [mes,setMes]=useState(now.getMonth()+1);const [ano,setAno]=useState(now.getFullYear());
  const [showForm,setShowForm]=useState(false);const [form,setForm]=useState(newP());const [editId,setEditId]=useState(null);
  const years=Array.from({length:6},(_,i)=>now.getFullYear()-2+i);

  const schedE=contracts.flatMap(c=>(c.schedule||[]).filter(s=>s.mes===mes&&s.ano===ano).map(s=>({...s,_t:"s",contrato:c})));
  const manE=manual.filter(p=>p.mes===mes&&p.ano===ano).map(p=>({...p,_t:"m"}));
  const all=[...schedE,...manE];
  const totE=all.reduce((s,e)=>s+fmtN(e.valor),0);
  const totR=all.filter(e=>e.pago).reduce((s,e)=>s+fmtN(e.valor),0);
  const pct=totE>0?Math.round(totR/totE*100):0;
  const noSch=contracts.filter(c=>c.status==="em_pagamento"&&!(c.schedule||[]).some(s=>s.mes===mes&&s.ano===ano));

  function togS(cid,sid){setContracts(p=>p.map(c=>c.id===cid?{...c,schedule:c.schedule.map(s=>s.id===sid?{...s,pago:!s.pago}:s)}:c));}
  function togM(id){setManual(p=>p.map(x=>x.id===id?{...x,pago:!x.pago}:x));}
  function saveForm(){
    if(!form.cliente||!form.valor)return;
    if(editId){setManual(p=>p.map(x=>x.id===editId?{...form,id:editId,valor:fmtN(form.valor)}:x));}
    else setManual(p=>[...p,{...form,id:genId(),valor:fmtN(form.valor),dataLancamento:new Date().toLocaleDateString("pt-BR")}]);
    setForm(newP());setEditId(null);setShowForm(false);
  }
  function editE(e){setForm({...e,valor:String(e.valor)});setEditId(e.id);setShowForm(true);}
  async function delM(id){if(!await askConfirm("Remover este pagamento?"))return;setManual(p=>p.filter(x=>x.id!==id));}

  // Group by area for summary
  const byArea={};all.forEach(e=>{const a=e._t==="s"?e.contrato.areaAtuacao:e.areaAtuacao;if(!byArea[a])byArea[a]={total:0,recebido:0};byArea[a].total+=fmtN(e.valor);if(e.pago)byArea[a].recebido+=fmtN(e.valor);});

  return(
    <div>
      {/* header */}
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:T.accent,fontWeight:700}}>Pagamentos</span>
        <div style={{display:"flex",alignItems:"center",gap:4,background:T.card,border:`1px solid ${T.border2}`,borderRadius:10,padding:"4px 8px"}}>
          <button className="bhov nav-arrow" onClick={()=>{let m=mes-1,a=ano;if(m<1){m=12;a--;}setMes(m);setAno(a);}} style={{background:T.card2,border:"none",fontSize:20,cursor:"pointer",color:T.accent,padding:"2px 8px",lineHeight:1,borderRadius:6,fontWeight:700}}>‹</button>
          <select value={mes} onChange={e=>setMes(Number(e.target.value))} style={{background:"transparent",border:"none",color:T.strong,fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600,cursor:"pointer",outline:"none"}}>{MFL.map((m,i)=><option key={i} value={i+1}>{m}</option>)}</select>
          <button className="bhov nav-arrow" onClick={()=>{let m=mes+1,a=ano;if(m>12){m=1;a++;}setMes(m);setAno(a);}} style={{background:T.card2,border:"none",fontSize:20,cursor:"pointer",color:T.accent,padding:"2px 8px",lineHeight:1,borderRadius:6,fontWeight:700}}>›</button>
          <span style={{color:T.border2,margin:"0 4px",fontSize:16}}>|</span>
          <button className="bhov nav-arrow" onClick={()=>setAno(a=>a-1)} style={{background:T.card2,border:"none",fontSize:16,cursor:"pointer",color:T.accent,padding:"2px 8px",lineHeight:1,borderRadius:6,fontWeight:700}}>‹</button>
          <span style={{color:T.strong,fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600,minWidth:44,textAlign:"center"}}>{ano}</span>
          <button className="bhov nav-arrow" onClick={()=>setAno(a=>a+1)} style={{background:T.card2,border:"none",fontSize:16,cursor:"pointer",color:T.accent,padding:"2px 8px",lineHeight:1,borderRadius:6,fontWeight:700}}>›</button>
        </div>
        <div style={{flex:1}}/>
        <Btn T={T} onClick={()=>{setEditId(null);setForm({...newP(),mes,ano});setShowForm(true);}}>+ Novo Pagamento</Btn>
      </div>

      {/* hero summary */}
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"20px 24px",marginBottom:16,display:"flex",gap:24,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{flex:"0 0 auto"}}>
          <div style={{fontSize:11,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>Total Esperado</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:38,fontWeight:700,color:T.accent,lineHeight:1}}>{fmt(totE)}</div>
          <div style={{fontSize:12,color:T.muted,marginTop:4}}>{all.length} lançamento{all.length!==1?"s":""} · {MFL[mes-1]} {ano}</div>
        </div>
        <div style={{flex:1,minWidth:180}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <span style={{fontSize:12,color:T.successText,fontWeight:600}}>✅ Recebido: {fmt(totR)}</span>
            <span style={{fontSize:12,color:T.warnText,fontWeight:600}}>⏳ Pendente: {fmt(totE-totR)}</span>
          </div>
          <div style={{height:12,background:T.border,borderRadius:6,overflow:"hidden",position:"relative"}}>
            <div style={{width:`${pct}%`,height:"100%",background:pct===100?"#10b981":T.accent,borderRadius:6,transition:"width .5s"}}/>
          </div>
          <div style={{textAlign:"center",marginTop:6,fontSize:13,color:T.muted,fontWeight:600}}>{pct}% recebido</div>
        </div>
      </div>

      {/* by area pills */}
      {Object.keys(byArea).length>0&&(
        <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
          {Object.entries(byArea).map(([area,v])=>{const c=AREA_COLORS[area]||"#94a3b8";return(
            <div key={area} style={{background:c+"18",border:`1px solid ${c}44`,borderRadius:10,padding:"8px 14px",display:"flex",flexDirection:"column",gap:3,flex:"1 1 140px"}}>
              <div style={{fontSize:10,color:c,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em"}}>{area}</div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:700,color:c}}>{fmt(v.total)}</div>
              <div style={{height:3,background:c+"33",borderRadius:2,overflow:"hidden"}}><div style={{width:`${v.total>0?Math.round(v.recebido/v.total*100):0}%`,height:"100%",background:c}}/></div>
              <div style={{fontSize:10,color:c,opacity:.8}}>{fmt(v.recebido)} recebido</div>
            </div>
          );})}
        </div>
      )}

      {/* form */}
      {showForm&&(
        <div style={{background:T.card,border:`1px solid ${T.border2}`,borderRadius:12,padding:18,marginBottom:16}}>
          <div style={{fontSize:13,color:T.accent,fontWeight:600,marginBottom:14}}>{editId?"✏ Editar":"+ Novo Pagamento Manual"}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
            <Fld T={T} label="Cliente" value={form.cliente} onChange={v=>setForm(d=>({...d,cliente:v}))}/>
            <Fld T={T} label="Advogado" value={form.advogado} onChange={v=>setForm(d=>({...d,advogado:v}))}/>
            <Fld T={T} label="Telefone / WhatsApp" value={form.telefone} onChange={v=>setForm(d=>({...d,telefone:v}))} ph="(00) 00000-0000"/>
            <Fld T={T} label="Nº do Processo" value={form.numeroProcesso} onChange={v=>setForm(d=>({...d,numeroProcesso:v}))}/>
            <div style={{gridColumn:"1/-1"}}><Fld T={T} label="Área de Atuação" value={form.areaAtuacao} onChange={v=>setForm(d=>({...d,areaAtuacao:v}))} options={AREAS}/></div>
            <Fld T={T} label="Descrição / Referência" value={form.descricao} onChange={v=>setForm(d=>({...d,descricao:v}))} ph="ex: Honorários, Parcela 2/3…"/>
            <Fld T={T} label="Valor (R$)" value={form.valor} onChange={v=>setForm(d=>({...d,valor:v}))}/>
            <div style={{display:"flex",flexDirection:"column",gap:5}}><label style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em"}}>Mês</label><select value={form.mes} onChange={e=>setForm(d=>({...d,mes:Number(e.target.value)}))} style={{background:T.inp,border:`1px solid ${T.border2}`,borderRadius:6,padding:"7px 10px",color:T.text,fontFamily:"'DM Mono',monospace",fontSize:12}}>{MFL.map((m,i)=><option key={i} value={i+1}>{m}</option>)}</select></div>
            <Fld T={T} label="Ano" value={form.ano} onChange={v=>setForm(d=>({...d,ano:Number(v)}))} type="number"/>
            <Fld T={T} label="Forma de Pagamento" value={form.formaPagamento} onChange={v=>setForm(d=>({...d,formaPagamento:v}))} options={FORMAS}/>
            <div style={{display:"flex",alignItems:"center",gap:8,paddingTop:22}}><input type="checkbox" checked={form.pago} onChange={e=>setForm(d=>({...d,pago:e.target.checked}))} style={{accentColor:T.accent,width:16,height:16,cursor:"pointer"}}/><label style={{fontSize:12,color:T.text,cursor:"pointer"}}>Já recebido</label></div>
            {/* checkbox para ativar parceria */}
            <div style={{gridColumn:"1/-1"}}>
              <label style={{display:"flex",gap:10,alignItems:"center",cursor:"pointer",padding:"10px 14px",background:T.card2,borderRadius:8,border:`1px solid ${T.border}`}}>
                <input type="checkbox" checked={!!form.temParceria} onChange={e=>setForm(d=>({...d,temParceria:e.target.checked,coAdvogado:"",percCoAdv:""}))} style={{accentColor:T.accent,width:16,height:16,cursor:"pointer"}}/>
                <span style={{fontSize:12,color:T.text,fontWeight:500}}>🤝 Este pagamento tem parceria com outro advogado</span>
              </label>
            </div>
            {/* campos de parceria — só aparece se checkbox marcado */}
            {form.temParceria&&(
              <div style={{gridColumn:"1/-1",background:T.infoBg,borderRadius:8,border:`1px solid ${T.infoText}44`,padding:"14px 16px"}}>
                <div style={{fontSize:11,color:T.infoText,fontWeight:600,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.07em"}}>Divisão de Honorários</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 120px",gap:10,marginBottom:10}}>
                  <Fld T={T} label="Nome do co-advogado" value={form.coAdvogado||""} onChange={v=>setForm(d=>({...d,coAdvogado:v}))} ph="Nome do parceiro"/>
                  <Fld T={T} label="% do co-advogado" value={form.percCoAdv||""} onChange={v=>setForm(d=>({...d,percCoAdv:v}))} type="number" ph="ex: 40"/>
                </div>
                {form.coAdvogado&&form.percCoAdv&&fmtN(form.valor)>0&&(
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    <span style={{background:T.successBg,color:T.successText,borderRadius:6,padding:"5px 12px",fontSize:12,fontWeight:700}}>
                      ⚖️ {ADV_PRINCIPAL}: {100-fmtN(form.percCoAdv)}% = {fmt(fmtN(form.valor)*(100-fmtN(form.percCoAdv))/100)}
                    </span>
                    <span style={{background:T.card,color:T.infoText,borderRadius:6,padding:"5px 12px",fontSize:12,fontWeight:700,border:`1px solid ${T.infoText}44`}}>
                      🤝 {form.coAdvogado}: {form.percCoAdv}% = {fmt(fmtN(form.valor)*fmtN(form.percCoAdv)/100)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
          <div style={{display:"flex",gap:8}}><Btn T={T} variant="secondary" onClick={()=>{setShowForm(false);setEditId(null);}}>Cancelar</Btn><Btn T={T} onClick={saveForm}>💾 Salvar</Btn></div>
        </div>
      )}

      {/* entries */}
      {all.length===0&&noSch.length===0
        ?<div style={{textAlign:"center",color:T.muted,padding:"60px 0"}}><div style={{fontSize:36,marginBottom:12}}>📭</div>Nenhum pagamento em {MFL[mes-1]} de {ano}.</div>
        :<div style={{display:"flex",flexDirection:"column",gap:10}}>
          {all.map(e=>{
            const isSch=e._t==="s",c=isSch?e.contrato:null;
            const coAdvs=isSch?(c.coAdvogados||[]):[];
            const primP=100-coAdvs.reduce((s,a)=>s+fmtN(a.percentual),0);
            const area=isSch?c.areaAtuacao:e.areaAtuacao;
            const aColor=AREA_COLORS[area]||"#94a3b8";
            return(
              <div key={e.id} style={{background:T.card,border:`2px solid ${e.pago?T.successText+"66":T.border}`,borderRadius:16,overflow:"hidden",transition:"border .2s",boxShadow:`0 2px 8px ${aColor}18`}}>
                {/* left accent bar */}
                <div style={{display:"flex"}}>
                  <div style={{width:5,background:e.pago?"#10b981":aColor,flexShrink:0}}/>
                  <div style={{flex:1}}>
                    {/* top: client hero */}
                    <div style={{display:"flex",alignItems:"flex-start",gap:14,padding:"16px 18px 12px"}}>
                      <input type="checkbox" checked={e.pago} onChange={()=>isSch?togS(c.id,e.id):togM(e.id)} style={{width:22,height:22,cursor:"pointer",accentColor:e.pago?"#10b981":aColor,flexShrink:0,marginTop:4}}/>
                      {/* avatar inicial */}
                      <div style={{width:46,height:46,borderRadius:12,background:aColor+"28",border:`2px solid ${aColor}44`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,color:aColor}}>{(isSch?c.cliente:e.cliente)?.[0]?.toUpperCase()||"?"}</span>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        {/* nome + badges */}
                        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:6}}>
                          <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:T.strong,fontWeight:700,lineHeight:1}}>{isSch?c.cliente:e.cliente}</span>
                          <ABadge area={area}/>
                          {!isSch&&<span style={{fontSize:10,background:T.warnBg,color:T.warnText,borderRadius:4,padding:"2px 7px",fontWeight:600}}>Manual</span>}
                        </div>
                        {/* info row */}
                        <div style={{display:"flex",gap:0,flexWrap:"wrap"}}>
                          {/* advogado */}
                          <div style={{display:"flex",alignItems:"center",gap:5,marginRight:16,marginBottom:4}}>
                            <span style={{fontSize:10,color:T.muted}}>⚖️</span>
                            <span style={{fontSize:12,color:T.accent,fontWeight:600}}>{isSch?c.advogado:e.advogado}</span>
                          </div>
                          {/* telefone */}
                          {(isSch?c.telefone:e.telefone)&&<div style={{display:"flex",alignItems:"center",gap:4,marginRight:16,marginBottom:4}}><PhoneLink phone={isSch?c.telefone:e.telefone}/></div>}
                          {/* processo */}
                          {(isSch?c.numeroProcesso:e.numeroProcesso)&&<div style={{display:"flex",alignItems:"center",gap:4,marginRight:16,marginBottom:4}}>
                            <span style={{fontSize:10,color:T.muted}}>📋</span>
                            <span style={{fontSize:11,color:T.muted,fontFamily:"'DM Mono',monospace"}}>{isSch?c.numeroProcesso:e.numeroProcesso}</span>
                          </div>}
                          {/* descrição */}
                          {e.descricao&&<div style={{display:"flex",alignItems:"center",gap:4,marginBottom:4}}>
                            <span style={{fontSize:10,color:T.muted}}>💬</span>
                            <span style={{fontSize:11,color:T.muted,fontStyle:"italic"}}>{e.descricao}</span>
                          </div>}
                        </div>
                        {/* forma pagamento */}
                        {(isSch?c.formaPagamento:e.formaPagamento)&&<span style={{fontSize:10,background:T.card2,border:`1px solid ${T.border}`,borderRadius:4,padding:"2px 7px",color:T.muted}}>{isSch?c.formaPagamento:e.formaPagamento}</span>}
                      </div>
                      {/* valor + status */}
                      <div style={{textAlign:"right",flexShrink:0,display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
                        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:32,fontWeight:700,color:e.pago?"#10b981":T.accent,lineHeight:1}}>{fmt(e.valor)}</div>
                        <div style={{display:"inline-flex",alignItems:"center",gap:6,background:e.pago?"#10b98122":aColor+"18",color:e.pago?"#10b981":aColor,border:`1px solid ${e.pago?"#10b98155":aColor+"44"}`,borderRadius:8,padding:"5px 12px",fontSize:12,fontWeight:700}}>
                          {e.pago?"✅ Recebido":"⏳ Aguardando"}
                        </div>
                        {!isSch&&<div style={{display:"flex",gap:4}}>
                          <button className="bhov" onClick={()=>editE(e)} style={{background:T.infoBg,border:"none",borderRadius:5,padding:"5px 8px",fontSize:12}}>✏</button>
                          <button className="bhov" onClick={()=>delM(e.id)} style={{background:T.dangerBg,border:"none",borderRadius:5,padding:"5px 8px",fontSize:12}}>🗑</button>
                        </div>}
                      </div>
                    </div>
                  </div>
                </div>
                {coAdvs.length>0&&(
                  <div style={{borderTop:`1px solid ${T.border}`,padding:"10px 18px",background:T.card2}}>
                    <div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Divisão Proporcional</div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      {[{nome:c.advogado||ADV_PRINCIPAL,percentual:primP},...coAdvs].map((a,i)=>(
                        <div key={i} style={{background:T.card,borderRadius:8,padding:"8px 12px",border:`1px solid ${T.border}`,flex:"1 1 130px"}}>
                          <div style={{fontSize:11,color:i===0?T.accent:T.infoText,fontWeight:600}}>{a.nome}</div>
                          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,color:T.strong,fontWeight:700}}>{fmt(fmtN(e.valor)*fmtN(a.percentual)/100)}</div>
                          <div style={{fontSize:10,color:T.muted}}>{a.percentual}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {noSch.length>0&&<div style={{background:T.warnBg,border:`1px solid ${T.warnText}44`,borderRadius:12,padding:"13px 18px"}}><div style={{fontSize:11,color:T.warnText,fontWeight:600,marginBottom:8}}>⚠ Contratos Em Pagamento sem parcela neste mês</div>{noSch.map(c=><div key={c.id} style={{fontSize:12,color:T.muted,marginBottom:4}}>· {c.cliente} — {fmt(c.valorTotal)}</div>)}</div>}
        </div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TAB CUSTOS — com compensação de receita
═══════════════════════════════════════════════════════ */
function TabCustos({T,contracts,setContracts,manual,mes:curMes,ano:curAno}){
  const now=new Date();
  const [mes,setMes]=useState(now.getMonth()+1);const [ano,setAno]=useState(now.getFullYear());
  const [costs,_setCosts]=useState([]);
  const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({descricao:"",categoria:"Aluguel",valor:"",recorrente:false,mes:now.getMonth()+1,ano:now.getFullYear(),pago:false});
  const [editId,setEditId]=useState(null);
  const [costsData,setCostsData]=useState([]);
  // costsData is passed from parent via prop; we need a different approach
  // Actually this tab receives costs and setCosts as props
  return null; // placeholder — see actual implementation below
}

// Real implementation as a named export
function CostsTab({T,contracts,manual,costs,setCosts}){
  const now=new Date();
  const [mes,setMes]=useState(now.getMonth()+1);const [ano,setAno]=useState(now.getFullYear());
  const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({descricao:"",categoria:"Aluguel",valor:"",recorrente:false,mes:now.getMonth()+1,ano:now.getFullYear(),pago:false,dataPagamento:new Date().toLocaleDateString("pt-BR")});
  const [editId,setEditId]=useState(null);
  const monthly=costs.filter(c=>c.mes===mes&&c.ano===ano);
  const years=Array.from({length:6},(_,i)=>now.getFullYear()-2+i);

  // receita do mês: cronogramas pagos + pagamentos manuais pagos
  const schedRec=contracts.flatMap(c=>(c.schedule||[]).filter(s=>s.mes===mes&&s.ano===ano&&s.pago)).reduce((s,e)=>s+fmtN(e.valor),0);
  const manRec=manual.filter(p=>p.mes===mes&&p.ano===ano&&p.pago).reduce((s,p)=>s+fmtN(p.valor),0);
  const totalRec=schedRec+manRec;

  const totM=monthly.reduce((s,c)=>s+fmtN(c.valor),0);
  const totPago=monthly.filter(c=>c.pago).reduce((s,c)=>s+fmtN(c.valor),0);
  const saldo=totalRec-totM;
  const byCat=COST_CATS.map(cat=>({cat,tot:monthly.filter(c=>c.categoria===cat).reduce((s,c)=>s+fmtN(c.valor),0)})).filter(g=>g.tot>0);

  function save(){
    if(!form.descricao||!form.valor)return;
    if(editId){setCosts(p=>p.map(c=>c.id===editId?{...form,id:editId,valor:fmtN(form.valor)}:c));setEditId(null);}
    else{const base={...form,id:genId(),valor:fmtN(form.valor)};
      if(form.recorrente){const all=Array.from({length:12},(_,i)=>{let m=form.mes+i,a=form.ano;while(m>12){m-=12;a++;}return{...base,id:i===0?base.id:genId(),mes:m,ano:a};});setCosts(p=>[...p,...all]);}
      else setCosts(p=>[...p,base]);}
    setForm({descricao:"",categoria:"Aluguel",valor:"",recorrente:false,mes,ano,pago:false,dataPagamento:new Date().toLocaleDateString("pt-BR")});setShowForm(false);
  }
  async function delCost(id){if(!await askConfirm("Confirmar exclusão deste custo?"))return;setCosts(p=>p.filter(x=>x.id!==id));}

  const isNegativo=saldo<0;

  return(
    <div>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:T.accent,fontWeight:700}}>Custos</span>
        <div style={{display:"flex",alignItems:"center",gap:4,background:T.card,border:`1px solid ${T.border2}`,borderRadius:10,padding:"4px 8px"}}>
          <button className="bhov nav-arrow" onClick={()=>{let m=mes-1,a=ano;if(m<1){m=12;a--;}setMes(m);setAno(a);}} style={{background:T.card2,border:"none",fontSize:20,cursor:"pointer",color:T.accent,padding:"2px 8px",lineHeight:1,borderRadius:6,fontWeight:700}}>‹</button>
          <select value={mes} onChange={e=>setMes(Number(e.target.value))} style={{background:"transparent",border:"none",color:T.strong,fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600,cursor:"pointer",outline:"none"}}>{MFL.map((m,i)=><option key={i} value={i+1}>{m}</option>)}</select>
          <button className="bhov nav-arrow" onClick={()=>{let m=mes+1,a=ano;if(m>12){m=1;a++;}setMes(m);setAno(a);}} style={{background:T.card2,border:"none",fontSize:20,cursor:"pointer",color:T.accent,padding:"2px 8px",lineHeight:1,borderRadius:6,fontWeight:700}}>›</button>
          <span style={{color:T.border2,margin:"0 4px",fontSize:16}}>|</span>
          <button className="bhov nav-arrow" onClick={()=>setAno(a=>a-1)} style={{background:T.card2,border:"none",fontSize:16,cursor:"pointer",color:T.accent,padding:"2px 8px",lineHeight:1,borderRadius:6,fontWeight:700}}>‹</button>
          <span style={{color:T.strong,fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600,minWidth:44,textAlign:"center"}}>{ano}</span>
          <button className="bhov nav-arrow" onClick={()=>setAno(a=>a+1)} style={{background:T.card2,border:"none",fontSize:16,cursor:"pointer",color:T.accent,padding:"2px 8px",lineHeight:1,borderRadius:6,fontWeight:700}}>›</button>
        </div>
        <div style={{flex:1}}/>
        <Btn T={T} onClick={()=>{setEditId(null);setForm({descricao:"",categoria:"Aluguel",valor:"",recorrente:false,mes,ano,pago:false,dataPagamento:new Date().toLocaleDateString("pt-BR")});setShowForm(true);}}>+ Novo Custo</Btn>
      </div>

      {/* COMPENSAÇÃO — receita vs custos */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr) 1.2fr",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        <div style={{background:T.successBg,border:`1px solid ${T.successText}44`,borderRadius:12,padding:"16px 18px",textAlign:"center"}}>
          <div style={{fontSize:10,color:T.successText,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>↗ Receita Recebida</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:700,color:T.successText}}>{fmt(totalRec)}</div>
          <div style={{fontSize:10,color:T.successText,opacity:.7,marginTop:3}}>Pagamentos confirmados</div>
        </div>
        <div style={{background:T.dangerBg,border:`1px solid ${T.dangerText}44`,borderRadius:12,padding:"16px 18px",textAlign:"center"}}>
          <div style={{fontSize:10,color:T.dangerText,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>↘ Custos do Mês</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:700,color:T.dangerText}}>{fmt(totM)}</div>
          <div style={{fontSize:10,color:T.dangerText,opacity:.7,marginTop:3}}>Total lançado</div>
        </div>
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px 18px",textAlign:"center"}}>
          <div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>Custos Pagos</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:700,color:T.accent}}>{fmt(totPago)}</div>
          <div style={{fontSize:10,color:T.muted,opacity:.7,marginTop:3}}>de {fmt(totM)} total</div>
        </div>
        <div style={{background:isNegativo?T.dangerBg:T.successBg,border:`2px solid ${isNegativo?T.dangerText:T.successText}66`,borderRadius:12,padding:"16px 18px",textAlign:"center",gridRow:"1"}}>
          <div style={{fontSize:10,color:isNegativo?T.dangerText:T.successText,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>
            {isNegativo?"🔴 No Vermelho":"🟢 Resultado"}
          </div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:32,fontWeight:700,color:isNegativo?T.dangerText:T.successText}}>{fmt(saldo)}</div>
          <div style={{height:4,background:(isNegativo?T.dangerText:T.successText)+"33",borderRadius:2,margin:"8px 0 4px",overflow:"hidden"}}>
            <div style={{width:totM>0?`${Math.min(100,totalRec/totM*100)}%`:"0%",height:"100%",background:isNegativo?T.dangerText:T.successText,borderRadius:2}}/>
          </div>
          <div style={{fontSize:10,color:isNegativo?T.dangerText:T.successText,opacity:.8}}>Receita cobre {totM>0?Math.round(totalRec/totM*100):0}% dos custos</div>
        </div>
      </div>

      {byCat.length>0&&<div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>{byCat.map(g=><div key={g.cat} style={{background:T.card2,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 12px",flex:"1 1 100px",textAlign:"center"}}><div style={{fontSize:16,marginBottom:2}}>{COST_EMOJI[g.cat]||"📌"}</div><div style={{fontSize:12,color:T.accent,fontWeight:700}}>{fmt(g.tot)}</div><div style={{fontSize:10,color:T.muted,marginTop:1}}>{g.cat}</div></div>)}</div>}

      {showForm&&(
        <div style={{background:T.card,border:`1px solid ${T.border2}`,borderRadius:12,padding:18,marginBottom:16}}>
          <div style={{fontSize:13,color:T.accent,fontWeight:600,marginBottom:14}}>{editId?"✏ Editar":"+ Novo Custo"}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:12}}>
            <div style={{gridColumn:"1/-1"}}><Fld T={T} label="Descrição" value={form.descricao} onChange={v=>setForm(d=>({...d,descricao:v}))}/></div>
            <Fld T={T} label="Categoria" value={form.categoria} onChange={v=>setForm(d=>({...d,categoria:v}))} options={COST_CATS}/>
            <Fld T={T} label="Valor R$" value={form.valor} onChange={v=>setForm(d=>({...d,valor:v}))}/>
            <div style={{display:"flex",flexDirection:"column",gap:5}}><label style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em"}}>Mês</label><select value={form.mes} onChange={e=>setForm(d=>({...d,mes:Number(e.target.value)}))} style={{background:T.inp,border:`1px solid ${T.border2}`,borderRadius:6,padding:"7px 10px",color:T.text,fontFamily:"'DM Mono',monospace",fontSize:12}}>{MFL.map((m,i)=><option key={i} value={i+1}>{m}</option>)}</select></div>
            <Fld T={T} label="Ano" value={form.ano} onChange={v=>setForm(d=>({...d,ano:Number(v)}))} type="number"/>
            <Fld T={T} label="Data do Pagamento" value={form.dataPagamento||""} onChange={v=>setForm(d=>({...d,dataPagamento:v}))} ph="dd/mm/aaaa"/>
          </div>
          <div style={{display:"flex",gap:16,alignItems:"center",marginBottom:14}}>
            <label style={{display:"flex",gap:8,alignItems:"center",cursor:"pointer",fontSize:12,color:T.text}}><input type="checkbox" checked={form.pago} onChange={e=>setForm(d=>({...d,pago:e.target.checked}))} style={{accentColor:T.accent}}/> Já pago</label>
            {!editId&&<label style={{display:"flex",gap:8,alignItems:"center",cursor:"pointer",fontSize:12,color:T.text}}><input type="checkbox" checked={form.recorrente} onChange={e=>setForm(d=>({...d,recorrente:e.target.checked}))} style={{accentColor:T.accent}}/> Recorrente (12 meses)</label>}
          </div>
          <div style={{display:"flex",gap:8}}><Btn T={T} variant="secondary" onClick={()=>setShowForm(false)}>Cancelar</Btn><Btn T={T} onClick={save}>💾 Salvar</Btn></div>
        </div>
      )}

      {monthly.length===0
        ?<div style={{textAlign:"center",color:T.muted,padding:"60px 0"}}><div style={{fontSize:32,marginBottom:12}}>🏢</div>Nenhum custo em {MFL[mes-1]} de {ano}.</div>
        :<div style={{overflowX:"auto",borderRadius:10,border:`1px solid ${T.border}`}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr style={{background:T.card2}}>{["","Descrição","Categoria","Valor","Data Pgto","Status",""].map(h=><th key={h} style={{padding:"9px 12px",textAlign:"left",fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em",borderBottom:`1px solid ${T.border}`,fontWeight:500}}>{h}</th>)}</tr></thead>
            <tbody>
              {monthly.map((c,i)=>(
                <tr key={c.id} className="row-hover" style={{background:i%2===0?T.card:T.stripe,borderBottom:`1px solid ${T.border}`}}>
                  <td style={{padding:"9px 12px"}}><input type="checkbox" checked={c.pago} onChange={()=>setCosts(p=>p.map(x=>x.id===c.id?{...x,pago:!x.pago}:x))} style={{cursor:"pointer",accentColor:T.accent}}/></td>
                  <td style={{padding:"9px 12px",color:T.strong}}>{c.descricao}</td>
                  <td style={{padding:"9px 12px"}}><span style={{background:T.card2,border:`1px solid ${T.border2}`,borderRadius:4,padding:"2px 8px",fontSize:11,color:T.muted}}>{COST_EMOJI[c.categoria]||"📌"} {c.categoria}</span></td>
                  <td style={{padding:"9px 12px",color:T.accent,fontWeight:700}}>{fmt(c.valor)}</td>
                  <td style={{padding:"9px 12px",color:T.muted,fontSize:11}}>{c.dataPagamento||`${MFS[c.mes-1]}/${c.ano}`}</td>
                  <td style={{padding:"9px 12px"}}><span style={{fontSize:11,color:c.pago?T.successText:T.dangerText,fontWeight:600}}>{c.pago?"✅ Pago":"🔴 Pendente"}</span></td>
                  <td style={{padding:"9px 12px"}}><div style={{display:"flex",gap:5}}>
                    <button className="bhov" onClick={()=>{setForm({...c,valor:String(c.valor),dataPagamento:c.dataPagamento||new Date().toLocaleDateString("pt-BR")});setEditId(c.id);setShowForm(true);}} style={{background:T.infoBg,border:"none",borderRadius:5,padding:"4px 8px",fontSize:12}}>✏</button>
                    <button className="bhov" onClick={()=>delCost(c.id)} style={{background:T.dangerBg,border:"none",borderRadius:5,padding:"4px 8px",fontSize:12}}>🗑</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr style={{background:T.card2,borderTop:`2px solid ${T.border2}`}}><td colSpan={3} style={{padding:"10px 12px",fontSize:11,color:T.muted,textTransform:"uppercase"}}>Total</td><td style={{padding:"10px 12px",color:T.accent,fontWeight:700,fontSize:14}}>{fmt(totM)}</td><td colSpan={3} style={{padding:"10px 12px",fontSize:11,color:T.muted}}>Pago: {fmt(totPago)} · A pagar: {fmt(totM-totPago)}</td></tr></tfoot>
          </table>
        </div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TAB RELATÓRIO — gráfico de linha entrada vs saída
═══════════════════════════════════════════════════════ */
function TabRelatorio({T,contracts,manual,costs}){
  const now=new Date();
  const [anoSel,setAnoSel]=useState(now.getFullYear());
  const [meses,setMeses]=useState([now.getMonth()]); // apenas mês atual por padrão
  const chartRef=useRef(null);
  const chartInst=useRef(null);
  const years=Array.from({length:5},(_,i)=>now.getFullYear()-2+i);

  function togMes(i){setMeses(m=>m.includes(i)?m.filter(x=>x!==i):[...m,i].sort((a,b)=>a-b));}
  function selAll(){setMeses([0,1,2,3,4,5,6,7,8,9,10,11]);}
  function selNone(){setMeses([]);}

  // compute data per month
  const labels=meses.map(m=>MFS[m]);
  const entradas=meses.map(m=>{
    const s=contracts.flatMap(c=>(c.schedule||[]).filter(x=>x.mes===m+1&&x.ano===anoSel&&x.pago)).reduce((a,e)=>a+fmtN(e.valor),0);
    const man=manual.filter(p=>p.mes===m+1&&p.ano===anoSel&&p.pago).reduce((a,p)=>a+fmtN(p.valor),0);
    return s+man;
  });
  const saidas=meses.map(m=>costs.filter(c=>c.mes===m+1&&c.ano===anoSel).reduce((a,c)=>a+fmtN(c.valor),0));
  const saldos=entradas.map((e,i)=>e-saidas[i]);

  const totEnt=entradas.reduce((s,v)=>s+v,0);
  const totSai=saidas.reduce((s,v)=>s+v,0);
  const totSal=totEnt-totSai;

  useEffect(()=>{
    if(!chartRef.current||meses.length===0)return;
    if(chartInst.current)chartInst.current.destroy();
    const isDark=T.id==="dark";
    chartInst.current=new Chart(chartRef.current,{
      type:"line",
      data:{
        labels,
        datasets:[
          {label:"Entradas",data:entradas,borderColor:"#10b981",backgroundColor:"#10b98122",fill:true,tension:.35,pointRadius:5,pointBackgroundColor:"#10b981",borderWidth:2.5},
          {label:"Saídas",data:saidas,borderColor:"#ef4444",backgroundColor:"#ef444422",fill:true,tension:.35,pointRadius:5,pointBackgroundColor:"#ef4444",borderWidth:2.5},
          {label:"Saldo",data:saldos,borderColor:T.accent,backgroundColor:"transparent",fill:false,tension:.35,pointRadius:4,pointBackgroundColor:T.accent,borderWidth:2,borderDash:[6,3]},
        ],
      },
      options:{
        responsive:true,maintainAspectRatio:false,
        interaction:{mode:"index",intersect:false},
        plugins:{
          legend:{labels:{color:T.chartText,font:{family:"'DM Mono',monospace",size:12},boxWidth:12,padding:20}},
          tooltip:{backgroundColor:T.card,borderColor:T.border,borderWidth:1,titleColor:T.strong,bodyColor:T.muted,padding:12,callbacks:{label:ctx=>" "+ctx.dataset.label+": "+fmt(ctx.raw)}},
        },
        scales:{
          x:{grid:{color:T.chartGrid},ticks:{color:T.chartText,font:{family:"'DM Mono',monospace",size:11}}},
          y:{grid:{color:T.chartGrid},ticks:{color:T.chartText,font:{family:"'DM Mono',monospace",size:11},callback:v=>v>=1000?(v/1000).toFixed(0)+"k":v},beginAtZero:true},
        },
      },
    });
    return()=>{if(chartInst.current)chartInst.current.destroy();};
  },[meses,anoSel,contracts,manual,costs,T]);

  return(
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16,flexWrap:"wrap"}}>
        <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:T.accent,fontWeight:700}}>Relatório —</span>
        <select value={anoSel} onChange={e=>setAnoSel(Number(e.target.value))} style={{background:T.card,border:`1px solid ${T.border2}`,borderRadius:8,padding:"7px 13px",color:T.strong,fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600,cursor:"pointer"}}>{years.map(y=><option key={y} value={y}>{y}</option>)}</select>
        <div style={{flex:1}}/>
        <Btn T={T} variant="ghost" onClick={selAll} style={{padding:"5px 10px"}}>Todos</Btn>
        <Btn T={T} variant="ghost" onClick={selNone} style={{padding:"5px 10px"}}>Limpar</Btn>
      </div>

      {/* month selector */}
      <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
        {MFS.map((m,i)=>(
          <button key={i} onClick={()=>togMes(i)} className="bhov"
            style={{background:meses.includes(i)?T.accent:T.card2,color:meses.includes(i)?T.accentText:T.muted,border:`1px solid ${meses.includes(i)?T.accent:T.border}`,borderRadius:7,padding:"6px 12px",fontSize:12,fontFamily:"'DM Mono',monospace",fontWeight:meses.includes(i)?600:400,cursor:"pointer",transition:"all .15s"}}>
            {m}
          </button>
        ))}
      </div>

      {/* summary cards */}
      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        <div style={{background:T.successBg,border:`1px solid ${T.successText}44`,borderRadius:12,padding:"14px 18px",flex:"1 1 140px",textAlign:"center"}}>
          <div style={{fontSize:10,color:T.successText,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>Total Entradas</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:700,color:T.successText}}>{fmt(totEnt)}</div>
        </div>
        <div style={{background:T.dangerBg,border:`1px solid ${T.dangerText}44`,borderRadius:12,padding:"14px 18px",flex:"1 1 140px",textAlign:"center"}}>
          <div style={{fontSize:10,color:T.dangerText,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>Total Saídas</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:700,color:T.dangerText}}>{fmt(totSai)}</div>
        </div>
        <div style={{background:totSal>=0?T.successBg:T.dangerBg,border:`1px solid ${totSal>=0?T.successText:T.dangerText}55`,borderRadius:12,padding:"14px 18px",flex:"1 1 140px",textAlign:"center"}}>
          <div style={{fontSize:10,color:totSal>=0?T.successText:T.dangerText,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>Saldo Período</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:700,color:totSal>=0?T.successText:T.dangerText}}>{fmt(totSal)}</div>
        </div>
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"14px 18px",flex:"1 1 140px",textAlign:"center"}}>
          <div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>Meses Selecionados</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:700,color:T.accent}}>{meses.length}</div>
        </div>
      </div>

      {/* chart */}
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"20px 20px 16px"}}>
        <div style={{fontSize:12,color:T.muted,marginBottom:12,fontWeight:500}}>Entradas × Saídas × Saldo — {anoSel}</div>
        {meses.length===0
          ?<div style={{textAlign:"center",color:T.muted,padding:"60px 0",fontSize:13}}>Selecione ao menos um mês acima para exibir o gráfico.</div>
          :<div style={{height:340,position:"relative"}}><canvas ref={chartRef}/></div>}
      </div>

      {/* monthly breakdown table */}
      {meses.length>0&&(
        <div style={{overflowX:"auto",borderRadius:10,border:`1px solid ${T.border}`,marginTop:16}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr style={{background:T.card2}}>{["Mês","Entradas","Saídas","Saldo"].map(h=><th key={h} style={{padding:"9px 14px",textAlign:"left",fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em",borderBottom:`1px solid ${T.border}`,fontWeight:500}}>{h}</th>)}</tr></thead>
            <tbody>
              {meses.map((m,i)=>{const sal=saldos[i];return(
                <tr key={m} className="row-hover" style={{background:i%2===0?T.card:T.stripe,borderBottom:`1px solid ${T.border}`}}>
                  <td style={{padding:"10px 14px",color:T.strong,fontWeight:500}}>{MFL[m]} {anoSel}</td>
                  <td style={{padding:"10px 14px",color:"#10b981",fontWeight:600}}>{fmt(entradas[i])}</td>
                  <td style={{padding:"10px 14px",color:"#ef4444",fontWeight:600}}>{fmt(saidas[i])}</td>
                  <td style={{padding:"10px 14px",fontWeight:700,color:sal>=0?"#10b981":"#ef4444"}}>{sal>=0?"▲":"▼"} {fmt(Math.abs(sal))}</td>
                </tr>);})}
            </tbody>
            <tfoot><tr style={{background:T.card2,borderTop:`2px solid ${T.border2}`}}>
              <td style={{padding:"10px 14px",fontSize:11,color:T.muted,textTransform:"uppercase"}}>Total</td>
              <td style={{padding:"10px 14px",color:"#10b981",fontWeight:700}}>{fmt(totEnt)}</td>
              <td style={{padding:"10px 14px",color:"#ef4444",fontWeight:700}}>{fmt(totSai)}</td>
              <td style={{padding:"10px 14px",fontWeight:700,color:totSal>=0?"#10b981":"#ef4444"}}>{fmt(totSal)}</td>
            </tr></tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TAB CLIENTES — lista com edição e exclusão
═══════════════════════════════════════════════════════ */
const EMPTY_CLIENTE = ()=>({id:genId(),nome:"",cpf:"",telefone:"",email:"",endereco:"",cidade:"",observacoes:""});

function fmtCPF(v){
  const d=v.replace(/\D/g,"").slice(0,11);
  if(d.length<=3)return d;
  if(d.length<=6)return d.replace(/(\d{3})(\d)/,"$1.$2");
  if(d.length<=9)return d.replace(/(\d{3})(\d{3})(\d)/,"$1.$2.$3");
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/,"$1.$2.$3-$4");
}

function TabClientes({T,contracts,manual,clientesExtra,setClientesExtra,contatos,marcarContato}){
  const [busca,setBusca]=useState("");
  const [modalCliente,setModalCliente]=useState(null);
  const [showForm,setShowForm]=useState(false);
  const [formCl,setFormCl]=useState(EMPTY_CLIENTE());
  const [editId,setEditId]=useState(null);

  // ── Atualização WhatsApp ──────────────────────────────
  const [modalAtualizar,setModalAtualizar]=useState(null); // cliente sendo atualizado
  const [msgAtualizar,setMsgAtualizar]=useState("");
  const [gerandoIA,setGerandoIA]=useState(false);
  const [erroIA,setErroIA]=useState("");
  // Fila: array de clientes selecionados para envio em sequência
  const [fila,setFila]=useState([]);
  const [modoFila,setModoFila]=useState(false);
  const [filaIdx,setFilaIdx]=useState(0);

  // Mapa de clientes vindos de contratos/pagamentos
  const clientMap={};
  contracts.forEach(c=>{
    if(!c.cliente)return;
    const k=c.cliente.trim().toLowerCase();
    if(!clientMap[k])clientMap[k]={nome:c.cliente,telefone:c.telefone||"",processos:[],valorTotal:0,valorRecebido:0,areas:new Set(),status:{}};
    const cl=clientMap[k];
    if(c.telefone&&!cl.telefone)cl.telefone=c.telefone;
    cl.processos.push({numeroProcesso:c.numeroProcesso||"",area:c.areaAtuacao,status:c.status,valorTotal:fmtN(c.valorTotal),dataUpload:c.dataUpload});
    cl.valorTotal+=fmtN(c.valorTotal);
    cl.areas.add(c.areaAtuacao);
    cl.status[c.status]=(cl.status[c.status]||0)+1;
    (c.schedule||[]).filter(s=>s.pago).forEach(s=>cl.valorRecebido+=fmtN(s.valor));
  });
  manual.forEach(p=>{
    if(!p.cliente)return;
    const k=p.cliente.trim().toLowerCase();
    if(!clientMap[k])clientMap[k]={nome:p.cliente,telefone:p.telefone||"",processos:[],valorTotal:0,valorRecebido:0,areas:new Set(),status:{}};
    const cl=clientMap[k];
    if(p.telefone&&!cl.telefone)cl.telefone=p.telefone;
    cl.valorTotal+=fmtN(p.valor);
    cl.areas.add(p.areaAtuacao);
    if(p.pago)cl.valorRecebido+=fmtN(p.valor);
  });

  // Mescla clientes cadastrados manualmente com os derivados
  const allKeys=new Set([...Object.keys(clientMap),...(clientesExtra||[]).map(c=>c.nome.trim().toLowerCase())]);
  const clientes=[...allKeys].map(k=>{
    const fromData=clientMap[k]||{nome:"",processos:[],valorTotal:0,valorRecebido:0,areas:new Set(),status:{}};
    const extra=(clientesExtra||[]).find(c=>c.nome.trim().toLowerCase()===k)||{};
    return{...fromData,cpf:extra.cpf||"",email:extra.email||"",endereco:extra.endereco||"",cidade:extra.cidade||"",observacoes:extra.observacoes||"",idExtra:extra.id||null};
  }).filter(c=>!busca||c.nome.toLowerCase().includes(busca.toLowerCase()))
    .sort((a,b)=>a.nome.localeCompare(b.nome));

  const totalClientes=clientes.length;
  const totalCarteira=clientes.reduce((s,c)=>s+c.valorTotal,0);
  const totalRecebido=clientes.reduce((s,c)=>s+c.valorRecebido,0);

  function openNew(){setEditId(null);setFormCl(EMPTY_CLIENTE());setShowForm(true);}
  function openEdit(cl){
    setEditId(cl.idExtra||cl.nome);
    setFormCl({id:cl.idExtra||genId(),nome:cl.nome,cpf:cl.cpf||"",telefone:cl.telefone||"",email:cl.email||"",endereco:cl.endereco||"",cidade:cl.cidade||"",observacoes:cl.observacoes||""});
    setShowForm(true);
  }
  function saveForm(){
    if(!formCl.nome)return;
    if(editId){
      setClientesExtra(p=>p.some(c=>c.id===formCl.id)?p.map(c=>c.id===formCl.id?formCl:c):[...p,formCl]);
    } else {
      setClientesExtra(p=>[...p,{...formCl,id:genId()}]);
    }
    setShowForm(false);
  }
  async function delCliente(cl){
    if(!await askConfirm(`Excluir "${cl.nome}" do cadastro?\n\nNota: contratos e pagamentos com este nome não serão excluídos.`))return;
    setClientesExtra(p=>p.filter(c=>c.id!==cl.idExtra));
    setModalCliente(null);
  }

  // ── Funções de atualização WhatsApp ──────────────────
  function msgPadrao(cl){
    const procs=cl.processos||[];
    const p=procs[0];
    const hoje=new Date().toLocaleDateString("pt-BR");
    return `Prezado(a) ${cl.nome},\n\nPassando para informar sobre o andamento do seu processo${p&&p.numeroProcesso?" nº "+p.numeroProcesso:""}${p&&p.area?" ("+p.area+")":""}.\n\n[Descreva aqui o andamento mais recente...]\n\nQualquer dúvida estou à disposição.\n\nAtenciosamente,\nJuliana Savi – Advogada\n${hoje}`;
  }

  function abrirAtualizar(cl){
    setModalAtualizar(cl);
    setMsgAtualizar(msgPadrao(cl));
    setErroIA("");
  }

  async function gerarComIA(cl){
    if(!getAntKey()){setErroIA("Chave Anthropic não configurada.");return;}
    setGerandoIA(true);setErroIA("");
    const procs=cl.processos||[];
    const ctx=procs.map((p,i)=>`Processo ${i+1}: ${p.area||""} | Nº ${p.numeroProcesso||"não informado"} | Status: ${STATUS_CFG[p.status]?.label||p.status}`).join("\n");
    const prompt=`Você é assistente da advogada Juliana Savi. Escreva uma mensagem de WhatsApp profissional e cordial para o cliente "${cl.nome}" informando sobre o andamento dos processos. Seja breve, claro e tranquilizador. Inclua uma frase genérica de andamento positivo pois o advogado irá revisar antes de enviar. Finalize com os dados da advogada.

Dados do cliente:
${ctx||"Sem processos cadastrados"}

Escreva APENAS o texto da mensagem, sem explicações adicionais.`;
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":getAntKey(),"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:500,messages:[{role:"user",content:prompt}]})});
      const data=await res.json();
      setMsgAtualizar(data.content?.[0]?.text||"");
    }catch(e){setErroIA("Erro ao gerar: "+e.message);}
    finally{setGerandoIA(false);}
  }

  function enviarWhatsApp(cl,msg){
    if(!cl.telefone){notify("Este cliente não tem telefone cadastrado.");return;}
    const num=cl.telefone.replace(/\D/g,"");
    const numFull=num.length===11||num.length===10?"55"+num:num;
    const url=`https://wa.me/${numFull}?text=${encodeURIComponent(msg)}`;
    window.open(url,"_blank");
    marcarContato&&marcarContato(cl.nome);
  }

  // ── Fila de atualizações ──────────────────────────────
  function iniciarFila(lista){
    setFila(lista);setFilaIdx(0);setModoFila(true);
    setModalAtualizar(lista[0]);
    setMsgAtualizar(msgPadrao(lista[0]));
    setErroIA("");
  }
  function proximoFila(){
    const next=filaIdx+1;
    if(next>=fila.length){setModoFila(false);setModalAtualizar(null);setFila([]);notify("✅ Todos os clientes da fila foram enviados!");return;}
    setFilaIdx(next);setModalAtualizar(fila[next]);setMsgAtualizar(msgPadrao(fila[next]));setErroIA("");
  }

  return(
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16,flexWrap:"wrap"}}>
        <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:T.accent,fontWeight:700}}>Clientes</span>
        <div style={{flex:1}}/>
        <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar..." style={{background:T.inp,border:`1px solid ${T.border2}`,borderRadius:8,padding:"8px 14px",color:T.text,fontFamily:"'DM Mono',monospace",fontSize:12,width:180}}/>
        {clientes.filter(c=>c.telefone).length>0&&(
          <Btn T={T} variant="ghost" onClick={()=>iniciarFila(clientes.filter(c=>c.telefone))} style={{borderColor:"#25d366",color:"#25d366"}}>
            📋 Fila Semanal ({clientes.filter(c=>c.telefone).length})
          </Btn>
        )}
        {(()=>{const pend=clientes.filter(c=>c.telefone&&(!(contatos||{})[c.nome.trim().toLowerCase()]||Date.now()-new Date(contatos[c.nome.trim().toLowerCase()]).getTime()>15*864e5));
          return pend.length>0&&<Btn T={T} variant="ghost" onClick={()=>iniciarFila(pend)} style={{borderColor:"#dc2626",color:"#dc2626"}}>⏰ Atrasados ({pend.length})</Btn>;})()}
        <Btn T={T} onClick={openNew}>+ Novo Cliente</Btn>
      </div>

      {/* form cadastro/edição */}
      {showForm&&(
        <div style={{background:T.card,border:`1px solid ${T.border2}`,borderRadius:12,padding:18,marginBottom:16}}>
          <div style={{fontSize:13,color:T.accent,fontWeight:600,marginBottom:14}}>{editId?"✏ Editar Cliente":"+ Novo Cliente"}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
            <Fld T={T} label="Nome completo *" value={formCl.nome} onChange={v=>setFormCl(d=>({...d,nome:v}))}/>
            <Fld T={T} label="CPF" value={formCl.cpf} onChange={v=>setFormCl(d=>({...d,cpf:fmtCPF(v)}))} ph="000.000.000-00"/>
            <Fld T={T} label="Telefone / WhatsApp" value={formCl.telefone} onChange={v=>setFormCl(d=>({...d,telefone:v}))} ph="(00) 00000-0000"/>
            <Fld T={T} label="E-mail" value={formCl.email} onChange={v=>setFormCl(d=>({...d,email:v}))} ph="email@exemplo.com"/>
            <Fld T={T} label="Endereço" value={formCl.endereco} onChange={v=>setFormCl(d=>({...d,endereco:v}))} ph="Rua, número, bairro"/>
            <Fld T={T} label="Cidade / UF" value={formCl.cidade} onChange={v=>setFormCl(d=>({...d,cidade:v}))} ph="Cascavel / PR"/>
            <div style={{gridColumn:"1/-1"}}><Fld T={T} label="Observações" value={formCl.observacoes} onChange={v=>setFormCl(d=>({...d,observacoes:v}))} type="textarea"/></div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <Btn T={T} variant="secondary" onClick={()=>setShowForm(false)}>Cancelar</Btn>
            <Btn T={T} onClick={saveForm}>💾 Salvar</Btn>
          </div>
        </div>
      )}

      {/* stats */}
      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        {[["👥","Clientes",totalClientes,T.accent],["💼","Carteira",null,T.accent,fmt(totalCarteira)],["✅","Recebido",null,T.successText,fmt(totalRecebido)],["⏳","A Receber",null,T.warnText,fmt(totalCarteira-totalRecebido)]].map(([ic,lb,vn,cor,vs])=>(
          <div key={lb} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 16px",flex:"1 1 110px",textAlign:"center"}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,color:cor}}>{vs||vn}</div>
            <div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginTop:3}}>{ic} {lb}</div>
          </div>
        ))}
      </div>

      {/* tabela lista */}
      {clientes.length===0
        ?<div style={{textAlign:"center",color:T.muted,padding:"60px 0"}}><div style={{fontSize:36,marginBottom:12}}>👥</div>Nenhum cliente.</div>
        :<div style={{overflowX:"auto",borderRadius:10,border:`1px solid ${T.border}`}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr style={{background:T.card2}}>{["Cliente","CPF","Contato","Endereço","Área","Honorários","Recebido","Processos",""].map(h=><th key={h} style={{padding:"9px 13px",textAlign:"left",fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em",borderBottom:`1px solid ${T.border}`,fontWeight:500,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
            <tbody>
              {clientes.map((cl,i)=>{
                const pct=cl.valorTotal>0?Math.round(cl.valorRecebido/cl.valorTotal*100):0;
                const aList=[...cl.areas].filter(Boolean);
                return(
                  <tr key={cl.nome} className="row-hover" style={{background:i%2===0?T.card:T.stripe,borderBottom:`1px solid ${T.border}`}}>
                    <td style={{padding:"10px 13px"}}>
                      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,fontWeight:700,color:T.strong}}>{cl.nome}</div>
                      {(()=>{const u=(contatos||{})[cl.nome.trim().toLowerCase()];const d=u?Math.floor((Date.now()-new Date(u).getTime())/864e5):null;
                        return d===null?<div style={{fontSize:10,color:T.warnText,marginTop:1}}>⏰ sem atualização enviada</div>
                          :d>15?<div style={{fontSize:10,color:T.dangerText,marginTop:1}}>⏰ última atualização há {d} dias</div>
                          :<div style={{fontSize:10,color:T.muted,marginTop:1}}>✓ atualizado há {d} dia{d===1?"":"s"}</div>;})()}
                      {cl.email&&<div style={{fontSize:10,color:T.muted,marginTop:1}}>✉ {cl.email}</div>}
                    </td>
                    <td style={{padding:"10px 13px",color:T.muted,fontSize:11,fontFamily:"'DM Mono',monospace"}}>{cl.cpf||"—"}</td>
                    <td style={{padding:"10px 13px",fontSize:11}}>
                      {cl.telefone?<PhoneLink phone={cl.telefone}/>:<span style={{color:T.muted}}>—</span>}
                    </td>
                    <td style={{padding:"10px 13px",fontSize:11,color:T.muted,maxWidth:160}}>
                      {cl.endereco?<div title={cl.endereco+"\n"+cl.cidade}><div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{cl.endereco}</div>{cl.cidade&&<div style={{fontSize:10}}>{cl.cidade}</div>}</div>:"—"}
                    </td>
                    <td style={{padding:"10px 13px"}}>{aList.length>0?<ABadge area={aList[0]}/>:<span style={{color:T.muted,fontSize:11}}>—</span>}</td>
                    <td style={{padding:"10px 13px",color:T.accent,fontWeight:700}}>{fmt(cl.valorTotal)}</td>
                    <td style={{padding:"10px 13px"}}>
                      <div style={{fontSize:11,color:T.successText,fontWeight:600}}>{fmt(cl.valorRecebido)}</div>
                      <div style={{width:60,height:3,background:T.border,borderRadius:2,marginTop:3,overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",background:T.accent}}/></div>
                    </td>
                    <td style={{padding:"10px 13px",fontSize:11,color:T.muted,textAlign:"center"}}>{cl.processos.length}</td>
                    <td style={{padding:"10px 13px"}}>
                      <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                        <button className="bhov" onClick={()=>setModalCliente(cl)} style={{background:T.infoBg,border:"none",borderRadius:5,padding:"5px 9px",fontSize:13}} title="Ver detalhes">🔍</button>
                        <button className="bhov" onClick={()=>abrirAtualizar(cl)} style={{background:"#22c55e22",border:"1px solid #22c55e44",borderRadius:5,padding:"5px 9px",fontSize:13,color:"#16a34a",fontWeight:700}} title="Enviar atualização WhatsApp">📲</button>
                        <button className="bhov" onClick={()=>openEdit(cl)} style={{background:T.card2,border:`1px solid ${T.border2}`,borderRadius:5,padding:"5px 9px",fontSize:13}} title="Editar">✏</button>
                        <button className="bhov" onClick={()=>delCliente(cl)} style={{background:T.dangerBg,border:"none",borderRadius:5,padding:"5px 9px",fontSize:13}} title="Excluir">🗑</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>}

      {/* modal detalhe */}
      {modalCliente&&(
        <Modal T={T} title={modalCliente.nome} sub={`${modalCliente.processos.length} processo${modalCliente.processos.length!==1?"s":""} · ${[...modalCliente.areas].join(", ")}`} onClose={()=>setModalCliente(null)} width={680}>
          <div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              {[["CPF",modalCliente.cpf||"—"],["Telefone",modalCliente.telefone||"—"],["E-mail",modalCliente.email||"—"],["Endereço",modalCliente.endereco?modalCliente.endereco+(modalCliente.cidade?" — "+modalCliente.cidade:""):"—"]].map(([l,v])=>(
                <div key={l} style={{background:T.card2,borderRadius:8,padding:"10px 13px",border:`1px solid ${T.border}`}}>
                  <div style={{fontSize:10,color:T.muted,textTransform:"uppercase",marginBottom:3}}>{l}</div>
                  <div style={{color:T.strong,fontSize:13}}>{l==="Telefone"&&modalCliente.telefone?<PhoneLink phone={modalCliente.telefone}/>:v}</div>
                </div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
              {[["Honorários",fmt(modalCliente.valorTotal),T.accent],["Recebido",fmt(modalCliente.valorRecebido),T.successText],["A Receber",fmt(modalCliente.valorTotal-modalCliente.valorRecebido),T.warnText]].map(([l,v,cor])=>(
                <div key={l} style={{background:T.card2,borderRadius:8,padding:"10px 13px",border:`1px solid ${T.border}`,textAlign:"center"}}>
                  <div style={{fontSize:10,color:T.muted,textTransform:"uppercase",marginBottom:4}}>{l}</div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:700,color:cor}}>{v}</div>
                </div>
              ))}
            </div>
            {modalCliente.processos.length>0&&(
              <div>
                <div style={{fontSize:11,color:T.muted,textTransform:"uppercase",marginBottom:8}}>Processos</div>
                {modalCliente.processos.map((p,i)=>{const st=STATUS_CFG[p.status]||STATUS_CFG.pendente;return(
                  <div key={i} style={{background:T.card2,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 13px",marginBottom:6,display:"flex",alignItems:"center",gap:10}}>
                    <ABadge area={p.area}/><span style={{fontSize:11,color:st.color,fontWeight:600}}>{st.icon} {st.label}</span>
                    <span style={{flex:1,color:T.muted,fontSize:11}}>{p.numeroProcesso||"Sem nº"}</span>
                    <span style={{color:T.accent,fontWeight:700}}>{fmt(p.valorTotal)}</span>
                  </div>
                );})}
              </div>
            )}
            {modalCliente.observacoes&&<div style={{marginTop:12,background:T.card2,borderRadius:8,padding:"10px 13px",border:`1px solid ${T.border}`}}><div style={{fontSize:10,color:T.muted,textTransform:"uppercase",marginBottom:3}}>Observações</div><div style={{color:T.text,fontSize:12,whiteSpace:"pre-wrap"}}>{modalCliente.observacoes}</div></div>}
            <div style={{marginTop:16,paddingTop:14,borderTop:`1px solid ${T.border}`,display:"flex",justifyContent:"center"}}>
              <button onClick={()=>{setModalCliente(null);abrirAtualizar(modalCliente);}} style={{background:"#16a34a",color:"#fff",border:"none",borderRadius:9,padding:"10px 24px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'DM Mono',monospace",display:"flex",alignItems:"center",gap:8}}>
                📲 Enviar Atualização pelo WhatsApp
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── MODAL ATUALIZAÇÃO WHATSAPP ── */}
      {modalAtualizar&&(
        <div onClick={e=>e.target===e.currentTarget&&!modoFila&&setModalAtualizar(null)} style={{position:"fixed",inset:0,background:"#00000090",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20}}>
          <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,width:"100%",maxWidth:620,maxHeight:"92vh",display:"flex",flexDirection:"column",boxShadow:"0 30px 90px #0009"}}>

            {/* header */}
            <div style={{padding:"18px 24px 14px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:T.accent,fontWeight:700}}>
                  📲 Atualização — {modalAtualizar.nome}
                </div>
                {modoFila&&<div style={{fontSize:11,color:T.warnText,fontWeight:600,marginTop:3}}>Fila: {filaIdx+1} de {fila.length} clientes</div>}
              </div>
              {!modoFila&&<button onClick={()=>setModalAtualizar(null)} style={{background:"none",border:"none",color:T.muted,fontSize:20,cursor:"pointer"}}>✕</button>}
            </div>

            <div style={{overflowY:"auto",flex:1,padding:"18px 24px"}}>
              {/* info do cliente */}
              <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
                {modalAtualizar.telefone&&<div style={{background:T.successBg,border:`1px solid ${T.successText}44`,borderRadius:8,padding:"8px 12px",fontSize:12,color:T.successText}}>📞 {modalAtualizar.telefone}</div>}
                {[...(modalAtualizar.areas||[])].filter(Boolean).map(a=><ABadge key={a} area={a}/>)}
              </div>

              {/* processos resumo */}
              {(modalAtualizar.processos||[]).length>0&&(
                <div style={{background:T.card2,borderRadius:8,border:`1px solid ${T.border}`,padding:"10px 14px",marginBottom:14}}>
                  <div style={{fontSize:10,color:T.muted,textTransform:"uppercase",marginBottom:8}}>Processos do cliente</div>
                  {(modalAtualizar.processos||[]).map((p,i)=>{const st=STATUS_CFG[p.status]||STATUS_CFG.pendente;return(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,fontSize:12}}>
                      <span style={{color:st.color,fontWeight:600}}>{st.icon}</span>
                      <span style={{color:T.muted,fontFamily:"'DM Mono',monospace",fontSize:11}}>{p.numeroProcesso||"Sem nº"}</span>
                      <ABadge area={p.area}/>
                      <span style={{marginLeft:"auto",color:T.accent,fontWeight:600}}>{fmt(p.valorTotal)}</span>
                    </div>
                  );})}
                </div>
              )}

              {/* botão gerar IA */}
              <div style={{display:"flex",gap:8,marginBottom:10,alignItems:"center"}}>
                <button onClick={()=>gerarComIA(modalAtualizar)} disabled={gerandoIA}
                  style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",border:"none",borderRadius:8,padding:"8px 16px",fontSize:12,fontWeight:600,cursor:gerandoIA?"wait":"pointer",fontFamily:"'DM Mono',monospace",display:"flex",alignItems:"center",gap:7,opacity:gerandoIA?.6:1}}>
                  {gerandoIA?<><span className="spin" style={{display:"inline-block",width:12,height:12,border:"2px solid #ffffff44",borderTopColor:"#fff",borderRadius:"50%"}}/>Gerando...</>:<>🤖 Gerar com IA</>}
                </button>
                <button onClick={()=>setMsgAtualizar(msgPadrao(modalAtualizar))} style={{background:T.card2,border:`1px solid ${T.border2}`,borderRadius:8,padding:"8px 12px",fontSize:11,cursor:"pointer",color:T.muted,fontFamily:"'DM Mono',monospace"}}>
                  ↺ Modelo padrão
                </button>
                {erroIA&&<span style={{fontSize:11,color:T.dangerText}}>⚠ {erroIA}</span>}
              </div>

              {/* texto editável */}
              <div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Mensagem — revise antes de enviar</div>
              <textarea
                value={msgAtualizar}
                onChange={e=>setMsgAtualizar(e.target.value)}
                rows={10}
                style={{width:"100%",background:T.inp,border:`1px solid ${T.border2}`,borderRadius:8,padding:"12px 14px",color:T.text,fontFamily:"'DM Mono',monospace",fontSize:12,resize:"vertical",lineHeight:1.6}}
              />
              <div style={{fontSize:10,color:T.muted,marginTop:4,textAlign:"right"}}>{msgAtualizar.length} caracteres</div>
            </div>

            {/* footer ações */}
            <div style={{padding:"14px 24px",borderTop:`1px solid ${T.border}`,display:"flex",gap:10,alignItems:"center"}}>
              {!modoFila&&<button onClick={()=>setModalAtualizar(null)} style={{background:T.border,color:T.text,border:"none",borderRadius:7,padding:"8px 16px",fontSize:12,cursor:"pointer",fontFamily:"'DM Mono',monospace"}}>Cancelar</button>}
              <div style={{flex:1}}/>
              <button
                onClick={()=>{enviarWhatsApp(modalAtualizar,msgAtualizar);if(modoFila){setTimeout(()=>proximoFila(),600);}else{setModalAtualizar(null);}}}
                disabled={!msgAtualizar.trim()}
                style={{background:"#16a34a",color:"#fff",border:"none",borderRadius:9,padding:"10px 22px",fontSize:13,fontWeight:700,cursor:!msgAtualizar.trim()?"not-allowed":"pointer",fontFamily:"'DM Mono',monospace",display:"flex",alignItems:"center",gap:8,opacity:!msgAtualizar.trim()?.5:1}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                {modoFila?`Enviar e ir para ${filaIdx+1<fila.length?fila[filaIdx+1].nome:"Concluir"}`:"Abrir WhatsApp"}
              </button>
            </div>

            {/* barra de progresso da fila */}
            {modoFila&&(
              <div style={{height:4,background:T.border,borderRadius:"0 0 16px 16px",overflow:"hidden"}}>
                <div style={{width:`${((filaIdx+1)/fila.length)*100}%`,height:"100%",background:"#16a34a",transition:"width .4s"}}/>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TAB CONFIGURAÇÕES — backup e exportação
═══════════════════════════════════════════════════════ */
function TabConfig({T,contracts,costs,manual,clientesExtra,contatos,setContracts,setCosts,setManual,setClientesExtra,setContatos}){
  const [msg,setMsg]=useState("");
  const [chave,setChave]=useState(getAntKey());
  const [backups,setBackups]=useState(null);
  useEffect(()=>{listBackups().then(setBackups).catch(()=>setBackups([]));},[]);
  async function restaurar(b){
    if(!await askConfirm(`Restaurar o backup automático de ${b.id.slice(7)}?\nIsso substituirá TODOS os dados atuais.`))return;
    const d=b.data;
    setContracts(d.contracts||[]);setCosts(d.costs||[]);setManual(d.manual||[]);setClientesExtra(d.clientesExtra||[]);setContatos(d.contatos||{});
    setMsg("✅ Backup restaurado! Os dados serão sincronizados.");setTimeout(()=>setMsg(""),4000);
  }
  function baixar(b){
    const blob=new Blob([JSON.stringify(b.data,null,2)],{type:"application/json"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`lexcontrol-${b.id}.json`;a.click();
  }

  function exportBackup(){
    const data={contracts,costs,manual,clientesExtra,contatos,exportedAt:new Date().toISOString()};
    const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);
    a.download=`lexcontrol-backup-${new Date().toLocaleDateString("pt-BR").replace(/\//g,"-")}.json`;
    a.click();setMsg("✅ Backup exportado com sucesso!");setTimeout(()=>setMsg(""),3000);
  }

  function importBackup(e){
    const file=e.target.files?.[0];if(!file)return;
    const r=new FileReader();
    r.onload=async ev=>{
      try{
        const data=JSON.parse(ev.target.result);
        if(!await askConfirm(`Importar backup de ${data.exportedAt?.slice(0,10)||"data desconhecida"}?\nIsso substituirá TODOS os dados atuais.`))return;
        if(Array.isArray(data.contracts))setContracts(data.contracts);
        if(Array.isArray(data.costs))setCosts(data.costs);
        if(Array.isArray(data.manual))setManual(data.manual);
        if(Array.isArray(data.clientesExtra))setClientesExtra(data.clientesExtra);
        if(data.contatos&&typeof data.contatos==="object")setContatos(data.contatos);
        setMsg("✅ Backup importado! Os dados serão sincronizados.");setTimeout(()=>setMsg(""),4000);
      }catch(err){setMsg("❌ Arquivo inválido: "+err.message);}
    };
    r.readAsText(file);e.target.value="";
  }

  function exportClientesCSV(){
    const clientes={};
    contracts.forEach(c=>{if(!c.cliente)return;const k=c.cliente.trim();if(!clientes[k])clientes[k]={nome:c.cliente,telefone:c.telefone||"",area:c.areaAtuacao||"",processos:0,valorTotal:0};clientes[k].processos++;clientes[k].valorTotal+=fmtN(c.valorTotal);if(c.telefone&&!clientes[k].telefone)clientes[k].telefone=c.telefone;});
    manual.forEach(p=>{if(!p.cliente)return;const k=p.cliente.trim();if(!clientes[k])clientes[k]={nome:p.cliente,telefone:p.telefone||"",area:p.areaAtuacao||"",processos:0,valorTotal:0};clientes[k].valorTotal+=fmtN(p.valor);if(p.telefone&&!clientes[k].telefone)clientes[k].telefone=p.telefone;});
    const rows=[["Nome","Telefone","Área","Processos","Valor Total"],...Object.values(clientes).map(c=>[c.nome,c.telefone,c.area,c.processos,c.valorTotal.toFixed(2)])];
    const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);
    a.download=`clientes-${new Date().toLocaleDateString("pt-BR").replace(/\//g,"-")}.csv`;
    a.click();setMsg("✅ Lista de clientes exportada!");setTimeout(()=>setMsg(""),3000);
  }

  function exportPagamentosCSV(){
    const rows=[["Cliente","Advogado","Área","Processo","Descrição","Valor","Mês","Ano","Forma Pgto","Status","Data"]];
    const all=[
      ...contracts.flatMap(c=>(c.schedule||[]).map(s=>({cliente:c.cliente,advogado:c.advogado,area:c.areaAtuacao,processo:c.numeroProcesso,descricao:s.descricao,valor:s.valor,mes:s.mes,ano:s.ano,forma:c.formaPagamento,pago:s.pago,data:""}))),
      ...manual.map(p=>({cliente:p.cliente,advogado:p.advogado,area:p.areaAtuacao,processo:p.numeroProcesso,descricao:p.descricao,valor:p.valor,mes:p.mes,ano:p.ano,forma:p.formaPagamento,pago:p.pago,data:p.dataLancamento})),
    ];
    all.forEach(p=>rows.push([p.cliente,p.advogado,p.area,p.processo,p.descricao,fmtN(p.valor).toFixed(2),MFL[p.mes-1],p.ano,p.forma,p.pago?"Recebido":"Pendente",p.data]));
    const csv=rows.map(r=>r.map(v=>`"${String(v||"").replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);
    a.download=`pagamentos-${new Date().toLocaleDateString("pt-BR").replace(/\//g,"-")}.csv`;
    a.click();setMsg("✅ Pagamentos exportados!");setTimeout(()=>setMsg(""),3000);
  }

  const BtnCard=({icon,title,desc,onClick,variant="primary",upload=false})=>(
    <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"20px 22px",display:"flex",flexDirection:"column",gap:8}}>
      <div style={{fontSize:28}}>{icon}</div>
      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,color:T.strong,fontWeight:600}}>{title}</div>
      <div style={{fontSize:11,color:T.muted,flex:1}}>{desc}</div>
      {upload
        ?<label style={{background:T.accent,color:T.accentText,border:"none",borderRadius:7,padding:"8px 16px",cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:600,textAlign:"center",display:"block"}}>
          Escolher arquivo<input type="file" accept=".json" style={{display:"none"}} onChange={importBackup}/>
        </label>
        :<Btn T={T} variant={variant} onClick={onClick} style={{alignSelf:"flex-start"}}>{title}</Btn>}
    </div>
  );

  return(
    <div>
      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:T.accent,fontWeight:700,marginBottom:20}}>Configurações</div>
      {msg&&<div style={{background:msg.startsWith("❌")?T.dangerBg:T.successBg,border:`1px solid ${msg.startsWith("❌")?T.dangerText:T.successText}44`,color:msg.startsWith("❌")?T.dangerText:T.successText,borderRadius:8,padding:"10px 16px",marginBottom:16,fontSize:13}}>{msg}</div>}

      <div style={{fontSize:11,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12,borderBottom:`1px solid ${T.border}`,paddingBottom:6}}>Backup dos Dados</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:12,marginBottom:24}}>
        <BtnCard icon="💾" title="Exportar Backup" desc="Salva todos os dados (contratos, custos, pagamentos) em um arquivo JSON." onClick={exportBackup}/>
        <BtnCard icon="📂" title="Importar Backup" desc="Restaura dados de um arquivo JSON exportado anteriormente. Substitui tudo." upload={true}/>
      </div>

      <div style={{fontSize:11,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12,borderBottom:`1px solid ${T.border}`,paddingBottom:6}}>Backups automáticos (semanais, guardados na nuvem)</div>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"14px 18px",marginBottom:24}}>
        {backups===null?<div style={{color:T.muted,fontSize:12}}>Carregando...</div>
          :backups.length===0?<div style={{color:T.muted,fontSize:12}}>Nenhum backup ainda. O primeiro é criado automaticamente ao abrir o sistema com dados cadastrados.</div>
          :backups.map(b=>(
            <div key={b.id} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",borderBottom:`1px solid ${T.border}`,fontSize:12}}>
              <span style={{flex:1,color:T.strong}}>📅 {b.id.slice(7).split("-").reverse().join("/")}</span>
              <span style={{color:T.muted}}>{(b.data.contracts||[]).length} contratos · {(b.data.manual||[]).length} pagamentos</span>
              <Btn T={T} variant="ghost" onClick={()=>baixar(b)}>⬇ Baixar</Btn>
              <Btn T={T} variant="secondary" onClick={()=>restaurar(b)}>↩ Restaurar</Btn>
            </div>))}
        <div style={{fontSize:10,color:T.muted,marginTop:10}}>Mantém os 8 mais recentes. Para guardar no Google Drive, use “Exportar Backup” e salve o arquivo na pasta do Drive.</div>
      </div>

      <div style={{fontSize:11,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12,borderBottom:`1px solid ${T.border}`,paddingBottom:6}}>Chave da IA (Anthropic)</div>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"14px 18px",marginBottom:24,display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
        <input type="password" value={chave} onChange={e=>setChave(e.target.value)} placeholder="sk-ant-..." style={{flex:1,minWidth:220,background:T.inp,border:`1px solid ${T.border2}`,borderRadius:8,padding:"8px 12px",color:T.text,fontFamily:"'DM Mono',monospace",fontSize:12}}/>
        <Btn T={T} onClick={()=>{setAntKey(chave.trim());notify("✅ Chave salva neste aparelho.");}}>Salvar</Btn>
        <div style={{fontSize:10,color:T.muted,flexBasis:"100%"}}>Fica guardada só neste navegador/aparelho (não vai para o GitHub nem para o Firebase). Configure uma vez em cada dispositivo.</div>
      </div>

      <div style={{fontSize:11,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12,borderBottom:`1px solid ${T.border}`,paddingBottom:6}}>Exportar Relatórios (CSV)</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:12,marginBottom:24}}>
        <BtnCard icon="👥" title="Lista de Clientes" desc="Exporta nome, telefone, área, número de processos e valor total por cliente." onClick={exportClientesCSV} variant="ghost"/>
        <BtnCard icon="💰" title="Pagamentos" desc="Exporta todos os pagamentos (cronogramas + manuais) com status e valores." onClick={exportPagamentosCSV} variant="ghost"/>
      </div>

      <div style={{fontSize:11,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12,borderBottom:`1px solid ${T.border}`,paddingBottom:6}}>Resumo dos Dados</div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        {[["📄","Contratos",contracts.length],["🏢","Custos",costs.length],["💰","Pagamentos Manuais",manual.length]].map(([ic,lb,vl])=>(
          <div key={lb} style={{background:T.card2,border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 18px",textAlign:"center",flex:"1 1 120px"}}>
            <div style={{fontSize:24}}>{ic}</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,color:T.accent}}>{vl}</div>
            <div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginTop:2}}>{lb}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TAB LINKS ÚTEIS — portais e consultas jurídicas
═══════════════════════════════════════════════════════ */
const LINKS_DATA=[
  {cat:"Tribunais e Processos",items:[
    {label:"CNJ — Consulta Processual",url:"https://www.cnj.jus.br/",desc:"Consulta unificada de processos"},
    {label:"TJ-PR — e-Proc",url:"https://projudi.tjpr.jus.br/projudi/",desc:"Processo Judicial Digital do Paraná"},
    {label:"TRT-PR (9ª Região)",url:"https://www.trt9.jus.br/",desc:"Tribunal Regional do Trabalho do Paraná"},
    {label:"TRF-4 (4ª Região)",url:"https://www.trf4.jus.br/",desc:"Tribunal Regional Federal — Sul do Brasil"},
    {label:"STJ — Consulta",url:"https://www.stj.jus.br/sites/portalp/Inicio",desc:"Superior Tribunal de Justiça"},
    {label:"STF — Portal",url:"https://portal.stf.jus.br/",desc:"Supremo Tribunal Federal"},
  ]},
  {cat:"Previdência e INSS",items:[
    {label:"INSS — Meu INSS",url:"https://meu.inss.gov.br/",desc:"Portal de serviços do INSS"},
    {label:"CNIS — Consulta",url:"https://meu.inss.gov.br/",desc:"Cadastro Nacional de Informações Sociais"},
    {label:"Calculadora INSS / TNU",url:"https://www.jf.jus.br/jf/calculadoras",desc:"Calculadoras previdenciárias da JF"},
  ]},
  {cat:"Legislação e Jurisprudência",items:[
    {label:"LegisWeb / Planalto",url:"https://www.planalto.gov.br/legislacao",desc:"Legislação federal compilada"},
    {label:"JusBrasil",url:"https://www.jusbrasil.com.br/",desc:"Processos, jurisprudência e legislação"},
    {label:"IBGE — Tabela SELIC/INPC",url:"https://www.ibge.gov.br/",desc:"Índices para correção monetária"},
    {label:"Banco Central — Calculadora",url:"https://www.bcb.gov.br/conversao",desc:"Correção monetária e câmbio"},
  ]},
  {cat:"OAB e Cadastros",items:[
    {label:"OAB Nacional",url:"https://www.oab.org.br/",desc:"Portal da OAB federal"},
    {label:"OAB-PR",url:"https://www.oabpr.org.br/",desc:"Ordem dos Advogados do Brasil — Paraná"},
    {label:"Receita Federal — CPF/CNPJ",url:"https://www.receita.fazenda.gov.br/",desc:"Consulta de CPF e CNPJ"},
  ]},
];

function TabLinks({T}){
  return(
    <div>
      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:T.accent,fontWeight:700,marginBottom:20}}>Links Úteis</div>
      {LINKS_DATA.map(grupo=>(
        <div key={grupo.cat} style={{marginBottom:24}}>
          <div style={{fontSize:11,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10,borderBottom:`1px solid ${T.border}`,paddingBottom:6}}>{grupo.cat}</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:8}}>
            {grupo.items.map(link=>(
              <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer"
                style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 16px",textDecoration:"none",display:"flex",flexDirection:"column",gap:4,transition:"border .15s"}}>
                <div style={{fontSize:13,color:T.accent,fontWeight:600}}>{link.label} ↗</div>
                <div style={{fontSize:11,color:T.muted}}>{link.desc}</div>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Relógio ao vivo ── */
const DIAS_SEMANA = ["Domingo","Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado"];
function Clock({T}){
  const [now,setNow] = useState(new Date());
  useEffect(()=>{
    const id = setInterval(()=>setNow(new Date()),1000);
    return ()=>clearInterval(id);
  },[]);
  const dd   = String(now.getDate()).padStart(2,"0");
  const mm   = String(now.getMonth()+1).padStart(2,"0");
  const aaaa = now.getFullYear();
  const hh   = String(now.getHours()).padStart(2,"0");
  const min  = String(now.getMinutes()).padStart(2,"0");
  const ss   = String(now.getSeconds()).padStart(2,"0");
  return(
    <div style={{lineHeight:1.3}}>
      <div style={{fontSize:10,color:T.muted}}>{dd}/{mm}/{aaaa}</div>
      <div style={{fontSize:9,color:T.muted}}>{DIAS_SEMANA[now.getDay()]}</div>
      <div style={{fontSize:11,color:T.accent,fontWeight:600,fontFamily:"'DM Mono',monospace"}}>{hh}:{min}:{ss}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   APP — persistência seguindo o padrão dieta-app
   Prompt: fbLoaded guard · debounce 1.5s · onSnapshot
═══════════════════════════════════════════════════════ */
function App(){
  /* ── 1. Estados da UI ─────────────────────────────── */
  const [themeId,setThemeId]     = useState("industrial");
  const [tab,setTab]             = useState("relatorio");
  const [contracts,setContracts] = useState([]);
  const [costs,setCosts]         = useState([]);
  const [manual,setManual]       = useState([]);
  const [clientesExtra,setClientesExtra] = useState([]);
  const [contatos,setContatos] = useState({});   // {nomeminusculo: ISO da última atualização enviada}
  const marcarContato=nome=>setContatos(p=>({...p,[nome.trim().toLowerCase()]:new Date().toISOString()}));

  /* ── 2. Estados de sync (exatamente como no prompt) ── */
  const [fbLoaded, setFbLoaded] = useState(false);
  const [fbSaving, setFbSaving] = useState(false);
  const [fbError,  setFbError]  = useState(null);
  const [syncedAt, setSyncedAt] = useState(null);   // hora exata da última sync
  const saveTimeout    = useRef(null);
  const loadingFromFb  = useRef(false);  // true enquanto onSnapshot processa dados

  const T = THEMES[themeId];

  /* ── 3. CARREGAR — abre canal em tempo real (prompt §4) */
  useEffect(()=>{
    const docRef = db.collection("workspaces").doc(WS).collection("data").doc("main");
    const unsub = docRef.onSnapshot(
      snap => {
        loadingFromFb.current = true;     // sinaliza: esta mudança veio do Firebase
        if(snap.exists){                  // compat SDK: propriedade booleana, NÃO método
          const d = snap.data();
          if(Array.isArray(d.contracts))  setContracts(d.contracts);
          if(Array.isArray(d.costs))      setCosts(d.costs);
          if(Array.isArray(d.manual))     setManual(d.manual);
          if(Array.isArray(d.clientesExtra)) setClientesExtra(d.clientesExtra);
          if(d.contatos&&typeof d.contatos==="object") setContatos(d.contatos);
          if(d.theme)                     setThemeId(d.theme);
        }
        setFbLoaded(true);
      },
      err => {
        setFbError(err.message);
        setFbLoaded(true);
      }
    );
    return ()=>unsub();
  },[]);

  /* ── 4. SALVAR — debounce 1.5s (prompt §5) ───────────
     Guard 1: if(!fbLoaded) → nunca salva antes de carregar.
     Guard 2: loadingFromFb → dado veio do Firebase, pula
              este save para não criar loop infinito.
  ── */
  useEffect(()=>{
    if(!fbLoaded) return;

    // Dado veio do Firebase (onSnapshot)? Pula e reseta.
    if(loadingFromFb.current){
      loadingFromFb.current = false;
      return;
    }

    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async ()=>{
      setFbSaving(true);
      try{
        await db.collection("workspaces").doc(WS)
                       .collection("data").doc("main")
                       .set({
                         contracts,
                         costs,
                         manual,
                         clientesExtra,
                         contatos,
                         theme: themeId,
                         updatedAt: new Date().toISOString(),
                       });
        setFbSaving(false);
        setFbError(null);
        setSyncedAt(new Date());
      }catch(e){
        setFbSaving(false);
        setFbError(e.message || "Erro ao salvar");
      }
    }, 1500);
  },[contracts, costs, manual, clientesExtra, contatos, themeId, fbLoaded]);
  //                                    ^^^^^^^^^
  //  fbLoaded no array faz o primeiro save rodar logo
  //  após o carregamento — necessário para persistir
  //  edições feitas antes de fbLoaded virar true.

  /* ── Backup automático semanal (uma vez por abertura, após carregar) ── */
  const backupFeito=useRef(false);
  useEffect(()=>{
    if(!fbLoaded||backupFeito.current)return;
    backupFeito.current=true;
    if(contracts.length+manual.length+costs.length+clientesExtra.length===0)return;
    runAutoBackup(backupPayload({contracts,costs,manual,clientesExtra,contatos})).catch(()=>{});
  },[fbLoaded]);

  /* ── 5. Indicador visual (prompt §6) ──────────────── */
  const cloudMsg = !fbLoaded ? "☁️ conectando..."
                 : fbError   ? "⚠️ offline"
                 : fbSaving  ? "☁️ salvando..."
                 : syncedAt  ? `☁️ Sincronizado às ${syncedAt.toLocaleTimeString("pt-BR")}`
                 :             "☁️ sincronizado";
  const cloudColor = fbError   ? "#f87171"
                   : fbSaving  ? "#fbbf24"
                   : fbLoaded  ? "#22c55e"
                   :             "#fbbf24";

  /* ── Sync bar background — verde mais escuro para melhor contraste ── */
  const syncBg = fbError  ? "#270d0d"
               : fbSaving ? T.sWaitBg
               : fbLoaded ? "#14532d"   // verde escuro fixo — contraste garantido
               :             T.sWaitBg;
  const syncBorder = fbError  ? "#ef444444"
                   : fbSaving ? T.sWaitDot+"44"
                   : fbLoaded ? "#16a34a66"
                   :             T.sWaitDot+"44";
  const syncPulse = !fbLoaded || fbSaving;

  const TABS_MAIN=[
    {id:"contratos",label:"📄 Contratos"},
    {id:"pagamentos",label:"💰 Pagamentos"},
    {id:"custos",label:"🏢 Custos"},
    {id:"clientes",label:"👥 Clientes"},
    {id:"relatorio",label:"📊 Relatório"},
  ];
  const TABS_SEC=[
    {id:"configuracoes",label:"⚙️ Config."},
    {id:"links",label:"🔗 Links Úteis"},
  ];

  return(
    <div style={{background:T.bg,minHeight:"100vh",color:T.text,fontFamily:"'DM Mono',monospace",fontSize:13}}>
      <style>{`.row-hover:hover{background:${T.hover}!important;}
      .tab-nav:hover:not([style*="${T.tabActive}"]){background:${T.border}!important;color:${T.strong}!important;}
      .nav-arrow{transition:background .15s,color .15s,transform .1s;}
      .nav-arrow:hover{background:${T.accent}!important;color:${T.accentText}!important;transform:scale(1.15);}`}</style>

      {/* ── BARRA SYNC ── */}
      <div style={{background:syncBg,borderBottom:`1px solid ${syncBorder}`,padding:"5px 20px",display:"flex",alignItems:"center",gap:8,minHeight:28,position:"sticky",top:0,zIndex:101}}>
        <span className={`sync-dot${syncPulse?" pulsing":""}`} style={{background:cloudColor}}/>
        <span style={{fontSize:11,color:cloudColor,fontWeight:500,flex:1}}>{cloudMsg}</span>
        <button onClick={()=>auth.signOut()} style={{background:"none",border:"1px solid #ffffff44",borderRadius:5,padding:"2px 10px",fontSize:10,color:"#e5e5e5",cursor:"pointer",fontFamily:"'DM Mono',monospace"}}>Sair ⎋</button>
        {fbError&&<button onClick={()=>setFbError(null)} style={{background:"none",border:`1px solid #ef444466`,borderRadius:5,padding:"2px 8px",fontSize:10,color:"#f87171",cursor:"pointer"}}>✕</button>}
      </div>

      {/* ── HEADER ── */}
      <div style={{background:T.hdr,borderBottom:`1px solid ${T.border}`,position:"sticky",top:28,zIndex:99}}>
        {/* Row 1: logo + nome + clock + temas */}
        <div style={{padding:"10px 22px",display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
            <img src={LOGO_SRC} alt="Juliana Savi Advogada" style={{height:64,objectFit:"contain",filter:T.id==="dark"?"brightness(0.9)":"none"}}/>
            <div style={{paddingTop:4}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:700,color:T.accent,lineHeight:1}}>LexControl</div>
              <Clock T={T}/>
            </div>
          </div>
          <div style={{flex:1}}/>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {Object.values(THEMES).map(th=><button key={th.id} onClick={()=>setThemeId(th.id)} className="bhov"
              style={{background:themeId===th.id?T.accent:T.card2,color:themeId===th.id?T.accentText:T.muted,border:`1px solid ${T.border}`,borderRadius:7,padding:"5px 10px",fontSize:11,fontFamily:"'DM Mono',monospace",whiteSpace:"nowrap"}}>
              {th.label}
            </button>)}
          </div>
        </div>
        {/* Row 2: tabs centralizadas com divisor */}
        <div style={{borderTop:`1px solid ${T.border}`,padding:"6px 22px",display:"flex",justifyContent:"center",gap:8,flexWrap:"wrap"}}>
          {/* tabs principais */}
          <div style={{display:"flex",gap:3,background:T.card2,borderRadius:10,padding:3,border:`1px solid ${T.border}`}}>
            {TABS_MAIN.map(t=><button key={t.id} onClick={()=>setTab(t.id)} className="bhov tab-nav"
              style={{background:tab===t.id?T.tabActive:"transparent",color:tab===t.id?T.tabActiveText:T.muted,border:"none",borderRadius:7,padding:"8px 14px",cursor:"pointer",fontSize:12,fontFamily:"'DM Mono',monospace",fontWeight:tab===t.id?600:400,transition:"all .18s",whiteSpace:"nowrap"}}>
              {t.label}
            </button>)}
          </div>
          {/* divisor visual */}
          <div style={{display:"flex",alignItems:"center",color:T.border2,fontSize:18,userSelect:"none"}}>│</div>
          {/* tabs secundárias — usadas com menos frequência */}
          <div style={{display:"flex",gap:3,background:T.card2,borderRadius:10,padding:3,border:`1px solid ${T.border}`,opacity:.85}}>
            {TABS_SEC.map(t=><button key={t.id} onClick={()=>setTab(t.id)} className="bhov tab-nav"
              style={{background:tab===t.id?T.tabActive:"transparent",color:tab===t.id?T.tabActiveText:T.muted,border:"none",borderRadius:7,padding:"8px 12px",cursor:"pointer",fontSize:11,fontFamily:"'DM Mono',monospace",fontWeight:tab===t.id?600:400,transition:"all .18s",whiteSpace:"nowrap"}}>
              {t.label}
            </button>)}
          </div>
        </div>
      </div>

      {/* ── CONTEÚDO ── */}
      <div style={{padding:"20px 22px",maxWidth:1200,margin:"0 auto"}}>
        {!fbLoaded
          ?<div style={{textAlign:"center",padding:"80px 0",color:T.muted,display:"flex",flexDirection:"column",alignItems:"center",gap:14}}>
            <div className="spin" style={{width:32,height:32,border:`3px solid ${T.border2}`,borderTopColor:T.accent,borderRadius:"50%"}}/>
            ☁️ conectando...
          </div>
          :tab==="contratos"    ?<TabContratos T={T} contracts={contracts} setContracts={setContracts}/>
          :tab==="pagamentos"   ?<TabPagamentos T={T} contracts={contracts} setContracts={setContracts} manual={manual} setManual={setManual}/>
          :tab==="custos"       ?<CostsTab T={T} contracts={contracts} manual={manual} costs={costs} setCosts={setCosts}/>
          :tab==="clientes"     ?<TabClientes T={T} contracts={contracts} manual={manual} setTab={setTab} clientesExtra={clientesExtra} setClientesExtra={setClientesExtra} contatos={contatos} marcarContato={marcarContato}/>
          :tab==="relatorio"    ?<TabRelatorio T={T} contracts={contracts} manual={manual} costs={costs}/>
          :tab==="configuracoes"?<TabConfig T={T} contracts={contracts} costs={costs} manual={manual} clientesExtra={clientesExtra} contatos={contatos} setContracts={setContracts} setCosts={setCosts} setManual={setManual} setClientesExtra={setClientesExtra} setContatos={setContatos}/>
          :<TabLinks T={T}/>
        }
      </div>
      <DialogHost T={T}/>
    </div>
  );
}

/* ── LOGIN ── */
function Login(){
  const T=THEMES.industrial;
  const [user,setUser]=useState("");
  const [senha,setSenha]=useState("");
  const [erro,setErro]=useState("");
  const [loading,setLoading]=useState(false);
  async function entrar(e){
    e.preventDefault();
    const email=USUARIOS[user.trim().toUpperCase()];
    if(!email){setErro("Usuário ou senha inválidos.");return;}
    setLoading(true);setErro("");
    try{await auth.signInWithEmailAndPassword(email,senha);}
    catch(err){
      const c=err.code||"";
      setErro((c==="auth/too-many-requests"?"Muitas tentativas. Aguarde alguns minutos."
        :c==="auth/operation-not-allowed"?"Login por e-mail/senha não está ativado no Firebase."
        :c==="auth/user-not-found"?"Conta não encontrada no Firebase (confira o e-mail cadastrado: "+email+")."
        :c==="auth/network-request-failed"?"Sem conexão com o Firebase."
        :"Usuário ou senha inválidos.")+" ["+(c||err.message)+"]");
      setLoading(false);
    }
  }
  const inp={width:"100%",background:T.inp,border:`1px solid ${T.border2}`,borderRadius:8,padding:"11px 14px",color:T.text,fontFamily:"'DM Mono',monospace",fontSize:14,marginBottom:12};
  return(
    <div style={{background:T.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:16,fontFamily:"'DM Mono',monospace"}}>
      <form onSubmit={entrar} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,padding:"30px 28px",width:"100%",maxWidth:360,boxShadow:"0 20px 60px #0004"}}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <img src={LOGO_SRC} alt="Juliana Savi Advogada" style={{height:80,objectFit:"contain"}}/>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontWeight:700,color:T.accent,marginTop:6}}>LexControl</div>
          <div style={{fontSize:11,color:T.muted}}>Acesso restrito</div>
        </div>
        <input value={user} onChange={e=>setUser(e.target.value)} placeholder="Usuário" autoCapitalize="characters" autoComplete="username" style={inp}/>
        <input type="password" value={senha} onChange={e=>setSenha(e.target.value)} placeholder="Senha" autoComplete="current-password" style={inp}/>
        {erro&&<div style={{background:T.dangerBg,color:T.dangerText,border:`1px solid ${T.dangerBorder}`,borderRadius:8,padding:"8px 12px",fontSize:12,marginBottom:12}}>{erro}</div>}
        <button type="submit" disabled={loading||!user||!senha} style={{width:"100%",background:T.accent,color:T.accentText,border:"none",borderRadius:8,padding:"12px",fontSize:14,fontWeight:700,fontFamily:"'DM Mono',monospace",cursor:"pointer",opacity:loading||!user||!senha?.6:1}}>{loading?"Entrando...":"Entrar"}</button>
      </form>
    </div>
  );
}

/* ── RAIZ: só monta o app (e abre o Firestore) depois do login ── */
function Root(){
  const [u,setU]=useState(undefined); // undefined = verificando
  useEffect(()=>auth.onAuthStateChanged(x=>setU(x||null)),[]);
  if(u===undefined)return <div style={{background:THEMES.industrial.bg,minHeight:"100vh"}}/>;
  return u?<App key={u.uid}/>:<Login/>;
}

export default Root;
