import { createFileRoute } from '@tanstack/react-router';

import { orpc } from '@/lib/api-client';
import { Avatar, AvatarFallback, AvatarImage } from '@template/ui/components/avatar';
import { Badge } from '@template/ui/components/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@template/ui/components/card';

export const Route = createFileRoute('/dashboard/')({
  component: DashboardPage,
  beforeLoad: async ({ context }) => {
    await context.queryClient.prefetchQuery(orpc.currentUser.me.queryOptions());
  },
});

const stats = [
  { title: 'Total Users', value: '2,847', change: '+12.5%', trend: 'up' },
  { title: 'Active Sessions', value: '1,234', change: '+8.2%', trend: 'up' },
  { title: 'Revenue', value: '$48,352', change: '+23.1%', trend: 'up' },
];

const recentActivity = [
  {
    id: 1,
    user: 'Sarah Chen',
    email: 'sarah@example.com',
    action: 'Created new project',
    time: '2 minutes ago',
    avatar: 'http://localhost:3000/media/seed-data/profile.jpeg',
  },
  {
    id: 2,
    user: 'Marcus Johnson',
    email: 'marcus@example.com',
    action: 'Updated billing info',
    time: '15 minutes ago',
    avatar: 'https://images.unsplash.com/photo-1570158268183-d296b2892211?q=80&w=987',
  },
  {
    id: 3,
    user: 'Emily Davis',
    email: 'emily@example.com',
    action: 'Invited team member',
    time: '1 hour ago',
    avatar: null,
  },
  {
    id: 4,
    user: 'Alex Rivera',
    email: 'alex@example.com',
    action: 'Upgraded to Pro plan',
    time: '3 hours ago',
    avatar: null,
  },
  {
    id: 5,
    user: 'Jordan Kim',
    email: 'jordan@example.com',
    action: 'Exported analytics report',
    time: '5 hours ago',
    avatar: null,
  },
];

const quickActions = [
  { title: 'Create Project', description: 'Start a new project from scratch' },
  { title: 'Invite Team', description: 'Add members to your workspace' },
  { title: 'View Reports', description: 'Access analytics and insights' },
  { title: 'Manage API Keys', description: 'Configure integrations' },
];

function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title} size="sm">
            <CardHeader className="pb-2">
              <CardDescription>{stat.title}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold">{stat.value}</span>
                <Badge variant="secondary" className="text-xs">
                  {stat.change}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions across your workspace</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-4 rounded-lg border border-border/50 bg-muted/30 p-3"
                >
                  <Avatar size="sm">
                    <AvatarImage src={activity.avatar ?? undefined} />
                    <AvatarFallback>
                      {activity.user
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{activity.user}</p>
                    <p className="truncate text-sm text-muted-foreground">{activity.action}</p>
                  </div>
                  <span className="text-xs whitespace-nowrap text-muted-foreground">
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {quickActions.map((action) => (
                <button
                  key={action.title}
                  className="w-full rounded-lg border border-border/50 bg-muted/30 p-3 text-left transition-colors hover:bg-muted/50"
                >
                  <p className="font-medium">{action.title}</p>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
