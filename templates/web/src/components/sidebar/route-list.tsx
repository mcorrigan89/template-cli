import { FileRoutesByTo } from '@/routeTree.gen';

type RouteList = {
  title: string;
  showInSidebar: boolean;
  route: keyof FileRoutesByTo;
}[];

export type RouteMenu = {
  title: string;
  routes: RouteList;
}[];

export const routeList: RouteMenu = [
  {
    title: 'Home',
    routes: [{ title: 'Dashboard', showInSidebar: true, route: '/dashboard' }],
  },
];
