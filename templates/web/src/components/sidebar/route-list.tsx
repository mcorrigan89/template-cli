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
    routes: [
      { title: 'Dashboard', showInSidebar: true, route: '/dashboard' },
      {
        title: 'Profile',
        showInSidebar: true,
        route: '/dashboard',
      },
    ],
  },
  {
    title: 'Settings',
    routes: [
      {
        title: 'Account',
        showInSidebar: true,
        route: '/dashboard',
      },
      {
        title: 'Billing',
        showInSidebar: true,
        route: '/dashboard',
      },
    ],
  },
];
