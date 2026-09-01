import { Button } from "@/components/ui/button";
import { OccupancyRetentionDashboard } from "@/components/commercial/OccupancyRetentionDashboard";
import { ArrowLeft, LayoutDashboard } from "lucide-react";
import { Link } from "react-router-dom";

export default function DashboardComercial() {
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
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Dashboard Comercial</h1>
              <p className="text-xs text-muted-foreground">
                Ocupação, previsão de saída e retenção
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <OccupancyRetentionDashboard />
      </main>
    </div>
  );
}
