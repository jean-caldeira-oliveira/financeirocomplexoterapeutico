import { usePatients } from "@/hooks/usePatients";
import { useInvoices } from "@/hooks/useInvoices";
import { Ward } from "@/types/transaction";
import { useMemo } from "react";

export const WARD_CAPACITY: Record<Ward, number> = {
  feminina: 21,
  masculina: 47,
};

export interface RetentionPatient {
  patientId: string;
  name: string;
  ward: Ward;
  dueDate: Date;
}

export function useWardOccupancy() {
  const { patients, patientsByWard } = usePatients();
  const { invoices } = useInvoices();

  // Ticket médio: média da mensalidade dos pacientes ativos. Independe de
  // mês selecionado — serve como estimativa estável para o potencial de
  // faturamento adicional com vagas livres.
  const ticketMedio = useMemo(() => {
    const activePatients = patients.filter((p) => p.active && p.monthlyFee > 0);
    if (activePatients.length === 0) return 0;
    const total = activePatients.reduce((sum, p) => sum + p.monthlyFee, 0);
    return total / activePatients.length;
  }, [patients]);

  // Forecast: patients whose last monthly installment falls in next 1 or 3 months
  const wardLeavingForecast = useMemo(() => {
    const today = new Date();
    const counts = {
      feminina: { nextMonth: 0, next3Months: 0 },
      masculina: { nextMonth: 0, next3Months: 0 },
    };
    const patientMap: Record<string, { name: string; ward: Ward }> = {};
    patients.forEach((p) => {
      patientMap[p.id] = { name: p.name, ward: p.ward };
    });

    // Find each patient's last monthly installment due date
    const lastInstallmentByPatient: Record<string, { dueDate: Date }> = {};
    for (const inv of invoices) {
      if (inv.type !== "monthly") continue;
      if (inv.installmentNumber !== inv.totalInstallments) continue;
      lastInstallmentByPatient[inv.patientId] = {
        dueDate: new Date(inv.dueDate),
      };
    }

    // "Próx. mês": de hoje até o fim do mês calendário seguinte
    const endOfNextMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 2,
      0,
      23,
      59,
      59,
      999
    );
    // "3 meses": de hoje até o fim do 3º mês calendário seguinte
    const endOfThirdMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 4,
      0,
      23,
      59,
      59,
      999
    );

    const retentionList: {
      nextMonth: RetentionPatient[];
      next3Months: RetentionPatient[];
    } = { nextMonth: [], next3Months: [] };

    for (const [patientId, { dueDate }] of Object.entries(
      lastInstallmentByPatient
    )) {
      const patient = patientMap[patientId];
      const ward = patient?.ward;
      if (!ward || !(ward in counts)) continue;
      if (dueDate < today) continue;
      if (dueDate <= endOfNextMonth) {
        counts[ward].nextMonth++;
        retentionList.nextMonth.push({ patientId, name: patient.name, ward, dueDate });
      }
      if (dueDate <= endOfThirdMonth) {
        counts[ward].next3Months++;
        retentionList.next3Months.push({ patientId, name: patient.name, ward, dueDate });
      }
    }
    retentionList.nextMonth.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    retentionList.next3Months.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

    return { ...counts, retentionList };
  }, [invoices, patients]);

  const wardOccupancy = useMemo(() => {
    const today = new Date();
    const endOfThirdMonth = new Date(today.getFullYear(), today.getMonth() + 4, 0);
    const weeksTo3Months = Math.max(
      (endOfThirdMonth.getTime() - today.getTime()) / (7 * 24 * 60 * 60 * 1000),
      1
    );

    const build = (ward: Ward) => {
      const capacity = WARD_CAPACITY[ward];
      const current = patientsByWard[ward];
      const projectedNextMonth = current - wardLeavingForecast[ward].nextMonth;
      const projected3Months = current - wardLeavingForecast[ward].next3Months;

      const currentRate = (current / capacity) * 100;
      const nextMonthRate = (projectedNextMonth / capacity) * 100;
      const rate3Months = (projected3Months / capacity) * 100;

      const freeSpots3Months = Math.max(capacity - projected3Months, 0);

      return {
        capacity,
        currentRate,
        nextMonthRate,
        rate3Months,
        freeSpotsCurrent: Math.max(capacity - current, 0),
        freeSpotsNextMonth: Math.max(capacity - projectedNextMonth, 0),
        freeRateNextMonth: Math.max(100 - nextMonthRate, 0),
        freeSpots3Months,
        freeRate3Months: Math.max(100 - rate3Months, 0),
        admissionsPerWeekNeeded: freeSpots3Months / weeksTo3Months,
      };
    };
    return { feminina: build("feminina"), masculina: build("masculina") };
  }, [patientsByWard, wardLeavingForecast]);

  return { patientsByWard, wardOccupancy, wardLeavingForecast, ticketMedio };
}
