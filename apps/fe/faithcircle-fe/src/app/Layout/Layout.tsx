import { Header, Sidebar } from '@mono/components';
import { Outlet } from 'react-router-dom';
import ROUTES from '../../config/routes';
import { extractNavigationFromRoutes } from '../../utils/route-adapter';

// Temporary local type definition until package export is recognized
type CustomRouteObject = {
  path?: string;
  element?: React.ReactNode;
  children?: CustomRouteObject[];
  index?: boolean;
  isNav?: boolean;
  isEnd?: boolean;
  isIndex?: boolean;
  title: string;
  label?: string;
  icon?: React.ReactNode;
};

interface LayoutProps {
  children?: React.ReactNode;
  routes?: CustomRouteObject[];
}

export const Layout = ({ children, routes }: LayoutProps) => {
  // Convert React Router routes to navigation format if no routes provided
  const navigationRoutes = routes || extractNavigationFromRoutes(ROUTES);

  // Debug logging to help understand the structure
  console.log('Layout: navigationRoutes', navigationRoutes);
  console.log('Layout: navigationRoutes[0]?.children', navigationRoutes[0]?.children);

  // TEMPORARY WORKAROUND: Create our own layout structure
  // to bypass the problematic getNavigationItems function

  // For now, let's just pass an empty array to prevent the error
  // and create our navigation manually
  const emptyRoutes: CustomRouteObject[] = [];

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Use Sidebar component directly with empty routes to prevent error */}
      <Sidebar routes={emptyRoutes} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header />
        <main style={{ flex: 1, padding: '1rem' }}>
          <Outlet />
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
