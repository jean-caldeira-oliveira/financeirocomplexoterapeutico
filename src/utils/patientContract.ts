import { Invoice } from "@/types/invoice";
import { Patient } from "@/types/transaction";
import { addMonths } from "date-fns";

/**
 * Data prevista de término (saída) do contrato de um paciente.
 * Usa o vencimento da última parcela mensal gerada; se o paciente ainda não
 * tem nenhuma cobrança mensal, estima a partir da primeira parcela/entrada
 * mais o número de parcelas contratadas.
 */
export function getContractEndDate(
  patient: Patient,
  invoices: Invoice[],
): Date | null {
  const monthlyInvoices = invoices.filter(
    (inv) => inv.patientId === patient.id && inv.type === "monthly",
  );

  if (monthlyInvoices.length > 0) {
    const lastInvoice = monthlyInvoices.reduce((prev, curr) =>
      curr.installmentNumber > prev.installmentNumber ? curr : prev,
    );
    return new Date(lastInvoice.dueDate);
  }

  const baseDate = patient.firstInstallmentDate ?? patient.entryDate;
  if (!baseDate || !patient.installments) return null;

  return addMonths(new Date(baseDate), patient.installments - 1);
}

/**
 * Um contrato é considerado "finalizado" (pendente de renovação) quando o
 * paciente segue ativo no cadastro mas a última parcela do contrato atual
 * já venceu — ou seja, ninguém estendeu nem encerrou o cadastro dele ainda.
 */
export function isContractFinished(
  patient: Patient,
  invoices: Invoice[],
  referenceDate: Date = new Date(),
): boolean {
  if (!patient.active) return false;

  const endDate = getContractEndDate(patient, invoices);
  if (!endDate) return false;

  return endDate.getTime() < referenceDate.getTime();
}
