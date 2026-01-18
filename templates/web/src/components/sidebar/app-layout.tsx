import { Separator } from '@template/ui/components/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@template/ui/components/sidebar';
import { AppSidebar } from './app-sidebar';
import { routeList } from './route-list';
import { TopBreadcrumbs } from './top-breacrumbs';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar routeList={routeList} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2" />
          <TopBreadcrumbs routeList={routeList} />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
