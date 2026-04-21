import { useState, useEffect, useCallback } from 'react';
import { format, setDate, addMonths } from 'date-fns';
import { CalendarIcon, Settings2 } from 'lucide-react';
import { Patient, Ward, wardLabels } from '@/types/transaction';
import { ReferralSource } from '@/hooks/useReferralSources';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface PatientFormData {
  name: string;
  entryDate: Date;
  dueDay: number;
  monthlyFee: number;
  installments: number;
  hasEnrollmentFee: boolean;
  enrollmentFee: number;
  enrollmentDueDate: Date;
  firstInstallmentDate: Date;
  guardianName: string;
  guardianContact: string;
  ward: Ward;
  referralSource: string;
  interestRateMonthly: number;
}

interface PatientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PatientFormData) => void;
  initialData?: Patient;
  mode: 'create' | 'edit';
  referralSources: ReferralSource[];
  onManageReferrals: () => void;
}

function getDefaultFormData(): PatientFormData {
  const now = new Date();
  const dueDay = 10;
  // Calculate first installment: next occurrence of dueDay after today
  const sameMonth = setDate(now, Math.min(dueDay, new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()));
  let firstInstallment: Date;
  if (sameMonth > now) {
    firstInstallment = sameMonth;
  } else {
    const nextMonth = addMonths(now, 1);
    const daysInNextMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
    firstInstallment = setDate(nextMonth, Math.min(dueDay, daysInNextMonth));
  }

  return {
    name: '',
    entryDate: now,
    dueDay,
    monthlyFee: 0,
    installments: 1,
    hasEnrollmentFee: false,
    enrollmentFee: 0,
    enrollmentDueDate: now,
    firstInstallmentDate: firstInstallment,
    guardianName: '',
    guardianContact: '',
    ward: 'masculina',
    referralSource: '',
    interestRateMonthly: 2,
  };
}

