import jsPDF from "jspdf";
import {
  BudgetQuote,
  LAUNDRY_FEE,
  PSYCHIATRIC_FOLLOWUP_FEE,
  roomTypeDescriptions,
  roomTypeLabels,
  roomTypeOrder,
} from "@/types/budgetQuote";
import logo from "@/assets/logo.png";

function fmt(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("pt-BR");
}

const BROWN: [number, number, number] = [123, 79, 46];
const BROWN2: [number, number, number] = [92, 51, 23];
const MUTED: [number, number, number] = [122, 101, 88];
const SAND: [number, number, number] = [237, 224, 212];
const CREAM: [number, number, number] = [253, 246, 240];

const BASE_INCLUDED_ITEMS = [
  "Hospedagem e 4 refeições diárias",
  "Psicólogo individual (1x/sem) e em grupo",
  "Assistente Social e Nutricionista",
  "Responsável Terapêutico (RT)",
  "Técnico de Enfermagem",
  "Ed. Física (1x/sem) e academia",
  "12 Passos e Metodologia Minnesota",
  "Oficinas, atividades recreativas e ocupacionais",
];

const BASE_EXTRA_ITEMS = [
  "Higiene pessoal e vestuário",
  "Cigarro e erva-mate",
  "Medicamentos de uso contínuo",
  "Exames laboratoriais e complementares",
  "Transporte e deslocamentos",
  "Fisioterapia e odontologia",
  "Consultas médicas especializadas",
  "Cantina (limite definido pela família)",
];

function loadImageAsDataUrl(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas indisponível"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("Falha ao carregar logo"));
    img.src = src;
  });
}

