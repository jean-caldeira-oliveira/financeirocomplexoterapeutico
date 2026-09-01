import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useBudgetQuotes } from "@/hooks/useBudgetQuotes";
import { exportBudgetQuotePDF } from "@/utils/exportBudgetQuotePDF";
import { RoomType, roomTypeLabels } from "@/types/budgetQuote";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileDown } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const budgetQuoteSchema = z.object({
  patientName: z.string().min(2, "Informe o nome do acolhido"),
  patientDocument: z.string().optional(),
  patientBirthDate: z.string().optional(),
  guardianName: z.string().min(2, "Informe o nome do responsável"),
  guardianDocument: z.string().optional(),
  guardianPhone: z.string().optional(),
  roomType: z.enum(["coletivo", "semi_privativo", "privativo"] as [RoomType, ...RoomType[]]),
  enrollmentFee: z.coerce.number().min(0, "Valor inválido"),
  monthlyFee: z.coerce.number().min(0, "Valor inválido"),
  psychiatricFollowup: z.boolean(),
  periodMonths: z.string().optional(),
  validityDays: z.coerce.number().min(1, "Informe a validade"),
  notes: z.string().optional(),
});

type BudgetQuoteFormData = z.infer<typeof budgetQuoteSchema>;

const defaultValues: BudgetQuoteFormData = {
  patientName: "",
  patientDocument: "",
  patientBirthDate: "",
  guardianName: "",
  guardianDocument: "",
  guardianPhone: "",
  roomType: "coletivo",
  enrollmentFee: 2500,
  monthlyFee: 2500,
  psychiatricFollowup: false,
  periodMonths: "",
  validityDays: 30,
  notes: "",
};

export function BudgetQuoteForm() {
  const { createQuote } = useBudgetQuotes();
  const form = useForm<BudgetQuoteFormData>({
    resolver: zodResolver(budgetQuoteSchema),
    defaultValues,
  });

  const handleSubmit = async (data: BudgetQuoteFormData) => {
    try {
      const quote = await createQuote.mutateAsync(data);
      await exportBudgetQuotePDF(quote);
      form.reset(defaultValues);
    } catch {
      toast.error("Não foi possível gerar o PDF do orçamento");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div>
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
            Dados do Paciente e Responsável
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="patientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Acolhido</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="patientDocument"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF do Acolhido</FormLabel>
                  <FormControl>
                    <Input placeholder="000.000.000-00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="patientBirthDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Nascimento</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="guardianName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Responsável / Contratante</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="guardianDocument"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF do Responsável</FormLabel>
                  <FormControl>
                    <Input placeholder="000.000.000-00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="guardianPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone do Responsável</FormLabel>
                  <FormControl>
                    <Input placeholder="(00) 00000-0000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
            Modalidade de Acomodação e Investimento
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="roomType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modalidade</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Object.keys(roomTypeLabels) as RoomType[]).map((type) => (
                        <SelectItem key={type} value={type}>
                          {roomTypeLabels[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="periodMonths"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Período Previsto (meses)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex.: 6" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="enrollmentFee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Matrícula (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="monthlyFee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensalidade (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="validityDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Validade da Proposta (dias)</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="psychiatricFollowup"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
                  <FormLabel className="cursor-pointer font-normal">
                    Acompanhamento Psiquiátrico (+R$ 500,00/mês)
                  </FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea placeholder="Observações adicionais para a proposta" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={createQuote.isPending}>
            <FileDown className="mr-2 h-4 w-4" />
            {createQuote.isPending ? "Gerando..." : "Gerar Orçamento em PDF"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
