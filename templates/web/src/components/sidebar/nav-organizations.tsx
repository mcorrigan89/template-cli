'use client';

import { orpc } from '@/lib/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@template/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@template/ui/components/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@template/ui/components/dropdown-menu';
import { Input } from '@template/ui/components/input';
import { Label } from '@template/ui/components/label';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  useSidebar,
} from '@template/ui/components/sidebar';
import { Building2, Check, ChevronsUpDown, Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function OrganizationSwitcher() {
  const { isMobile } = useSidebar();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgSlug, setNewOrgSlug] = useState('');

  const { data: organizations, isLoading: isLoadingOrgs } = useQuery(
    orpc.organization.list.queryOptions()
  );

  const { data: activeOrg, isLoading: isLoadingActive } = useQuery(
    orpc.organization.getActive.queryOptions()
  );

  const setActiveMutation = useMutation(
    orpc.organization.setActive.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.organization.getActive.queryKey() });
        toast.success('Switched organization');
      },
      onError: (error) => {
        toast.error('Failed to switch organization', { description: error.message });
      },
    })
  );

  const createMutation = useMutation(
    orpc.organization.create.mutationOptions({
      onSuccess: (newOrg) => {
        queryClient.invalidateQueries({ queryKey: orpc.organization.list.queryKey() });
        // Set the new org as active
        setActiveMutation.mutate({ organizationId: newOrg.id });
        setIsCreateDialogOpen(false);
        setNewOrgName('');
        setNewOrgSlug('');
        toast.success('Organization created');
      },
      onError: (error) => {
        toast.error('Failed to create organization', { description: error.message });
      },
    })
  );

  const handleSwitchOrg = (orgId: string) => {
    if (activeOrg?.id === orgId) return;
    setActiveMutation.mutate({ organizationId: orgId });
  };

  const handleCreateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim() || !newOrgSlug.trim()) return;
    createMutation.mutate({
      name: newOrgName.trim(),
      slug: newOrgSlug.trim().toLowerCase().replace(/\s+/g, '-'),
    });
  };

  const handleNameChange = (value: string) => {
    setNewOrgName(value);
    // Auto-generate slug from name
    setNewOrgSlug(value.toLowerCase().replace(/\s+/g, '-'));
  };

  if (isLoadingOrgs || isLoadingActive) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuSkeleton showIcon />
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuGroup>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                      <Building2 className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">
                        {activeOrg?.name ?? 'No organization'}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {activeOrg?.slug ?? 'Select an organization'}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto" />
                  </SidebarMenuButton>
                }
              />
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                align="start"
                side={isMobile ? 'bottom' : 'right'}
                sideOffset={4}
              >
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Organizations
                </DropdownMenuLabel>
                {organizations && organizations.length > 0 ? (
                  organizations.map((org) => (
                    <DropdownMenuItem
                      key={org.id}
                      onClick={() => handleSwitchOrg(org.id)}
                      className="gap-2 p-2"
                    >
                      <div className="flex size-6 items-center justify-center rounded-md border">
                        <Building2 className="size-3.5 shrink-0" />
                      </div>
                      <span className="flex-1 truncate">{org.name}</span>
                      {activeOrg?.id === org.id && <Check className="size-4 text-primary" />}
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                    No organizations yet
                  </div>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 p-2" onClick={() => setIsCreateDialogOpen(true)}>
                  <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                    <Plus className="size-4" />
                  </div>
                  <div className="font-medium text-muted-foreground">Create organization</div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenuGroup>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create organization</DialogTitle>
            <DialogDescription>
              Create a new organization to collaborate with your team.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateOrg} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Name</Label>
              <Input
                id="org-name"
                placeholder="Acme Inc."
                value={newOrgName}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-slug">Slug</Label>
              <Input
                id="org-slug"
                placeholder="acme-inc"
                value={newOrgSlug}
                onChange={(e) => setNewOrgSlug(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                This will be used in URLs and must be unique.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