export function PatientForm({ open, onOpenChange, onSubmit, initialData, mode, referralSources, onManageReferrals }: PatientFormProps) {
  const [formData, setFormData] = useState<PatientFormData>(getDefaultFormData);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        entryDate: new Date(initialData.entryDate),
        dueDay: initialData.dueDay,
        monthlyFee: initialData.monthlyFee,
        installments: initialData.installments,
        hasEnrollmentFee: initialData.hasEnrollmentFee,
        enrollmentFee: initialData.enrollmentFee,
        enrollmentDueDate: initialData.enrollmentDueDate ? new Date(initialData.enrollmentDueDate) : new Date(initialData.entryDate),
        firstInstallmentDate: initialData.firstInstallmentDate ? new Date(initialData.firstInstallmentDate) : new Date(initialData.entryDate),
        guardianName: initialData.guardianName,
        guardianContact: initialData.guardianContact,
        ward: initialData.ward,
        referralSource: initialData.referralSource,
        interestRateMonthly: initialData.interestRateMonthly ?? 2,
      });
    } else {
      setFormData(getDefaultFormData());
    }
  }, [initialData, open]);

  const handleSubmit = () => {
    if (formData.name.trim()) {
      onSubmit(formData);
      setFormData(getDefaultFormData());
    }
  };

  // Calculate the next due day date after a given entry date
  const calcFirstInstallmentDate = useCallback((entryDate: Date, dueDay: number): Date => {
    // Try same month first
    const sameMonth = setDate(entryDate, Math.min(dueDay, new Date(entryDate.getFullYear(), entryDate.getMonth() + 1, 0).getDate()));
    if (sameMonth > entryDate) return sameMonth;
    // Otherwise next month
    const nextMonth = addMonths(entryDate, 1);
    const daysInNextMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
    return setDate(nextMonth, Math.min(dueDay, daysInNextMonth));
  }, []);

  const updateField = <K extends keyof PatientFormData>(key: K, value: PatientFormData[K]) => {
    setFormData(prev => {
      const next = { ...prev, [key]: value };

      // Auto-calculate dates only in create mode
      if (mode === 'create' && (key === 'entryDate' || key === 'dueDay')) {
        const entryDate = key === 'entryDate' ? (value as Date) : prev.entryDate;
        const dueDay = key === 'dueDay' ? (value as number) : prev.dueDay;
        next.enrollmentDueDate = entryDate;
        next.firstInstallmentDate = calcFirstInstallmentDate(entryDate, dueDay);
      }

      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Cadastrar Paciente' : 'Editar Paciente'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Nome completo */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo *</Label>
            <Input
              id="name"
              placeholder="Digite o nome completo"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
            />
          </div>

          {/* Ala */}
          <div className="space-y-2">
            <Label>Ala *</Label>
            <Select
              value={formData.ward}
              onValueChange={(value: Ward) => updateField('ward', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a ala" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(wardLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de Entrada *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.entryDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.entryDate ? format(formData.entryDate, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.entryDate}
                    onSelect={(date) => date && updateField('entryDate', date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDay">Dia de Vencimento *</Label>
              <Select
                value={(formData.dueDay || 10).toString()}
                onValueChange={(value) => updateField('dueDay', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o dia" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      Dia {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Valores e Parcelas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthlyFee">Valor da Mensalidade (R$) *</Label>
              <Input
                id="monthlyFee"
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={formData.monthlyFee || ''}
                onChange={(e) => updateField('monthlyFee', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="installments">Número de Parcelas *</Label>
              <Input
                id="installments"
                type="number"
                min="1"
                placeholder="1"
                value={formData.installments || ''}
                onChange={(e) => updateField('installments', parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          {/* Data da 1ª Mensalidade */}
          <div className="space-y-2">
            <Label>Data da 1ª Mensalidade *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.firstInstallmentDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.firstInstallmentDate ? format(formData.firstInstallmentDate, "dd/MM/yyyy") : "Selecione"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.firstInstallmentDate}
                  onSelect={(date) => date && updateField('firstInstallmentDate', date)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">As parcelas seguintes serão geradas mês a mês a partir desta data.</p>
          </div>

          {/* Taxa de Juros por Paciente */}
          <div className="space-y-2">
            <Label htmlFor="interestRateMonthly">Taxa de Juros Mensal (%)</Label>
            <Input
              id="interestRateMonthly"
              type="number"
              min="0"
              step="0.1"
              placeholder="2"
              value={formData.interestRateMonthly || ''}
              onChange={(e) => updateField('interestRateMonthly', parseFloat(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">Juros calculados pró-rata por dia de atraso sobre o saldo em aberto.</p>
          </div>

          {/* Taxa de Adesão */}
          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="hasEnrollmentFee">Tem taxa de adesão?</Label>
              <Switch
                id="hasEnrollmentFee"
                checked={formData.hasEnrollmentFee}
                onCheckedChange={(checked) => {
                  updateField('hasEnrollmentFee', checked);
                  if (!checked) updateField('enrollmentFee', 0);
                }}
              />
            </div>

            {formData.hasEnrollmentFee && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="enrollmentFee">Valor da Adesão (R$)</Label>
                  <Input
                    id="enrollmentFee"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.enrollmentFee || ''}
                    onChange={(e) => updateField('enrollmentFee', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vencimento da Adesão</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.enrollmentDueDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.enrollmentDueDate ? format(formData.enrollmentDueDate, "dd/MM/yyyy") : "Selecione"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.enrollmentDueDate}
                        onSelect={(date) => date && updateField('enrollmentDueDate', date)}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}
          </div>

          {/* Responsável */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="guardianName">Nome do Responsável</Label>
              <Input
                id="guardianName"
                placeholder="Nome do responsável"
                value={formData.guardianName}
                onChange={(e) => updateField('guardianName', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guardianContact">Contato do Responsável</Label>
              <Input
                id="guardianContact"
                placeholder="(00) 00000-0000"
                value={formData.guardianContact}
                onChange={(e) => updateField('guardianContact', e.target.value)}
              />
            </div>
          </div>

          {/* Encaminhamento */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Encaminhado por</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={onManageReferrals}
                    >
                      <Settings2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Gerenciar encaminhamentos</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select
              value={formData.referralSource}
              onValueChange={(value) => updateField('referralSource', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o encaminhamento" />
              </SelectTrigger>
              <SelectContent>
                {referralSources.length === 0 ? (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                    Nenhum encaminhamento cadastrado.
                    <br />
                    <Button
                      variant="link"
                      className="h-auto p-0"
                      onClick={onManageReferrals}
                    >
                      Clique aqui para adicionar
                    </Button>
                  </div>
                ) : (
                  referralSources.map((source) => (
                    <SelectItem key={source.id} value={source.name}>
                      {source.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSubmit}>
            {mode === 'create' ? 'Cadastrar' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
