import { Link } from "react-router-dom";
import { ArrowLeft, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CostCentersManager } from "@/components/registrations/CostCentersManager";
import { useCostCenters } from "@/hooks/useCostCenters";

export default function CentrosDeCusto() {
  const { costCenters, addCostCenter, updateCostCenter, deleteCostCenter } = useCostCenters();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="container mx-auto flex items-center gap-4 px-4 py-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Settings2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Centros de Custo</h1>
            <p className="text-xs text-muted-foreground">Gerenciamento de Cadastros</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <CostCentersManager
            costCenters={costCenters}
            onAdd={addCostCenter}
            onUpdate={updateCostCenter}
            onDelete={deleteCostCenter}
          />
        </div>
      </main>
    </div>
  );
}
