import { orpc } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Button } from '@template/ui/components/ui/button';

export const Route = createFileRoute('/')({ component: HomePage });

function HomePage() {
  const { data } = useQuery(
    orpc.helloworld.queryOptions({
      input: {},
    })
  );

  function handleButtonClick() {
    alert('Button clicked!');
  }

  return (
    <div className="min-h-screen bg-background">
      <div>{data}</div>
      <Button variant={'destructive'} onClick={handleButtonClick}>
        Button
      </Button>
    </div>
  );
}
