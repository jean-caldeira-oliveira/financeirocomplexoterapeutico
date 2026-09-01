import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Construction, type LucideIcon } from "lucide-react";

interface UnderConstructionProps {
  title: string;
  icon: LucideIcon;
}

export default function UnderConstruction({ title, icon: Icon }: UnderConstructionProps) {
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <Icon className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-2xl font-bold">{title}</h1>
        <Badge variant="secondary">Em construção</Badge>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
          <Construction className="h-10 w-10" />
          <p className="text-sm">Esta funcionalidade está em construção e estará disponível em breve.</p>
        </CardContent>
      </Card>
    </div>
  );
}
