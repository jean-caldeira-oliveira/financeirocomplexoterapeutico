import { format } from 'date-fns';
import { Patient, wardLabels } from '@/types/transaction';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface PatientDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient | null;
}

export function PatientDetailsDialog({ open, onOpenChange, patient }: PatientDetailsDialogProps) {
  if (!patient) return null;

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {patient.name}
            <Badge variant={patient.ward === 'feminina' ? 'secondary' : 'outline'}>
              Ala {wardLabels[patient.ward]}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Data de Entrada</p>
              <p className="font-medium">{formatDate(patient.entryDate)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Dia de Vencimento</p>
              <p className="font-medium">Dia {patient.dueDay}</p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Mensalidade</p>
              <p className="font-medium text-lg">{formatCurrency(patient.monthlyFee)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Parcelas</p>
              <p className="font-medium">{patient.installments}x</p>
            </div>
          </div>

          {patient.hasEnrollmentFee && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="text-muted-foreground">Taxa de Adesão</p>
              <p className="font-medium">{formatCurrency(patient.enrollmentFee)}</p>
            </div>
          )}

          <Separator />

          <div className="space-y-3 text-sm">
            <h4 className="font-semibold">Responsável</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground">Nome</p>
                <p className="font-medium">{patient.guardianName || '-'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Contato</p>
                <p className="font-medium">{patient.guardianContact || '-'}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="text-sm">
            <p className="text-muted-foreground">Encaminhado por</p>
            <p className="font-medium">{patient.referralSource || '-'}</p>
          </div>

          <div className="text-xs text-muted-foreground">
            Cadastrado em {formatDate(patient.createdAt)}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
