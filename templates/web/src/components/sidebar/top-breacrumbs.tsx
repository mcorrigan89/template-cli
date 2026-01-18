import { Link, useRouterState } from '@tanstack/react-router';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@template/ui/components/breadcrumb';
import { Fragment } from 'react';
import { RouteMenu } from './route-list';

export function TopBreadcrumbs({ routeList }: { routeList: RouteMenu }) {
  const { matches } = useRouterState();

  const routes = routeList
    .flatMap((group) => group.routes)
    .filter((route) => matches.some((match) => match.routeId === route.route));

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {routes.map((route, index) => (
          <Fragment key={`fragment-${index}-${route.title}`}>
            <BreadcrumbItem>
              {index < routes.length - 1 ? (
                <>
                  <BreadcrumbLink render={<Link to={route.route}>{route.title}</Link>} />
                </>
              ) : (
                <BreadcrumbPage>{route.title}</BreadcrumbPage>
              )}
              {/* {index < routes.length - 1 && <BreadcrumbSeparator />} */}
            </BreadcrumbItem>
            {index < routes.length - 1 && <BreadcrumbSeparator />}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
