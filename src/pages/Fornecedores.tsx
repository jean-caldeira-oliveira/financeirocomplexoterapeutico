import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, Settings2, Truck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SupplierForm } from "@/components/suppliers/SupplierForm";
import { SupplierTable } from "@/components/suppliers/SupplierTable";
import { ChartOfAccountsDialog } from "@/components/registrations/ChartOfAccountsDialog";
import { CostCentersDialog } from "@/components/registrations/CostCentersDialog";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";
import { useCostCenters } from "@/hooks/useCostCenters";
import { Supplier } from "@/types/supplier";

type StatusFilter = "all" | "ativo" | "inativo";

export default function Fornecedores() {
  const { suppliers, addSupplier, updateSupplier, toggleSupplierStatus, deleteSupplier } =
    useSuppliers();
  const { accounts, activeAccounts, addAccount, updateAccount, deleteAccount } =
    useChartOfAccounts();
  const { costCenters, activeCostCenters, addCostCenter, updateCostCenter, deleteCostCenter } =
    useCostCenters();

  const [formOpen, setFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [accountsDialogOpen, setAccountsDialogOpen] = useState(false);
  const [costCentersDialogOpen, setCostCentersDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ativo");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const statusMatch = statusFilter === "all" || s.status === statusFilter;
      const searchMatch =
        searchQuery.trim() === "" ||
        s.legalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.tradeName ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.document.includes(searchQuery.replace(/\D/g, ""));
      return statusMatch && searchMatch;
    });
  }, [suppliers, statusFilter, searchQuery]);

  const isDocumentTaken = (document: string, excludeId?: string) =>
    suppliers.some((s) => s.id !== excludeId && s.document === document);

  const handleAdd = async (data: Parameters<typeof addSupplier>[0]) => {
    try {
      await addSupplier(data);
      setFormOpen(false);
    } catch {
      // erro já tratado no hook
    }
  };

  const handleEdit = async (data: Parameters<typeof updateSupplier>[1]) => {
    if (!editingSupplier) return;
    const success = await updateSupplier(editingSupplier.id, data);
    if (success) setEditingSupplier(null);
  };

  const activeCount = suppliers.filter((s) => s.status === "ativo").length;
  const inactiveCount = suppliers.filter((s) => s.status === "inativo").length;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Fornecedores</h1>
              <p className="text-xs text-muted-foreground">Gerenciamento de Cadastros</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button className="gap-2" onClick={() => setFormOpen(true)}>
              <UserPlus className="h-5 w-5" />
              Novo Fornecedor
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="gap-2 py-2">
              <span className="font-normal text-muted-foreground">Ativos:</span>
              <span className="font-bold">{activeCount}</span>
            </Badge>
            <Badge variant="outline" className="gap-2 py-2">
              <span className="font-normal text-muted-foreground">Inativos:</span>
              <span className="font-bold">{inactiveCount}</span>
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou documento..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[220px] pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="inativo">Inativos</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setAccountsDialogOpen(true)}
            >
              <Settings2 className="h-4 w-4" />
              Plano de Contas
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setCostCentersDialogOpen(true)}
            >
              <Settings2 className="h-4 w-4" />
              Centros de Custo
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm">
          {filteredSuppliers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <UserPlus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">
                {suppliers.length === 0 ? "Nenhum fornecedor cadastrado" : "Nenhum fornecedor encontrado"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {suppliers.length === 0
                  ? 'Clique em "Novo Fornecedor" para começar'
                  : "Tente ajustar os filtros"}
              </p>
            </div>
          ) : (
            <SupplierTable
              suppliers={filteredSuppliers}
              accounts={accounts}
              costCenters={costCenters}
              onEdit={setEditingSupplier}
              onToggleStatus={toggleSupplierStatus}
              onDelete={deleteSupplier}
            />
          )}
        </div>
      </main>

      <SupplierForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleAdd}
        mode="create"
        accounts={activeAccounts}
        costCenters={activeCostCenters}
        onManageAccounts={() => setAccountsDialogOpen(true)}
        onManageCostCenters={() => setCostCentersDialogOpen(true)}
        isDocumentTaken={isDocumentTaken}
      />

      <SupplierForm
        open={!!editingSupplier}
        onOpenChange={(open) => !open && setEditingSupplier(null)}
        onSubmit={handleEdit}
        initialData={editingSupplier || undefined}
        mode="edit"
        accounts={activeAccounts}
        costCenters={activeCostCenters}
        onManageAccounts={() => setAccountsDialogOpen(true)}
        onManageCostCenters={() => setCostCentersDialogOpen(true)}
        isDocumentTaken={isDocumentTaken}
      />

      <ChartOfAccountsDialog
        open={accountsDialogOpen}
        onOpenChange={setAccountsDialogOpen}
        accounts={accounts}
        onAdd={addAccount}
        onUpdate={updateAccount}
        onDelete={deleteAccount}
      />

      <CostCentersDialog
        open={costCentersDialogOpen}
        onOpenChange={setCostCentersDialogOpen}
        costCenters={costCenters}
        onAdd={addCostCenter}
        onUpdate={updateCostCenter}
        onDelete={deleteCostCenter}
      />
    </div>
  );
}
