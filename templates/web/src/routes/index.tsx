import { orpc } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Button } from '@template/ui/components/button';

export const Route = createFileRoute('/')({
  component: HomePage,
  loader: async ({ context }) => {
    const currentUser = await context.queryClient.fetchQuery(orpc.auth.currentUser.queryOptions());

    context.queryClient.ensureQueryData(
      orpc.helloworld.queryOptions({
        input: {
          name: currentUser?.name ? currentUser.name : undefined,
        },
      })
    );

    return { currentUser };
  },
});

function HomePage() {
  const { currentUser } = Route.useLoaderData();
  const { data } = useQuery(
    orpc.helloworld.queryOptions({
      input: {
        name: currentUser?.name ? currentUser.name : undefined,
      },
    })
  );

  function handleButtonClick() {
    alert('Button clicked!');
  }

  return (
    <div className="min-h-screen bg-background">
      {!currentUser ? (
        <>
          <Link to="/login">Login</Link> | <Link to="/signup">Sign Up</Link>
        </>
      ) : (
        <Link to="/dashboard">Dashboard</Link>
      )}
      <div className="flex flex-col items-center justify-center py-20">
        <h1 className="mb-4 text-4xl font-bold">Welcome to the Home Page</h1>
        <p className="mb-8 text-lg">Message from server: {data}</p>
        <Button onClick={handleButtonClick}>Click Me</Button>
      </div>
    </div>
  );
}
