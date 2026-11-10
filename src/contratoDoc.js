/* Contrato de honorários em Word (.docx) — baseado no modelo real do escritório.
   Varia por área apenas o objeto (Cláusula Primeira); demais cláusulas são padrão.
   Carregado sob demanda (import dinâmico). */
const BL = "__________________";
const RES = "Resolução do Conselho Seccional Nº 13/2026, publicada em 17/04/2026";

const OBJ = {
  "Cível": "objetivando a propositura de ação de indenização por danos materiais e morais, ou a que couber, em face de",
  "Penal / Criminal": "objetivando a defesa técnica do(a) CONTRATANTE em inquérito policial e/ou ação penal, a que couber, em que figura como investigado(a)/acusado(a), perante",
  "Trabalhista": "objetivando a propositura de reclamação trabalhista, ou a que couber, perante a Justiça do Trabalho, em face de",
  "Previdenciária": "objetivando o requerimento administrativo e/ou a propositura de ação judicial para concessão, restabelecimento ou revisão de benefício previdenciário, ou a que couber, em face do INSS e/ou de",
};
const ALVO_PADRAO = BL;
const ORD = ["PRIMEIRA","SEGUNDA","TERCEIRA","QUARTA","QUINTA","SEXTA","SÉTIMA","OITAVA","NONA","DÉCIMA","DÉCIMA PRIMEIRA","DÉCIMA SEGUNDA","DÉCIMA TERCEIRA","DÉCIMA QUARTA","DÉCIMA QUINTA"];
const MESES = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
const num = v => { const s = String(v ?? "").trim(); if (!s) return 0; const n = s.includes(",") ? Number(s.replace(/\./g, "").replace(",", ".")) : Number(s); return n || 0; };
const brl = v => num(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export async function gerarContratoDocx(c) {
  const { Document, Packer, Paragraph, TextRun, AlignmentType } = await import("docx");
  const F = "Times New Roman", S = 24;
  const T = (t, o = {}) => new TextRun({ text: t, font: F, size: S, ...o });
  const B = t => T(t, { bold: true });
  const P = (parts, o = {}) => new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 140, line: 288 }, ...o, children: parts.map(x => typeof x === "string" ? T(x) : x) });
  const CL = (i, parts) => P([B(`CLÁUSULA ${ORD[i]}: `), ...parts]);
  const PAR = (rot, parts) => P([B(`${rot} – `), ...parts]);

  const juliana = /juliana/i.test(c.advogado || "Juliana");
  const contratado = juliana
    ? [B("CONTRATADA: JULIANA GOMES SAVI"), ", brasileira, casada, inscrita na OAB/PR nº 63.734, com endereço na Rua Sete de Setembro, nº 3034, Sala 132, Ed. Emília Saraiva, Cascavel-PR, CEP 85810-090, telefone (45) 99114-1317, e-mail: adv.julianasavi@gmail.com"]
    : [B(`CONTRATADO(A): ${(c.advogado || BL).toUpperCase()}`), `, advogado(a) inscrito(a) na OAB/PR nº ${BL}, com endereço profissional em Cascavel-PR`];
  const nomeContratado = juliana ? "JULIANA GOMES SAVI" : (c.advogado || BL).toUpperCase();
  const cliente = (c.cliente || BL).toUpperCase();
  const area = OBJ[c.areaAtuacao] ? c.areaAtuacao : null;
  const objeto = OBJ[area] || "objetivando a defesa dos interesses do(a) CONTRATANTE na demanda a que couber, em face de";

  // Honorários: valor fixo (se informado no cadastro) ou percentual
  const np = Number(c.totalParcelas) || 1;
  let honorarios;
  if (num(c.valorTotal) > 0) {
    const forma = c.formaPagamento ? `, via ${c.formaPagamento}` : "";
    honorarios = np > 1
      ? `o valor total de ${brl(c.valorTotal)}, em ${np} parcelas${c.valorParcela ? ` de ${brl(c.valorParcela)}` : ""}${forma}${c.prazos ? `, ${c.prazos}` : ""}`
      : `o valor total de ${brl(c.valorTotal)}, à vista${forma}${c.prazos ? `, ${c.prazos}` : ""}`;
  } else {
    honorarios = `${BL}% (${BL}) do valor total bruto apurado em liquidação judicial ou extrajudicial a que se refere a ação`;
  }

  const hoje = new Date();
  const dataExt = `Cascavel/PR, ${String(hoje.getDate()).padStart(2, "0")} de ${MESES[hoje.getMonth()]} de ${hoje.getFullYear()}.`;
  const proc = c.numeroProcesso ? ` (processo nº ${c.numeroProcesso})` : "";

  const filhos = [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 }, children: [B("CONTRATO DE PRESTAÇÃO DE SERVIÇOS JURÍDICOS")] }),
    P(["Pelo presente instrumento particular de ", B("CONTRATO DE PRESTAÇÃO DE SERVIÇOS JURÍDICOS E HONORÁRIOS ADVOCATÍCIOS"), ", de um lado ", B(`CONTRATANTE: ${cliente}`),
      `, brasileiro(a), ${BL}, ${BL}, portador(a) do RG nº ${BL}, inscrito(a) no CPF sob o nº ${BL}, residente e domiciliado(a) na ${BL}, nº ${BL}, Bairro ${BL}, CEP ${BL}, na Cidade de Cascavel - Estado do Paraná, telefone para contato ${c.telefone || BL} e de outro lado: `,
      ...contratado, ", têm entre si justo e acertado o seguinte:"], { alignment: AlignmentType.LEFT }),
    CL(0, ["A CONTRATADA, podendo inclusive substabelecer, prestará serviços profissionais de advocacia ao (à) CONTRATANTE, ", `${objeto} ${ALVO_PADRAO}${proc}.`]),
    PAR("PARÁGRAFO ÚNICO", [`O presente contrato NÃO contempla a interposição de recursos, os quais, em caso de necessidade, terão o valor do disposto na ${RES}, ou a que a substituir na data da interposição do recurso (atualmente acessível em: https://honorarios.oabpr.org.br/tabela-de-honorarios)`]),
    CL(1, [`A título de Honorários Advocatícios, o (a) CONTRATANTE pagará em favor da CONTRATADA, independente de eventual sucumbência ou condenação em custas judiciais, ${honorarios}.`]),
    PAR("PARÁGRAFO PRIMEIRO", ["O atraso no pagamento de honorários sujeitará o (a) CONTRATANTE à multa de 10% (dez por cento) sobre o valor total do presente contrato, mais a incidência de juros moratórios e juros compensatórios, considerados, ambos, individualmente, a razão de 1% (um por cento) ao mês."]),
    PAR("PARÁGRAFO SEGUNDO", ["O critério de correção monetária, incidente sobre os valores deste contrato, será o resultante do IGP-M/FGV."]),
    PAR("PARÁGRAFO TERCEIRO", [`Incumbe ao (à) CONTRATANTE o pagamento das custas processuais, fotocópias, autenticações cartorárias, ligações telefônicas, locomoção, hospedagem, alimentação, diárias e demais despesas que se fizerem necessárias à instrução e bom andamento da ação, segundo os valores constantes da ${RES}, ou a que a substituir, podendo ser solicitadas na forma de adiantamento, com prestação de contas a posteriori.`]),
    PAR("PARÁGRAFO QUARTO", ["O (a) CONTRATANTE desde já aceita que seja emitido boleto bancário para pagamento do valor caso não seja possível o pagamento via PIX."]),
    CL(2, ["Declara o (a) CONTRATANTE ter ciência de que o juiz pode determinar a realização de exames periciais, exames de corpo de delito, estudo social, atendimento com psicólogos, acompanhamento com equipe técnica multidisciplinar, apresentação periódica em juízo e outras medidas que exijam participação pessoal do (da) CONTRATANTE."]),
    CL(3, ["Incumbe ao (à) CONTRATANTE o fornecimento de documentos e informações necessários à instrução da defesa de seus direitos, que sejam de seu particular acesso, nos prazos e formas solicitados pela CONTRATADA, bem como o fornecimento de eventual novo endereço ou telefone."]),
    CL(4, ["As partes concordam que a comunicação de audiências e quaisquer atos processuais deve ser realizado por telefone, conforme informado na qualificação do contrato."]),
    CL(5, ["Caso o (a) CONTRATANTE receba qualquer notificação, intimação ou correspondência de qualquer natureza, envolvendo o objeto do presente contrato, deverá entregar ao CONTRATADOS no prazo de 24 (vinte e quatro) horas, sob pena de vencimento antecipado do presente contrato."]),
    CL(6, ["Em caso de processo judicial ou extrajudicial, objeto deste contrato ou não, que tenham igualdade de partes, que envolva o recebimento de qualquer valor, autoriza o (a) CONTRATANTE que primeiro seja abatido valores vencidos de horários advocatícios e/ou de despesas."]),
    CL(7, ["Em caso de processo judicial que envolva o recebimento de qualquer valor pecuniário, autoriza o (a) CONTRATANTE que o mesmo seja depositado em conta bancária em nome da CONTRATADA ou recebido pessoalmente por qualquer um deles."]),
    CL(8, [`O (a) CONTRATANTE desde já concorda com o pagamento de eventuais despesas de deslocamento/viagem, a ser pago nos valores constantes na ${RES}, ou a que a substituir, podendo o valor ser abatido posteriormente quando do recebimento de vantagem econômica, ou exigida a posteriori.`]),
    CL(9, ["Considera-se vencido e imediatamente exigível o valor total dos honorários da CONTRATADA nas seguintes hipóteses:"]),
    ...[
      "I. Caso o pagamento não seja realizado no prazo e na quantia estipulada;",
      "II. Se houver composição amigável, realizada por qualquer das partes litigantes ou no caso de não prosseguir a ação;",
      "III. Por qualquer circunstância não determinada pela CONTRATADA;",
      "IV. Por revogação injustificada do mandado de procuração ou requerimento verbal ou por escrito do (a) CONTRATANTE em fornecimento de substabelecimento com ou sem reserva de poderes a outro advogado;",
      "V. Em ocorrendo o óbito do (da) CONTRATANTE;",
      "VI. Caso o processo tenha sentença judicial (1º grau) em data anterior ao vencimento de alguma parcela;",
      "VII. Caso o (a) CONTRATANTE não entregue à CONTRATADA documento essencial ao processo ou qualquer comunicação/intimação/notificação referente ao objeto do presente contrato, no prazo determinado.",
    ].map(t => P([t], { indent: { left: 567 } })),
    PAR("PARÁGRAFO ÚNICO", [`Ocorrendo o vencimento antecipado do presente contrato, o (a) CONTRATANTE pagará de honorários advocatícios o valor pelos atos avulsos praticados, conforme ${RES}, ou a que a substituir, aplicando-se a resolução vigente na data do pagamento.`]),
    CL(10, [`Em caso de vencimento antecipado, se for difícil ou impossível o pagamento em moeda corrente, o (a) CONTRATANTE anui, desde já, que quitará o valor devido através de bens ou serviços, caso concorde oportunamente a CONTRATADA, conforme ${RES}, ou a que a substituir.`]),
    CL(11, ["A utilização de mensagens por celular, WhatsApp ou qualquer outro meio de mídia social e ligações telefônicas fora do horário de expediente e finais de semana ou feriado será desconsiderada e em caso de insistência será cobrado valor de hora consulta nos termos da tabela da OAB-PR."]),
    CL(12, ["A eventual tolerância à infringência de qualquer das cláusulas deste instrumento ou o não exercício de qualquer direito nele previsto constituirá mera liberalidade da CONTRATADA, não implicando em novação ou transação de qualquer espécie."]),
    CL(13, ["Em razão do disposto no artigo 22, § 4º, da Lei nº 8.906/94 (Estatuto da OAB), fica a CONTRATADA, expressamente autorizados a proceder ao desconto da verba honorária contratada, quando da expedição da requisição ou pagamento do eventual efeito patrimonial da ação judicial aforada em decorrência do presente contrato."]),
    CL(14, ["Concordam as partes que a CONTRATADA estará em período de recesso do 15º dia do mês de dezembro de todos os anos até 31 de janeiro do ano subsequente, de modo que não haverá atendimento nesse período."]),
    ...(c.observacoes ? [P([B("DISPOSIÇÕES ESPECIAIS: "), c.observacoes])] : []),
    P([B("ASSIM"), ", por estarem justos e contratados, assinam o presente documento particular, elegendo o Foro de Cascavel, Paraná, para dirimir quaisquer pendências decorrentes do presente instrumento, renunciando a qualquer outro, por mais especial que seja."]),
    new Paragraph({ spacing: { before: 200, after: 700 }, children: [T(dataExt)] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [T("_______________________________________")] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 500 }, children: [B(cliente)] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [T("_______________________________________")] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [B(nomeContratado)] }),
  ];

  const doc = new Document({
    creator: "LexControl",
    title: `Contrato de honorários – ${c.cliente || ""}`,
    sections: [{ properties: { page: { margin: { top: 1500, bottom: 1300, left: 1500, right: 1300 } } }, children: filhos }],
  });
  return Packer.toBlob(doc);
}

const slug = t => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").toLowerCase();

export async function baixarContratoDocx(c) {
  const blob = await gerarContratoDocx(c);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `contrato-${slug(c.areaAtuacao) || "geral"}-${slug(c.cliente) || "cliente"}.docx`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
