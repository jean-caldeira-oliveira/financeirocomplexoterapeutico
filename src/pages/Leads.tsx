import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Contact, Filter, Search } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { usePatients } from "@/hooks/usePatients";
import { usePagination } from "@/hooks/usePagination";
import { wardLabels, Ward } from "@/types/transaction";
import { format, isValid } from "date-fns";

type StatusFilter = "all" | "active" | "inactive";
type WardFilter = "all" | Ward;

export default function Leads() {
  const { patients } = usePatients();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [wardFilter, setWardFilter] = useState<WardFilter>("all");
  const [referralFilter, setReferralFilter] = useState<string>("all");

  const referralOptions = useMemo(() => {
    const sources = new Set(patients.map((p) => p.referralSource).filter(Boolean));
    return Array.from(sources).sort();
  }, [patients]);

  const leads = useMemo(() => {
    return patients
      .filter((p) => {
        const statusMatch =
          statusFilter === "all" ||
          (statusFilter === "active" && p.active) ||
          (statusFilter === "inactive" && !p.active);
        const wardMatch = wardFilter === "all" || p.ward === wardFilter;
        const referralMatch =
          referralFilter === "all" || p.referralSource === referralFilter;
        const query = searchQuery.trim().toLowerCase();
        const searchMatch =
          query === "" ||
          p.name.toLowerCase().includes(query) ||
          p.guardianName.toLowerCase().includes(query) ||
          p.guardianContact.toLowerCase().includes(query);
        return statusMatch && wardMatch && referralMatch && searchMatch;
      })
      .sort((a, b) => a.guardianName.localeCompare(b.guardianName));
  }, [patients, statusFilter, wardFilter, referralFilter, searchQuery]);

  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    pageCount,
    paginatedItems: paginatedLeads,
  } = usePagination(leads, 25);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (!isValid(date)) return "-";
    return format(date, "dd/MM/yyyy");
  };

  const activeCount = patients.filter((p) => p.active).length;
  const inactiveCount = patients.filter((p) => !p.active).length;

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
              <Contact className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Leads</h1>
              <p className="text-xs text-muted-foreground">
                Contatos de familiares/responsáveis de pacientes
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="gap-2 py-2">
              <span className="font-normal text-muted-foreground">
                Pacientes ativos:
              </span>
              <span className="font-bold">{activeCount}</span>
            </Badge>
            <Badge variant="outline" className="gap-2 py-2">
              <span className="font-normal text-muted-foreground">
                Pacientes inativos:
              </span>
              <span className="font-bold">{inactiveCount}</span>
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar nome, responsável ou telefone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[240px] pl-8"
              />
            </div>

            <Filter className="h-4 w-4 text-muted-foreground" />

            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={wardFilter} onValueChange={(v) => setWardFilter(v as WardFilter)}>
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

            <Select value={referralFilter} onValueChange={setReferralFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Encaminhamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Encaminhamentos</SelectItem>
                {referralOptions.map((source) => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm">
          {leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Contact className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">Nenhum contato encontrado</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Tente ajustar os filtros
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Ala</TableHead>
                  <TableHead>Encaminhamento</TableHead>
                  <TableHead>Entrada</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLeads.map((p) => (
                  <TableRow key={p.id} className={!p.active ? "opacity-60" : ""}>
                    <TableCell>
                      <Badge
                        className={
                          p.active
                            ? "bg-green-500 text-white hover:bg-green-600"
                            : "bg-red-500 text-white hover:bg-red-600"
                        }
                      >
                        {p.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {p.guardianName || "-"}
                    </TableCell>
                    <TableCell>{p.guardianContact || "-"}</TableCell>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          p.ward === "feminina"
                            ? "bg-pink-500 text-white hover:bg-pink-600"
                            : "bg-blue-500 text-white hover:bg-blue-600"
                        }
                      >
                        {wardLabels[p.ward]}
                      </Badge>
                    </TableCell>
                    <TableCell>{p.referralSource || "-"}</TableCell>
                    <TableCell>{formatDate(p.entryDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <TablePagination
            page={page}
            pageCount={pageCount}
            pageSize={pageSize}
            totalItems={leads.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </main>
    </div>
  );
}
