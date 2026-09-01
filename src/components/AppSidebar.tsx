import logo from "@/assets/logo.png";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAuth } from "@/hooks/useAuth";
import { useInvoices } from "@/hooks/useInvoices";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { usePatients } from "@/hooks/usePatients";
import { isContractFinished } from "@/utils/patientContract";
import { useMemo, useState } from "react";
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarRange,
  ChevronRight,
  ClipboardList,
  Clock,
  Contact,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Megaphone,
  Plane,
  Receipt,
  Scale,
  ScrollText,
  Shield,
  Shirt,
  Truck,
  UserCog,
  Users,
  Users2,
  UtensilsCrossed,
  Wallet,
  Wallet2,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavEntry extends NavItem {
  subItems?: NavItem[];
}

const navItems: NavEntry[] = [
  {
    to: "/financeiro",
    label: "Financeiro",
    icon: Wallet2,
    subItems: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard },
      { to: "/pacientes", label: "Pacientes", icon: Users },
      { to: "/cobrancas", label: "Cobranças", icon: Receipt },
      { to: "/contas", label: "Contas", icon: FileText },
      { to: "/fornecedores", label: "Fornecedores", icon: Truck },
      { to: "/colaboradores", label: "Colaboradores", icon: UserCog },
    ],
  },
  {
    to: "/comercial",
    label: "Comercial",
    icon: BriefcaseBusiness,
    subItems: [
      { to: "/comercial/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/orcamento", label: "Orçamentos", icon: Wallet },
      { to: "/marketing", label: "Marketing", icon: Megaphone, badge: "Em construção" },
      { to: "/comercial/leads", label: "Leads", icon: Contact },
    ],
  },
  { to: "/juridico", label: "Jurídico", icon: Scale, badge: "Em construção" },
  { to: "/rh", label: "RH", icon: Users2, badge: "Em construção" },
  { to: "/rh/dashboard", label: "Dashboard", icon: LayoutDashboard, badge: "Em construção" },
  { to: "/rh/colaboradores", label: "Colaboradores", icon: UserCog, badge: "Em construção" },
  { to: "/rh/escala", label: "Escala", icon: CalendarRange, badge: "Em construção" },
  { to: "/rh/ferias-ausencias", label: "Férias e Ausências", icon: Plane, badge: "Em construção" },
  { to: "/rh/ponto-jornada", label: "Ponto e Jornada", icon: Clock, badge: "Em construção" },
  { to: "/rh/acompanhamentos", label: "Acompanhamentos", icon: ClipboardList, badge: "Em construção" },
  { to: "/rh/treinamentos", label: "Treinamentos", icon: GraduationCap, badge: "Em construção" },
  { to: "/rh/banco-de-talentos", label: "Banco de Talentos", icon: Users, badge: "Em construção" },
  { to: "/lavanderia", label: "Lavanderia", icon: Shirt, badge: "Em construção" },
  { to: "/cantina", label: "Cantina", icon: UtensilsCrossed, badge: "Em construção" },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3, badge: "Em Refinamento" },
];

const supportNavItems = [
  { to: "/suporte", label: "Suporte", icon: LifeBuoy },
];

const adminNavItems = [
  { to: "/admin", label: "Admin", icon: Shield },
  { to: "/logs", label: "Logs", icon: ScrollText },
];

export function AppSidebar() {
  const { signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const location = useLocation();
  const { patients } = usePatients();
  const { invoices } = useInvoices();

  const noContractCount = useMemo(
    () => patients.filter((p) => isContractFinished(p, invoices)).length,
    [patients, invoices]
  );

  const groupsWithActiveSubItem = useMemo(
    () =>
      new Set(
        navItems
          .filter((item) =>
            item.subItems?.some((sub) => location.pathname === sub.to)
          )
          .map((item) => item.to)
      ),
    [location.pathname]
  );

  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () => new Set(groupsWithActiveSubItem)
  );

  const isGroupOpen = (to: string) =>
    openGroups.has(to) || groupsWithActiveSubItem.has(to);

  const toggleGroup = (to: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(to)) next.delete(to);
      else next.add(to);
      return next;
    });
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/" className="flex items-center gap-3 px-2 py-2">
          <img
            src={logo}
            alt="Complexo Terapêutico"
            className="h-10 w-auto shrink-0"
            width="40"
            height="40"
          />
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-bold">SISTEMA ADMINISTRATIVO</p>
            <p className="truncate text-xs text-sidebar-foreground/70">
              COMPLEXO TERAPÊUTICO
            </p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                if (item.subItems) {
                  const open = isGroupOpen(item.to);
                  const hasActiveSub = groupsWithActiveSubItem.has(item.to);
                  return (
                    <Collapsible
                      key={item.to}
                      open={open}
                      onOpenChange={() => toggleGroup(item.to)}
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            isActive={hasActiveSub}
                            tooltip={item.label}
                          >
                            <item.icon />
                            <span>{item.label}</span>
                            <ChevronRight
                              className={`ml-auto h-4 w-4 shrink-0 transition-transform duration-200 group-data-[collapsible=icon]:hidden ${
                                open ? "rotate-90" : ""
                              }`}
                            />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.subItems.map((sub) => (
                              <SidebarMenuSubItem key={sub.to}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={location.pathname === sub.to}
                                >
                                  <Link to={sub.to}>
                                    <sub.icon />
                                    <span>{sub.label}</span>
                                    {sub.to === "/pacientes" && noContractCount > 0 && (
                                      <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
                                        {noContractCount}
                                      </span>
                                    )}
                                    {sub.badge && (
                                      <span
                                        className={`ml-auto whitespace-nowrap rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white ${
                                          sub.badge === "Em construção" ? "bg-blue-500" : "bg-orange-500"
                                        }`}
                                      >
                                        {sub.badge}
                                      </span>
                                    )}
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }

                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.to}
                      tooltip={item.label}
                    >
                      <Link to={item.to}>
                        <item.icon />
                        <span>{item.label}</span>
                        {item.to === "/pacientes" && noContractCount > 0 && (
                          <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white group-data-[collapsible=icon]:hidden">
                            {noContractCount}
                          </span>
                        )}
                        {item.badge && (
                          <span
                            className={`ml-auto whitespace-nowrap rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white group-data-[collapsible=icon]:hidden ${
                              item.badge === "Em construção" ? "bg-blue-500" : "bg-orange-500"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {supportNavItems.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.to}
                    tooltip={item.label}
                  >
                    <Link to={item.to}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavItems.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.to}
                      tooltip={item.label}
                    >
                      <Link to={item.to}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} tooltip="Sair">
              <LogOut />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
