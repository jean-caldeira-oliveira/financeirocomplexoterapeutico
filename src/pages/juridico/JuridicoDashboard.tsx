import { LegalDashboard } from "@/components/legal/LegalDashboard";
import { Badge } from "@/components/ui/badge";
import { Scale } from "lucide-react";

export default function JuridicoDashboard() {
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <Scale className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Jurídico</h1>
        <Badge variant="secondary">Em construção</Badge>
      </div>

      <LegalDashboard />
    </div>
  );
}
