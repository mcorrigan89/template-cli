import { AppLayout } from '@/components/sidebar/app-layout';
import { orpc } from '@/lib/api-client';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard')({
  component: RouteComponent,
  beforeLoad: async ({ context }) => {
    const currentUser = await context.queryClient.fetchQuery(orpc.currentUser.me.queryOptions());
    if (!currentUser) {
      throw redirect({
        to: '/login',
      });
    }
    await Promise.all([
      context.queryClient.prefetchQuery(orpc.organization.list.queryOptions()),
      context.queryClient.prefetchQuery(orpc.organization.getActive.queryOptions()),
    ]);
  },
});

function RouteComponent() {
  return (
    <>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </>
  );
}
