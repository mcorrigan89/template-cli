import { orpc } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';

/**
 * NotificationSubscriber component
 *
 * Subscribes to real-time notifications from the server and displays them as toasts.
 * This component should be rendered once at the app root level.
 *
 * Uses ORPC's experimental_liveOptions with TanStack Query to consume the event iterator.
 */
export function NotificationSubscriber() {
  // Subscribe to notifications using ORPC's experimental_liveOptions
  const { data: notification } = useQuery({
    ...orpc.subscriptions.notifications.experimental_liveOptions({
      input: {},
    }),
    enabled: typeof window !== 'undefined', // Only run on client
    refetchInterval: false,
    retry: true,
  });

  // Display toast when new notification arrives
  useEffect(() => {
    if (!notification) {
      return;
    }

    console.log('Received notification:', notification);

    // Display toast based on notification type
    switch (notification.type) {
      case 'success':
        toast.success(notification.message, {
          description: new Date(notification.timestamp).toLocaleTimeString(),
        });
        break;
      case 'error':
        toast.error(notification.message, {
          description: new Date(notification.timestamp).toLocaleTimeString(),
        });
        break;
      case 'warning':
        toast.warning(notification.message, {
          description: new Date(notification.timestamp).toLocaleTimeString(),
        });
        break;
      case 'info':
      default:
        toast.info(notification.message, {
          description: new Date(notification.timestamp).toLocaleTimeString(),
        });
        break;
    }
  }, [notification]);

  // This component doesn't render anything
  return null;
}
