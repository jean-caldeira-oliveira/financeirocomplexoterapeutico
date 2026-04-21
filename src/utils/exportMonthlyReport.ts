import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, categoryLabels } from '@/types/transaction';
import { Bill } from '@/types/bill';
import { Invoice } from '@/types/invoice';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR');
}

interface ReportData {
  selectedMonth: Date;
  stats: {
    expectedIncome: number;
    actualIncome: number;
    pendingTotal: number;
    ticketMedio: number;
    previousBalance: number;
    monthExpense: number;
    balance: number;
  };
  transactions: Transaction[];
  monthBills: Bill[];
  monthInvoices: Invoice[];
  getInvoicePaidAmount: (inv: Invoice) => number;
  patientsByWard: { feminina: number; masculina: number };
}

export function exportMonthlyReport(data: ReportData) {
  const { selectedMonth, stats, transactions, monthBills, monthInvoices, getInvoicePaidAmount, patientsByWard } = data;
  const monthLabel = `${MONTH_NAMES[selectedMonth.getMonth()]}/${selectedMonth.getFullYear()}`;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('COMPLEXO TERAPÊUTICO', pageWidth / 2, y, { align: 'center' });
  y += 8;
  doc.setFontSize(14);
  doc.text(`Relatório Mensal - ${monthLabel}`, pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.setLineWidth(0.5);
  doc.line(14, y, pageWidth - 14, y);
  y += 10;

  // Summary table
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumo Financeiro', 14, y);
  y += 2;

  autoTable(doc, {
    startY: y,
    head: [['Indicador', 'Valor']],
    body: [
      ['Previsão de Entradas', formatCurrency(stats.expectedIncome)],
      ['Entradas Atuais', formatCurrency(stats.actualIncome)],
      ['Valores Pendentes', formatCurrency(stats.pendingTotal)],
      ['Ticket Médio', formatCurrency(stats.ticketMedio)],
      ['Saídas', formatCurrency(stats.monthExpense)],
      ['Saldo Anterior', formatCurrency(stats.previousBalance)],
      ['Fechamento de Caixa', formatCurrency(stats.balance)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], fontStyle: 'bold' },
    styles: { fontSize: 10 },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Patient stats
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Pacientes Internados', 14, y);
  y += 2;

  autoTable(doc, {
    startY: y,
    head: [['Ala', 'Quantidade']],
    body: [
      ['Ala Feminina', patientsByWard.feminina.toString()],
      ['Ala Masculina', patientsByWard.masculina.toString()],
      ['Total', (patientsByWard.feminina + patientsByWard.masculina).toString()],
    ],
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], fontStyle: 'bold' },
    styles: { fontSize: 10 },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Invoices (Cobranças)
  if (monthInvoices.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Cobranças do Mês', 14, y);
    y += 2;

    const statusMap: Record<string, string> = { pending: 'Pendente', paid: 'Recebido', overdue: 'Atrasado' };

    autoTable(doc, {
      startY: y,
      head: [['Paciente', 'Valor', 'Vencimento', 'Status', 'Recebido']],
      body: monthInvoices.map((inv) => [
        inv.patientName,
        formatCurrency(inv.amount),
        formatDate(inv.dueDate),
        statusMap[inv.status] || inv.status,
        formatCurrency(getInvoicePaidAmount(inv)),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], fontStyle: 'bold' },
      styles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });

    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Check page space
  if (y > 240) {
    doc.addPage();
    y = 15;
  }

  // Bills (Contas a Pagar)
  if (monthBills.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Contas a Pagar do Mês', 14, y);
    y += 2;

    const statusMap: Record<string, string> = { pending: 'Pendente', paid: 'Pago', overdue: 'Atrasado' };

    autoTable(doc, {
      startY: y,
      head: [['Descrição', 'Valor', 'Vencimento', 'Status', 'Valor Pago']],
      body: monthBills.map((b) => [
        b.description,
        formatCurrency(b.amount),
        formatDate(b.dueDate),
        statusMap[b.status] || b.status,
        b.status === 'paid' ? formatCurrency(b.paidAmount ?? b.amount) : '-',
      ]),
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], fontStyle: 'bold' },
      styles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });

    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Check page space
  if (y > 240) {
    doc.addPage();
    y = 15;
  }

  // Manual transactions
  if (transactions.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Transações Manuais', 14, y);
    y += 2;

    autoTable(doc, {
      startY: y,
      head: [['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor']],
      body: transactions.map((t) => [
        formatDate(t.date),
        t.type === 'income' ? 'Entrada' : 'Saída',
        categoryLabels[t.category] || t.category,
        t.description,
        formatCurrency(t.amount),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], fontStyle: 'bold' },
      styles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150);
    doc.text(
      `Gerado em ${new Date().toLocaleString('pt-BR')} - Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' },
    );
    doc.setTextColor(0);
  }

  doc.save(`relatorio-mensal-${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}.pdf`);
}
