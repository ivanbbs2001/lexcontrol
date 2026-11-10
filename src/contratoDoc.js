/* Geração de contrato de honorários em Word (.docx) — modelo básico por área.
   Carregado sob demanda (import dinâmico) para não pesar o app. */
const BL = "__________________";

const OBJETO = {
  "Cível": "a prestação de serviços advocatícios para patrocinar os interesses do(a) CONTRATANTE em demanda de natureza cível, compreendendo o ajuizamento ou a defesa em ação judicial, o acompanhamento do processo e a prática dos atos necessários até a decisão de primeira instância, incluindo audiências, petições, manifestações e acompanhamento de prazos",
  "Penal / Criminal": "a prestação de serviços advocatícios para a defesa técnica do(a) CONTRATANTE em procedimento ou processo de natureza criminal, compreendendo o acompanhamento de inquérito policial, a apresentação de resposta à acusação, o acompanhamento de audiências de instrução e julgamento, a elaboração de alegações finais e demais atos de defesa até a decisão de primeiro grau",
  "Trabalhista": "a prestação de serviços advocatícios para patrocinar os interesses do(a) CONTRATANTE em demanda perante a Justiça do Trabalho, compreendendo a propositura ou a defesa em reclamação trabalhista, o acompanhamento de audiências, a produção de provas, a elaboração de manifestações e o acompanhamento do processo até a decisão de primeira instância",
  "Previdenciária": "a prestação de serviços advocatícios para patrocinar os interesses do(a) CONTRATANTE em matéria previdenciária, compreendendo o requerimento ou a revisão de benefício junto ao INSS e, se necessário, o ajuizamento de ação judicial, o acompanhamento de perícias e audiências e o cumprimento da sentença até a implantação do benefício",
};
const OBJETO_PADRAO = "a prestação de serviços advocatícios para patrocinar os interesses do(a) CONTRATANTE na demanda descrita nesta cláusula, compreendendo a prática dos atos necessários à defesa de seus interesses até a decisão de primeira instância";

const EXTRA = {
  "Penal / Criminal": "A obrigação do(a) CONTRATADO(A) é de meio, não de resultado, não podendo garantir absolvição, redução de pena ou qualquer desfecho específico, em razão da independência do Poder Judiciário.",
  "Trabalhista": "A obrigação do(a) CONTRATADO(A) é de meio, não de resultado, não podendo garantir procedência de pedidos ou valores a serem recebidos.",
  "Previdenciária": "A obrigação do(a) CONTRATADO(A) é de meio, não de resultado, não podendo garantir a concessão do benefício, que depende da análise do INSS e do Poder Judiciário.",
  "Cível": "A obrigação do(a) CONTRATADO(A) é de meio, não de resultado, não podendo garantir procedência de pedidos ou prazos de tramitação.",
};

const MESES = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
const brl = v => { const n = Number(String(v ?? "").replace(/\./g, "").replace(",", ".")) || Number(v) || 0; return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); };

