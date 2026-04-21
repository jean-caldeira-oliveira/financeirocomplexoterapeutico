import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Transaction, Patient, categoryLabels, wardLabels } from '@/types/transaction';
import { Bill, billStatusLabels } from '@/types/bill';
import { Invoice, invoiceStatusLabels, invoicePaymentMethodLabels } from '@/types/invoice';

function fmt(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function fmtDate(d: string): string {
  return format(new Date(d), 'dd/MM/yyyy');
}

function header(doc: jsPDF, title: string, subtitle: string) {
  const pw = doc.internal.pageSize.getWidth();
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('COMPLEXO TERAPÊUTICO', pw / 2, 15, { align: 'center' });
  doc.setFontSize(12);
  doc.text(title, pw / 2, 23, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(subtitle, pw / 2, 30, { align: 'center' });
  doc.setLineWidth(0.4);
  doc.line(14, 33, pw - 14, 33);
}

function footer(doc: jsPDF) {
  const pages = doc.getNumberOfPages();
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150);
    doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')} — Página ${i} de ${pages}`, pw / 2, ph - 10, { align: 'center' });
    doc.setTextColor(0);
  }
}

const HEAD_STYLE = { fillColor: [41, 128, 185] as [number, number, number], fontStyle: 'bold' as const };

// ========================
// PATIENTS
// ========================
export function exportPatientsPDF(patients: Patient[], patientsByWard: { feminina: number; masculina: number }) {
  const doc = new jsPDF();
  header(doc, 'Relatório de Pacientes', `Total: ${patients.length} pacientes`);

  let y = 38;
  // Summary
  autoTable(doc, {
    startY: y,
    head: [['Indicador', 'Valor']],
    body: [
      ['Ativos', patients.filter(p => p.active).length.toString()],
      ['Inativos', patients.filter(p => !p.active).length.toString()],
      ['Ala Feminina', patientsByWard.feminina.toString()],
      ['Ala Masculina', patientsByWard.masculina.toString()],
    ],
    theme: 'grid',
    headStyles: HEAD_STYLE,
    styles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // Table
  autoTable(doc, {
    startY: y,
    head: [['Nome', 'Ala', 'Status', 'Mensalidade', 'Dia Venc.', 'Responsável']],
    body: patients.map(p => [
      p.name,
      wardLabels[p.ward],
      p.active ? 'Ativo' : 'Inativo',
      fmt(p.monthlyFee),
      p.dueDay.toString(),
      p.guardianName || '-',
    ]),
    theme: 'grid',
    headStyles: HEAD_STYLE,
    styles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  });

  footer(doc);
  doc.save('relatorio_pacientes.pdf');
}

// ========================
// INVOICES
// ========================
interface InvoiceReportData {
  invoices: Invoice[];
  totals: { total: number; received: number; pending: number; count: number };
  patientWardMap: Record<string, string>;
  getInvoicePaidAmount: (inv: Invoice) => number;
  getInvoiceRemainingAmount: (inv: Invoice) => number;
}

export function exportInvoicesPDF(data: InvoiceReportData) {
  const { invoices, totals, patientWardMap, getInvoicePaidAmount, getInvoiceRemainingAmount } = data;
  const doc = new jsPDF('landscape');
  header(doc, 'Relatório de Cobranças', `${totals.count} cobranças`);

  let y = 38;
  autoTable(doc, {
    startY: y,
    head: [['Total', 'Recebido', 'Saldo em Aberto']],
    body: [[fmt(totals.total), fmt(totals.received), fmt(totals.pending)]],
    theme: 'grid',
    headStyles: HEAD_STYLE,
    styles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  autoTable(doc, {
    startY: y,
    head: [['Paciente', 'Ala', 'Parcela', 'Vencimento', 'Valor', 'Recebido', 'Saldo', 'Status', 'Pagamentos']],
    body: invoices.map(inv => {
      const ward = patientWardMap[inv.patientId] ? wardLabels[patientWardMap[inv.patientId] as keyof typeof wardLabels] : '-';
      const payments = (inv.payments ?? []).map(p =>
        `${fmtDate(p.paymentDate)} ${invoicePaymentMethodLabels[p.method]} ${fmt(p.amount)}${p.isLate ? ' (atraso)' : ''}`
      ).join('; ');
      return [
        inv.patientName,
        ward,
        `${inv.installmentNumber}/${inv.totalInstallments}`,
        fmtDate(inv.dueDate),
        fmt(inv.amount),
        fmt(getInvoicePaidAmount(inv)),
        fmt(getInvoiceRemainingAmount(inv)),
        invoiceStatusLabels[inv.status],
        payments || '-',
      ];
    }),
    theme: 'grid',
    headStyles: HEAD_STYLE,
    styles: { fontSize: 7 },
    margin: { left: 14, right: 14 },
    columnStyles: { 8: { cellWidth: 60 } },
  });

  footer(doc);
  doc.save('relatorio_cobrancas.pdf');
}

// ========================
// BILLS
// ========================
export function exportBillsPDF(bills: Bill[], monthLabel: string, stats: { total: number; paidTotal: number; pendingTotal: number; overdueTotal: number }) {
  const doc = new jsPDF();
  header(doc, `Relatório de Contas — ${monthLabel}`, `${bills.length} contas`);

  let y = 38;
  autoTable(doc, {
    startY: y,
    head: [['Total', 'Pagas', 'Pendentes', 'Atrasadas']],
    body: [[fmt(stats.total), fmt(stats.paidTotal), fmt(stats.pendingTotal), fmt(stats.overdueTotal)]],
    theme: 'grid',
    headStyles: HEAD_STYLE,
    styles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  autoTable(doc, {
    startY: y,
    head: [['Descrição', 'Valor', 'Vencimento', 'Categoria', 'Status']],
    body: bills.map(b => [
      b.description + (b.totalInstallments ? ` (${b.installmentNumber}/${b.totalInstallments})` : ''),
      fmt(b.amount),
      fmtDate(b.dueDate),
      b.category,
      billStatusLabels[b.status],
    ]),
    theme: 'grid',
    headStyles: HEAD_STYLE,
    styles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });

  footer(doc);
  doc.save(`relatorio_contas_${monthLabel.replace(/\s/g, '_')}.pdf`);
}

// ========================
// TRANSACTIONS
// ========================
export function exportTransactionsPDF(
  transactions: Transaction[],
  monthLabel: string,
  stats: { expectedIncome: number; actualIncome: number; monthExpense: number; balance: number },
) {
  const doc = new jsPDF();
  header(doc, `Relatório de Transações — ${monthLabel}`, `${transactions.length} transações`);

  let y = 38;
  autoTable(doc, {
    startY: y,
    head: [['Previsão Entradas', 'Entradas Recebidas', 'Saídas', 'Saldo']],
    body: [[fmt(stats.expectedIncome), fmt(stats.actualIncome), fmt(stats.monthExpense), fmt(stats.balance)]],
    theme: 'grid',
    headStyles: HEAD_STYLE,
    styles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  autoTable(doc, {
    startY: y,
    head: [['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor', 'Status']],
    body: transactions.map(t => [
      fmtDate(t.date),
      t.type === 'income' ? 'Entrada' : 'Saída',
      categoryLabels[t.category] || t.category,
      t.description,
      fmt(t.amount),
      t.status === 'paid' ? 'Pago' : t.status === 'overdue' ? 'Atrasado' : t.status === 'pending' ? 'Pendente' : '-',
    ]),
    theme: 'grid',
    headStyles: HEAD_STYLE,
    styles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });

  footer(doc);
  doc.save(`relatorio_transacoes_${monthLabel.replace(/\s/g, '_')}.pdf`);
}
