import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/subscriptions-demo')({
  component: SubscriptionsDemo,
});

function SubscriptionsDemo() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="mb-8 text-3xl font-bold">Real-Time Subscriptions Demo</h1>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
        <h2 className="mb-3 text-xl font-semibold text-blue-900">Global Notifications</h2>
        <p className="mb-3 text-blue-800">
          The app automatically subscribes to real-time notifications at the root level. Watch for
          toast notifications appearing in the top-right corner every 10 seconds.
        </p>
        <div className="mt-4 space-y-2 rounded bg-blue-100 p-4">
          <h3 className="font-semibold text-blue-900">How it works:</h3>
          <ul className="list-inside list-disc space-y-1 text-sm text-blue-800">
            <li>
              <strong>Server-Sent Events (SSE)</strong> - The server streams notifications using
              ORPC event iterators
            </li>
            <li>
              <strong>TanStack Query</strong> - The client uses{' '}
              <code className="rounded bg-blue-200 px-1">experimental_liveOptions</code> with{' '}
              <code className="rounded bg-blue-200 px-1">useQuery</code>
            </li>
            <li>
              <strong>Automatic Reconnection</strong> - If the connection drops, TanStack Query
              automatically reconnects
            </li>
            <li>
              <strong>Sonner Toasts</strong> - Notifications are displayed as toasts with different
              styles based on type
            </li>
          </ul>
        </div>
        <div className="mt-4 rounded bg-white p-4">
          <h3 className="mb-2 font-semibold text-blue-900">Implementation:</h3>
          <p className="mb-2 text-sm text-blue-800">
            Check <code className="rounded bg-gray-100 px-1">src/components/NotificationSubscriber.tsx</code>{' '}
            to see how the subscription is set up.
          </p>
          <p className="text-sm text-blue-800">
            The component is rendered in the root layout (<code className="rounded bg-gray-100 px-1">src/routes/__root.tsx</code>)
            so notifications work throughout the entire app.
          </p>
        </div>
      </div>
    </div>
  );
}
