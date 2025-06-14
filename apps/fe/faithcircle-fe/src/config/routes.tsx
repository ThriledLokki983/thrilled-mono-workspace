import { type ReactNode } from 'react';
import { type RouteObject } from 'react-router-dom';

import { LayoutDashboard} from 'lucide-react';
import { PATH_HOME } from './paths';
import { Layout } from '../app/Layout/Layout';

import { Home, NotFound } from '../pages';

type CustomRouteObject = RouteObject & {
  label?: string;
  isNav?: boolean;
  isEnd?: boolean;
  isIndex?: boolean;
  title: string;
  icon?: ReactNode;
};

const ROUTES: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      {
        path: PATH_HOME,
        element: <Home />,
        index: true,
        isNav: true,
        isEnd: true,
        title: 'Home',
        label: 'Home',
        icon: <LayoutDashboard size={20} strokeWidth={1.5} />,
      } as CustomRouteObject,
      {
        path: '*',
        element: (
          <NotFound />
        ),
        ...{
          title: 'Not found',
          isNav: false,
        },
      } as CustomRouteObject,
    ],
  }
];

export default ROUTES;
