import { AppSidebar } from "@/components/AppSidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="sticky top-0 z-40 flex items-center gap-2 border-b border-border bg-card/80 px-4 py-2 backdrop-blur-lg">
          <SidebarTrigger />
          <span className="text-sm font-medium text-muted-foreground">
            Menu
          </span>
        </div>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
