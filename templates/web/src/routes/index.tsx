import { orpc } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
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
      <Link to="/login">Login</Link> | <Link to="/signup">Sign Up</Link>
      <div className="flex flex-col items-center justify-center py-20">
        <h1 className="mb-4 text-4xl font-bold">Welcome to the Home Page</h1>
        <p className="mb-8 text-lg">Message from server: {data}</p>
        <Button onClick={handleButtonClick}>Click Me</Button>
      </div>
    </div>
  );
}
