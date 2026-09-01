import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { LifeBuoy, Send } from 'lucide-react';

const ticketTypeOptions = [
  { value: 'nova-funcionalidade', label: 'Nova Funcionalidade' },
  { value: 'correcao-bug', label: 'Correção de Bug' },
  { value: 'duvida', label: 'Dúvida' },
  { value: 'ajuste', label: 'Ajuste' },
];

const severityOptions = [
  { value: 'bloqueio', label: 'Bloqueio' },
  { value: 'alta', label: 'Alta Prioridade' },
  { value: 'media', label: 'Média Prioridade' },
  { value: 'baixa', label: 'Baixa Prioridade' },
];

const tabOptions = [
  { value: 'geral', label: 'Geral / Outro' },
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'pacientes', label: 'Pacientes' },
  { value: 'cobrancas', label: 'Cobranças' },
  { value: 'contas', label: 'Contas' },
  { value: 'relatorios', label: 'Relatórios' },
  { value: 'admin', label: 'Admin' },
  { value: 'logs', label: 'Logs' },
];

export default function Support() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 px-4 py-6 backdrop-blur-lg">
        <div className="container mx-auto flex items-center gap-3 px-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <LifeBuoy className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Suporte</h1>
            <p className="text-sm text-muted-foreground">
              Abra um chamado para reportar um problema, tirar uma dúvida ou solicitar um ajuste
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle>Novo Chamado</CardTitle>
            <CardDescription>
              Preencha os campos abaixo para abrir um novo chamado de suporte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Tipo de Chamado</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {ticketTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Severidade</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a severidade" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {severityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Aba</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a aba relacionada" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {tabOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Descrição</Label>
              <p className="text-xs text-muted-foreground">
                Seja o mais detalhado possível: descreva o passo a passo para reproduzir o problema,
                explique claramente o que precisa ser feito ou detalhe sua dúvida. Quanto mais
                informação, mais rápido o chamado poderá ser resolvido.
              </p>
              <Textarea
                placeholder="Descreva aqui o passo a passo, a solicitação ou a dúvida..."
                rows={6}
                className="resize-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="button">
                <Send className="mr-2 h-4 w-4" />
                Enviar Chamado
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