export async function gerarContratoDocx(c) {
  const { Document, Packer, Paragraph, TextRun, AlignmentType } = await import("docx");
  const area = ["Cível", "Penal / Criminal", "Trabalhista", "Previdenciária"].includes(c.areaAtuacao) ? c.areaAtuacao : null;
  const hoje = new Date();
  const dataExt = `Cascavel/PR, ${hoje.getDate()} de ${MESES[hoje.getMonth()]} de ${hoje.getFullYear()}.`;
  const advogado = c.advogado || "Juliana Savi";

  const P = (runs, o = {}) => new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 160, line: 300 }, ...o, children: (Array.isArray(runs) ? runs : [runs]).map(r => typeof r === "string" ? new TextRun({ text: r, font: "Times New Roman", size: 24 }) : r) });
  const B = t => new TextRun({ text: t, bold: true, font: "Times New Roman", size: 24 });
  const clausula = (titulo, texto) => [P([B(titulo + " ")].concat([texto]))];

  const valor = c.valorTotal ? `${brl(c.valorTotal)}` : BL;
  let pagamento;
  const np = Number(c.totalParcelas) || 1;
  if (c.formaPagamento && np > 1) pagamento = `pago em ${np} parcelas de ${c.valorParcela ? brl(c.valorParcela) : BL}, via ${c.formaPagamento}`;
  else if (c.formaPagamento) pagamento = `pago à vista, via ${c.formaPagamento}`;
  else pagamento = np > 1 ? `pago em ${np} parcelas de ${c.valorParcela ? brl(c.valorParcela) : BL}` : "pago na forma ajustada entre as partes";

  const proc = c.numeroProcesso ? ` (processo nº ${c.numeroProcesso})` : "";

  const filhos = [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: "CONTRATO DE PRESTAÇÃO DE SERVIÇOS ADVOCATÍCIOS", bold: true, font: "Times New Roman", size: 28 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 }, children: [new TextRun({ text: `Área: ${area || c.areaAtuacao || "—"}`, italics: true, font: "Times New Roman", size: 22 })] }),
    P([B("CONTRATANTE: "), `${c.cliente || BL}, CPF/CNPJ nº ${BL}, residente e domiciliado(a) em ${BL}, telefone ${c.telefone || BL}.`],{alignment:AlignmentType.LEFT}),
    P([B("CONTRATADO(A): "), `${advogado}, advogado(a) inscrito(a) na OAB/PR sob nº ${BL}, com escritório profissional em Cascavel/PR, ${BL}.`],{alignment:AlignmentType.LEFT}),
    P("As partes acima qualificadas celebram o presente contrato, que se regerá pelas cláusulas seguintes e pelo Estatuto da Advocacia (Lei nº 8.906/1994) e Código de Ética e Disciplina da OAB."),
    ...clausula("CLÁUSULA 1ª – DO OBJETO.", `O presente contrato tem por objeto ${OBJETO[area] || OBJETO_PADRAO}${proc}.`),
    ...clausula("CLÁUSULA 2ª – DA NATUREZA DA OBRIGAÇÃO.", EXTRA[area] || "A obrigação do(a) CONTRATADO(A) é de meio, não de resultado."),
    ...clausula("CLÁUSULA 3ª – DOS HONORÁRIOS.", `Pelos serviços prestados, o(a) CONTRATANTE pagará ao(à) CONTRATADO(A) honorários no valor total de ${valor}, ${pagamento}.`),
    ...(c.prazos ? clausula("PARÁGRAFO ÚNICO.", `Prazos e condições: ${c.prazos}.`) : []),
    ...clausula("CLÁUSULA 4ª – DOS HONORÁRIOS DE SUCUMBÊNCIA.", "Os honorários de sucumbência, se fixados em juízo, pertencem exclusivamente ao(à) advogado(a), nos termos do art. 23 da Lei nº 8.906/1994, e não se confundem com os honorários contratuais."),
    ...clausula("CLÁUSULA 5ª – DAS DESPESAS.", "As custas processuais, taxas, perícias, diligências, deslocamentos e demais despesas necessárias ao andamento do serviço não estão incluídas nos honorários e correrão por conta do(a) CONTRATANTE, mediante prévia comunicação."),
    ...clausula("CLÁUSULA 6ª – DAS OBRIGAÇÕES DO(A) CONTRATANTE.", "O(a) CONTRATANTE compromete-se a fornecer todas as informações e documentos necessários, manter seus dados de contato atualizados e comparecer aos atos em que sua presença for exigida."),
    ...clausula("CLÁUSULA 7ª – DA RESCISÃO.", "O contrato poderá ser rescindido por qualquer das partes mediante comunicação por escrito. Em caso de rescisão sem justa causa por iniciativa do(a) CONTRATANTE, serão devidos os honorários proporcionais ao trabalho já realizado."),
    ...clausula("CLÁUSULA 8ª – DA PROTEÇÃO DE DADOS.", "O(a) CONTRATANTE autoriza o tratamento de seus dados pessoais, nos termos da Lei nº 13.709/2018 (LGPD), exclusivamente para a execução deste contrato e o cumprimento de obrigações legais e do exercício regular de direitos."),
    ...(c.observacoes ? clausula("CLÁUSULA 9ª – DAS DISPOSIÇÕES ESPECIAIS.", c.observacoes) : []),
    ...clausula("CLÁUSULA " + (c.observacoes ? "10ª" : "9ª") + " – DO FORO.", "Fica eleito o foro da Comarca de Cascavel/PR para dirimir quaisquer questões oriundas deste contrato."),
    P("E, por estarem justas e contratadas, as partes assinam o presente em duas vias de igual teor."),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 600 }, children: [new TextRun({ text: dataExt, font: "Times New Roman", size: 24 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "_______________________________________", font: "Times New Roman", size: 24 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: `CONTRATANTE – ${c.cliente || ""}`, font: "Times New Roman", size: 24 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "_______________________________________", font: "Times New Roman", size: 24 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `CONTRATADO(A) – ${advogado}`, font: "Times New Roman", size: 24 })] }),
  ];

  const doc = new Document({
    creator: "LexControl",
    title: `Contrato de honorários – ${c.cliente || ""}`,
    sections: [{ properties: { page: { margin: { top: 1700, bottom: 1400, left: 1700, right: 1400 } } }, children: filhos }],
  });
  return Packer.toBlob(doc);
}

export async function baixarContratoDocx(c) {
  const blob = await gerarContratoDocx(c);
  const nome = `contrato-${(c.areaAtuacao || "geral").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w]+/g, "-").toLowerCase()}-${(c.cliente || "cliente").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w]+/g, "-").toLowerCase()}.docx`;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = nome; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
