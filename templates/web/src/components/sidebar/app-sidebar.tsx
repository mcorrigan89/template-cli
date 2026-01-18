import * as React from 'react';

import { orpc } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@template/ui/components/sidebar';
import { cn } from '@template/ui/lib/utils';
import { LucideGitGraph } from 'lucide-react';
import { OrganizationSwitcher } from './nav-organizations';
import { NavUser } from './nav-user';
import { RouteMenu } from './route-list';

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  routeList: RouteMenu;
}

export function AppSidebar({ routeList, ...props }: AppSidebarProps) {
  const { data: currentUser } = useQuery(orpc.auth.currentUser.queryOptions());
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <OrganizationSwitcher
          organizations={[
            {
              name: 'Acme Corp.',
              plan: 'Enterprise',
              logo: LucideGitGraph,
            },
          ]}
        />
        {/* <SearchForm /> */}
      </SidebarHeader>
      <SidebarContent>
        {/* We create a SidebarGroup for each parent. */}
        {routeList.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.routes
                  .filter((route) => route.showInSidebar)
                  .map((route) => (
                    <SidebarMenuItem key={route.title}>
                      <SidebarMenuButton
                        render={
                          <Link
                            to={route.route}
                            activeOptions={{
                              exact: true,
                            }}
                            activeProps={{
                              className: cn('text-sidebar-accent-foreground bg-sidebar-accent'),
                            }}
                          >
                            {route.title}
                          </Link>
                        }
                      />
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: currentUser?.name || 'Guest',
            email: currentUser?.email || '',
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
