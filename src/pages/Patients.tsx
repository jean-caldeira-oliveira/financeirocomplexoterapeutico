import { PatientDetailsDialog } from "@/components/patients/PatientDetailsDialog";
import {
  PatientForm,
  PatientFormData,
} from "@/components/patients/PatientForm";
import { PatientTable } from "@/components/patients/PatientTable";
import { ReferralSourcesDialog } from "@/components/patients/ReferralSourcesDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInvoices } from "@/hooks/useInvoices";
import { usePatients } from "@/hooks/usePatients";
import { useReferralSources } from "@/hooks/useReferralSources";
import { Patient, Ward, wardLabels } from "@/types/transaction";
import {
  ArrowLeft,
  Building2,
  Filter,
Search,
  Settings2,
  UserPlus,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

type StatusFilter = "all" | "active" | "inactive";
type WardFilter = "all" | Ward;
type ReferralFilter = "all" | string;

const Patients = () => {
  const {
    patients,
    addPatient,
    updatePatient,
    deletePatient,
    togglePatientActive,
    patientsByWard,
  } = usePatients();
  const {
    sources: referralSources,
    addSource,
    updateSource,
    deleteSource,
  } = useReferralSources();
  const {
    generateInvoicesForPatient,
    deleteFuturePatientInvoices,
    regeneratePatientInvoices,
  } = useInvoices();
  const [formOpen, setFormOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  const [referralsDialogOpen, setReferralsDialogOpen] = useState(false);
  const [feeChangeConfirm, setFeeChangeConfirm] = useState<{
    patientId: string;
    data: PatientFormData;
    oldFee: number;
  } | null>(null);
  const [deactivateConfirm, setDeactivateConfirm] = useState<Patient | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [wardFilter, setWardFilter] = useState<WardFilter>("all");
  const [referralFilter, setReferralFilter] = useState<ReferralFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");


  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const statusMatch =
        statusFilter === "all" ||
        (statusFilter === "active" && patient.active) ||
        (statusFilter === "inactive" && !patient.active);

      const wardMatch = wardFilter === "all" || patient.ward === wardFilter;

      const referralMatch =
        referralFilter === "all" || patient.referralSource === referralFilter;

      const searchMatch =
        searchQuery.trim() === "" ||
        patient.name.toLowerCase().includes(searchQuery.toLowerCase());

      return statusMatch && wardMatch && referralMatch && searchMatch;
    });
  }, [patients, statusFilter, wardFilter, referralFilter, searchQuery]);

  // Get unique referral sources from patients for filtering
  const usedReferralSources = useMemo(() => {
    const sources = new Set(
      patients.map((p) => p.referralSource).filter(Boolean)
    );
    return Array.from(sources).sort();
  }, [patients]);

  const handleAddPatient = async (data: PatientFormData) => {
    try {
      const newPatient = await addPatient(data);

      // Generate invoices for the new patient
      await generateInvoicesForPatient({
        patientId: newPatient.id,
        patientName: newPatient.name,
        monthlyFee: data.monthlyFee,
        dueDay: data.dueDay,
        installments: data.installments,
        startDate: data.entryDate,
        firstInstallmentDate: data.firstInstallmentDate,
        hasEnrollmentFee: data.hasEnrollmentFee,
        enrollmentFee: data.enrollmentFee,
        enrollmentDueDate: data.enrollmentDueDate,
        interestRateMonthly: data.interestRateMonthly,
      });

      setFormOpen(false);
    } catch (e) {
      // Error already handled in hook
    }
  };

  const handleEditPatient = (data: PatientFormData) => {
    if (!editingPatient) return;

    const invoiceParamsChanged =
      data.monthlyFee !== editingPatient.monthlyFee ||
      data.dueDay !== editingPatient.dueDay ||
      data.installments !== editingPatient.installments ||
      String(data.firstInstallmentDate) !== String(editingPatient.firstInstallmentDate) ||
      data.interestRateMonthly !== editingPatient.interestRateMonthly;

    if (invoiceParamsChanged) {
      setFeeChangeConfirm({
        patientId: editingPatient.id,
        data,
        oldFee: editingPatient.monthlyFee,
      });
    } else {
      updatePatient(editingPatient.id, data);
      setEditingPatient(null);
    }
  };

  const handleConfirmFeeChange = async (regenerate: boolean) => {
    if (!feeChangeConfirm) return;
    const { patientId, data } = feeChangeConfirm;

    await updatePatient(patientId, data);

    if (regenerate) {
      await regeneratePatientInvoices({
        patientId,
        patientName: data.name,
        monthlyFee: data.monthlyFee,
        dueDay: data.dueDay,
        installments: data.installments,
        startDate: data.entryDate,
        firstInstallmentDate: data.firstInstallmentDate,
        interestRateMonthly: data.interestRateMonthly,
      });
    }

    setFeeChangeConfirm(null);
    setEditingPatient(null);
  };

  const handleToggleActive = (patient: Patient) => {
    if (patient.active) {
      setDeactivateConfirm(patient);
    } else {
      togglePatientActive(patient.id);
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivateConfirm) return;
    await togglePatientActive(deactivateConfirm.id);
    await deleteFuturePatientInvoices(deactivateConfirm.id);
    setDeactivateConfirm(null);
  };

  const handleStartEdit = (patient: Patient) => {
    setEditingPatient(patient);
  };

  const handleView = (patient: Patient) => {
    setViewingPatient(patient);
  };

  const activeCount = patients.filter((p) => p.active).length;
  const inactiveCount = patients.filter((p) => !p.active).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Pacientes</h1>
              <p className="text-xs text-muted-foreground">
                Gerenciamento de Cadastros
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button className="gap-2" onClick={() => setFormOpen(true)}>
              <UserPlus className="h-5 w-5" />
              Novo Paciente
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats and Filters */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="gap-2 py-2">
              <span className="font-normal text-muted-foreground">Ativos:</span>
              <span className="font-bold">{activeCount}</span>
            </Badge>
            <Badge variant="outline" className="gap-2 py-2">
              <span className="font-normal text-muted-foreground">
                Ala Feminina:
              </span>
              <span className="font-bold">{patientsByWard.feminina}</span>
            </Badge>
            <Badge variant="outline" className="gap-2 py-2">
              <span className="font-normal text-muted-foreground">
                Ala Masculina:
              </span>
              <span className="font-bold">{patientsByWard.masculina}</span>
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[200px] pl-9"
              />
            </div>

            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={wardFilter}
              onValueChange={(v) => setWardFilter(v as WardFilter)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Alas</SelectItem>
                {Object.entries(wardLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    Ala {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={referralFilter}
              onValueChange={(v) => setReferralFilter(v as ReferralFilter)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Encaminhamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Encaminhamentos</SelectItem>
                {usedReferralSources.map((source) => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setReferralsDialogOpen(true)}
            >
              <Settings2 className="h-4 w-4" />
              Encaminhamentos
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm">
          {filteredPatients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <UserPlus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">
                {patients.length === 0
                  ? "Nenhum paciente cadastrado"
                  : "Nenhum paciente encontrado"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {patients.length === 0
                  ? 'Clique em "Novo Paciente" para começar'
                  : "Tente ajustar os filtros"}
              </p>
            </div>
          ) : (
            <PatientTable
              patients={filteredPatients}
              onEdit={handleStartEdit}
              onDelete={deletePatient}
              onView={handleView}
              onToggleActive={(id) => {
                const patient = patients.find((p) => p.id === id);
                if (patient) handleToggleActive(patient);
              }}
            />
          )}
        </div>
      </main>

      {/* Add Patient Form */}
      <PatientForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleAddPatient}
        mode="create"
        referralSources={referralSources}
        onManageReferrals={() => setReferralsDialogOpen(true)}
      />

      {/* Edit Patient Form */}
      <PatientForm
        open={!!editingPatient}
        onOpenChange={(open) => !open && setEditingPatient(null)}
        onSubmit={handleEditPatient}
        initialData={editingPatient || undefined}
        mode="edit"
        referralSources={referralSources}
        onManageReferrals={() => setReferralsDialogOpen(true)}
      />

      {/* View Patient Details */}
      <PatientDetailsDialog
        open={!!viewingPatient}
        onOpenChange={(open) => !open && setViewingPatient(null)}
        patient={viewingPatient}
      />

      {/* Referral Sources Management */}
      <ReferralSourcesDialog
        open={referralsDialogOpen}
        onOpenChange={setReferralsDialogOpen}
        sources={referralSources}
        onAdd={addSource}
        onUpdate={updateSource}
        onDelete={deleteSource}
      />

      {/* Deactivate Patient Confirmation */}
      <AlertDialog
        open={!!deactivateConfirm}
        onOpenChange={(open) => !open && setDeactivateConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar paciente?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Você tem certeza que deseja desativar{" "}
                  <strong>{deactivateConfirm?.name}</strong>?
                </p>
                <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <p className="font-semibold">⚠️ Atenção:</p>
                  <p className="mt-1">
                    Todas as parcelas <strong>atuais e futuras</strong> deste
                    paciente que ainda não foram pagas serão{" "}
                    <strong>removidas permanentemente</strong>.
                  </p>
                  <p className="mt-1 text-xs opacity-80">
                    Parcelas já pagas não serão afetadas.
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Esta ação não pode ser desfeita.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeactivate}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sim, desativar e remover parcelas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Fee Change Confirmation */}
      <AlertDialog
        open={!!feeChangeConfirm}
        onOpenChange={(open) => !open && setFeeChangeConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dados de cobrança alterados</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Você alterou dados que afetam as cobranças (valor, dia de vencimento, número de parcelas ou data da primeira parcela).
                </p>
                <p>
                  Deseja <strong>recriar as cobranças pendentes</strong> com os novos dados?
                </p>
                <p className="text-xs text-muted-foreground">
                  Cobranças já pagas não serão afetadas.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => handleConfirmFeeChange(false)}>
              Não, manter cobranças
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => handleConfirmFeeChange(true)}>
              Sim, recriar cobranças
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Patients;