export async function exportBudgetQuotePDF(quote: BudgetQuote) {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const marginX = 14;
  let y = 15;

  // ── HERO ──
  doc.setFillColor(...BROWN2);
  doc.rect(0, 0, pw, 34, "F");
  try {
    const logoDataUrl = await loadImageAsDataUrl(logo);
    doc.addImage(logoDataUrl, "PNG", marginX, 8, 18, 18);
  } catch {
    // logo indisponível — segue sem imagem
  }
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("PROPOSTA DE ACOLHIMENTO TERAPÊUTICO", marginX + 22, 15);
  doc.setFontSize(17);
  doc.text("Complexo Terapêutico", marginX + 22, 23);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Centro de Reabilitação Feminino e Masculino · Pelotas/RS", marginX + 22, 29);
  doc.setTextColor(0, 0, 0);

  // ── META BAR ──
  y = 34;
  doc.setFillColor(...BROWN);
  doc.rect(0, y, pw, 12, "F");
  const metaItems: [string, string][] = [
    ["PROPOSTA Nº", quote.id.slice(0, 8).toUpperCase()],
    ["DATA", fmtDate(new Date(quote.createdAt))],
    ["VALIDADE", `${quote.validityDays} dias`],
    ["PERÍODO PREVISTO", quote.periodMonths || "-"],
  ];
  const metaColW = pw / metaItems.length;
  metaItems.forEach(([label, val], i) => {
    const x = i * metaColW + 6;
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.text(label, x, y + 5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text(val, x, y + 9.5);
  });
  doc.setTextColor(0, 0, 0);
  y += 18;

  // ── DADOS DO PACIENTE ──
  const sectionHead = (label: string) => {
    doc.setFillColor(...BROWN);
    doc.circle(marginX + 1, y - 1.3, 1, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    doc.text(label.toUpperCase(), marginX + 5, y);
    doc.setDrawColor(...SAND);
    doc.setLineWidth(0.3);
    doc.line(marginX + 5 + doc.getTextWidth(label.toUpperCase()) + 3, y - 1.3, pw - marginX, y - 1.3);
    doc.setTextColor(0, 0, 0);
    y += 6;
  };

  sectionHead("Dados do Paciente e Responsável");

  const patientFields: [string, string][] = [
    ["Nome do Acolhido", quote.patientName],
    ["CPF · Data de Nascimento", [quote.patientDocument, quote.patientBirthDate].filter(Boolean).join(" · ") || "-"],
    ["Nome do Responsável / Contratante", quote.guardianName],
    ["CPF · Telefone", [quote.guardianDocument, quote.guardianPhone].filter(Boolean).join(" · ") || "-"],
  ];
  const fieldColW = (pw - marginX * 2 - 4) / 2;
  patientFields.forEach(([label, val], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = marginX + col * (fieldColW + 4);
    const fy = y + row * 13;
    doc.setFillColor(...CREAM);
    doc.rect(x, fy, fieldColW, 11, "F");
    doc.setDrawColor(...SAND);
    doc.setLineWidth(0.6);
    doc.line(x, fy, x, fy + 11);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...MUTED);
    doc.text(label.toUpperCase(), x + 3, fy + 4);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(val, x + 3, fy + 8.5);
    doc.setTextColor(0, 0, 0);
  });
  y += 13 * 2 + 4;

  // ── MODALIDADES (3 CARDS) ──
  sectionHead("Modalidade de Acomodação e Investimento");

  const roomColors: Record<string, [number, number, number]> = {
    coletivo: BROWN,
    semi_privativo: [74, 103, 65],
    privativo: [44, 74, 110],
  };
  const cardGap = 5;
  const cardW = (pw - marginX * 2 - cardGap * 2) / 3;
  const cardH = quote.psychiatricFollowup || quote.laundryIncluded ? 48 : 42;
  const cardPad = 4;

  const monthlyExtras = (quote.psychiatricFollowup ? PSYCHIATRIC_FOLLOWUP_FEE : 0) +
    (quote.laundryIncluded ? LAUNDRY_FEE : 0);

  roomTypeOrder.forEach((roomType, idx) => {
    const cx = marginX + idx * (cardW + cardGap);
    const roomColor = roomColors[roomType];
    const pricing = quote.roomPricing[roomType];
    const totalMonthlyFee = pricing.monthlyFee + monthlyExtras;

    doc.setDrawColor(...roomColor);
    doc.setLineWidth(0.8);
    doc.roundedRect(cx, y, cardW, cardH, 2, 2);
    doc.setFillColor(...roomColor);
    doc.roundedRect(cx, y, cardW, 8, 2, 2, "F");
    doc.rect(cx, y + 4, cardW, 4, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text(roomTypeLabels[roomType], cx + cardPad, y + 5.3);
    doc.setTextColor(0, 0, 0);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(...MUTED);
    const descLines = doc.splitTextToSize(roomTypeDescriptions[roomType], cardW - cardPad * 2);
    doc.text(descLines, cx + cardPad, y + 13);
    doc.setTextColor(0, 0, 0);

    const lineY = y + 13 + descLines.length * 3.2 + 2;
    doc.setDrawColor(...SAND);
    doc.setLineWidth(0.3);
    doc.line(cx + cardPad, lineY, cx + cardW - cardPad, lineY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(...MUTED);
    doc.text("MATRÍCULA", cx + cardPad, lineY + 4.5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...roomColor);
    doc.text(fmt(pricing.enrollmentFee), cx + cardPad, lineY + 9);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(...MUTED);
    doc.text("MENSALIDADE", cx + cardW - cardPad, lineY + 4.5, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...roomColor);
    doc.text(fmt(totalMonthlyFee), cx + cardW - cardPad, lineY + 9, { align: "right" });
    doc.setTextColor(0, 0, 0);

    if (monthlyExtras > 0) {
      const badgeParts: string[] = [];
      if (quote.psychiatricFollowup) badgeParts.push("Psiquiatria inclusa");
      if (quote.laundryIncluded) badgeParts.push("Lavanderia inclusa");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.2);
      doc.setTextColor(...roomColor);
      doc.text(badgeParts.join(" · "), cx + cardPad, lineY + 13.5);
      doc.setTextColor(0, 0, 0);
    }
  });

  y += cardH + 4;

  // ── INCLUSOS / EXTRAS ──
  sectionHead("Serviços Inclusos & Cobrado à Parte");

  const includedItems = [...BASE_INCLUDED_ITEMS];
  const extraItems = [...BASE_EXTRA_ITEMS];

  if (quote.psychiatricFollowup) {
    includedItems.push("Acompanhamento psiquiátrico");
  } else {
    extraItems.push("Acompanhamento psiquiátrico (sob solicitação)");
  }

  if (quote.laundryIncluded) {
    includedItems.push("Lavanderia");
  } else {
    extraItems.push("Lavanderia (sob solicitação)");
  }

  const listColW = (pw - marginX * 2 - 8) / 2;
  const listX = [marginX, marginX + listColW + 8];
  const lists = [
    { title: "INCLUSO NA MENSALIDADE", items: includedItems, color: BROWN },
    { title: "COBRADO À PARTE", items: extraItems, color: MUTED },
  ];

  let maxListY = y;
  lists.forEach((list, idx) => {
    let ly = y;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...list.color);
    doc.text(list.title, listX[idx], ly);
    doc.setTextColor(0, 0, 0);
    ly += 4.5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.8);
    list.items.forEach((item) => {
      doc.setFillColor(...list.color);
      doc.circle(listX[idx] + 1, ly - 1, 0.7, "F");
      const wrapped = doc.splitTextToSize(item, listColW - 5);
      doc.text(wrapped, listX[idx] + 4, ly);
      ly += 4.2 * wrapped.length;
    });
    maxListY = Math.max(maxListY, ly);
  });
  y = maxListY + 4;

  // ── DETERMINAÇÃO JUDICIAL ──
  sectionHead("Internação por Determinação Judicial");

  doc.setFillColor(...CREAM);
  doc.rect(marginX, y, pw - marginX * 2, 4.5, "F");
  const judicialText =
    "Aceita-se acolhimento por ordem judicial mediante: (i) documento judicial original ou cópia autenticada " +
    "(mandado/despacho com identificação do juízo, vara, processo e assinatura da autoridade); (ii) nome e CPF " +
    "do paciente no documento; (iii) assinatura do responsável legal no contrato assumindo as obrigações " +
    "financeiras e contratuais.";
  const judicialLines = doc.splitTextToSize(judicialText, pw - marginX * 2 - 8);
  const judicialBoxH = judicialLines.length * 3.8 + 8;
  doc.setFillColor(...CREAM);
  doc.rect(marginX, y, pw - marginX * 2, judicialBoxH, "F");
  doc.setFillColor(...BROWN);
  doc.rect(marginX, y, 1.2, judicialBoxH, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...BROWN);
  doc.text("Requisitos para Acolhimento Compulsório", marginX + 4, y + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(30, 20, 15);
  doc.text(judicialLines, marginX + 4, y + 9.5);
  doc.setTextColor(0, 0, 0);
  y += judicialBoxH + 4;

  const institutionRows: [string, string][] = [
    ["Razão Social", "C. REZENDE BITENCOURT LTDA."],
    ["CNPJ", "33.804.742/0001-29"],
    ["Nome Fantasia", "Complexo Terapêutico — Centro de Reabilitação Feminino e Masculino"],
    ["Endereço", "Av. Fernando Osório, 7835 — Três Vendas — Pelotas/RS — CEP 96.070-861"],
    ["Contato", "(53) 98126-2953 · (53) 98156-7392"],
    ["PIX / Banco", "CNPJ 33.804.742/0001-29 · SICRED Banco 748 — Ag. 0663 — Conta 92025-1"],
    ["Regulamentação", "RDC ANVISA Nº 29/2011 — Comunidade Terapêutica"],
  ];
  const labelColW = 32;
  doc.setDrawColor(...SAND);
  doc.setLineWidth(0.2);
  institutionRows.forEach(([label, val]) => {
    const valLines = doc.splitTextToSize(val, pw - marginX * 2 - labelColW - 6);
    const rowH = Math.max(6, valLines.length * 3.6 + 2);

    if (y + rowH > 280) {
      doc.addPage();
      y = 15;
    }

    doc.setFillColor(...BROWN);
    doc.rect(marginX, y, labelColW, rowH, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);
    doc.text(label, marginX + 2, y + rowH / 2 + 1);

    doc.setDrawColor(...SAND);
    doc.rect(marginX + labelColW, y, pw - marginX * 2 - labelColW, rowH);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    doc.text(valLines, marginX + labelColW + 3, y + 4.2);

    y += rowH;
  });

  if (quote.notes) {
    y += 5;
    if (y > 275) {
      doc.addPage();
      y = 15;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text("OBSERVAÇÕES", marginX, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    const notesLines = doc.splitTextToSize(quote.notes, pw - marginX * 2);
    doc.text(notesLines, marginX, y);
  }

  // ── FOOTER on every page ──
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    const ph = doc.internal.pageSize.getHeight();
    doc.setFillColor(...BROWN2);
    doc.rect(0, ph - 14, pw, 14, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(220, 210, 200);
    doc.text(
      "CNPJ 33.804.742/0001-29 · Av. Fernando Osório, 7835 — Três Vendas — Pelotas/RS",
      marginX,
      ph - 9
    );
    doc.text(
      `(53) 98126-2953 · PIX: 33.804.742/0001-29 · Página ${i} de ${pages}`,
      marginX,
      ph - 5
    );
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text("Complexo Terapêutico", pw - marginX, ph - 8, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(220, 210, 200);
    doc.text("EQUIPE ADMINISTRATIVA", pw - marginX, ph - 4.5, { align: "right" });
    doc.setTextColor(0, 0, 0);
  }

  doc.save(`orcamento_${quote.patientName.replace(/\s+/g, "_").toLowerCase()}.pdf`);
}
