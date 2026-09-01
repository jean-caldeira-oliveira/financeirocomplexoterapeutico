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
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import {
  BarChart3,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Megaphone,
  Receipt,
  ScrollText,
  Shield,
  Truck,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/pacientes", label: "Pacientes", icon: Users },
  { to: "/cobrancas", label: "Cobranças", icon: Receipt },
  { to: "/contas", label: "Contas", icon: FileText },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3, badge: "Em Refinamento" },
  { to: "/fornecedores", label: "Fornecedores", icon: Truck, badge: "Em construção" },
  { to: "/colaboradores", label: "Colaboradores", icon: UserCog, badge: "Em construção" },
  { to: "/orcamento", label: "Orçamento", icon: Wallet, badge: "Em construção" },
  { to: "/marketing", label: "Marketing", icon: Megaphone, badge: "Em construção" },
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
            <p className="truncate text-sm font-bold">CONTROLE DE CAIXA</p>
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
              {navItems.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.to}
                    tooltip={item.label}
                  >
                    <Link to={item.to}>
                      <item.icon />
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto whitespace-nowrap rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white group-data-[collapsible=icon]:hidden">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
