import { orpc } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({ component: HomePage });

function HomePage() {
  const { data } = useQuery(
    orpc.helloworld.queryOptions({
      input: {},
    })
  );
  return <div className="min-h-screen bg-background">{data}</div>;
}
