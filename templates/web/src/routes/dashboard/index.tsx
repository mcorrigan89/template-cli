import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button } from '@template/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@template/ui/components/card';

import { orpc } from '@/lib/api-client';
import { signOut } from '@/lib/auth-client';
import { useQuery } from '@tanstack/react-query';

export const Route = createFileRoute('/dashboard/')({
  component: DashboardPage,
  beforeLoad: async ({ context }) => {
    await context.queryClient.prefetchQuery(orpc.auth.currentUser.queryOptions());
  },
});

function DashboardPage() {
  const navigate = useNavigate();
  const { data: currentUser, isLoading } = useQuery(orpc.auth.currentUser.queryOptions());

  async function handleSignOut() {
    await signOut();
    navigate({ to: '/login' });
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!currentUser?.session) {
    navigate({ to: '/login' });
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {currentUser.name}</p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="text-sm text-muted-foreground">Name:</span>
                <p className="font-medium">{currentUser.name}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Email:</span>
                <p className="font-medium">{currentUser.email}</p>
              </div>
              {currentUser.emailVerified && (
                <div>
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    Email verified
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Session</CardTitle>
              <CardDescription>Current session details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="text-sm text-muted-foreground">Session ID:</span>
                <p className="font-mono text-xs">{currentUser.session.id}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Created:</span>
                <p className="text-sm">
                  {new Date(currentUser.session.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Expires:</span>
                <p className="text-sm">
                  {new Date(currentUser.session.expiresAt).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">User-Agent:</span>
                <p className="text-sm">{currentUser.session.userAgent}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">IP Address:</span>
                <p className="text-sm">{currentUser.session.ipAddress}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
