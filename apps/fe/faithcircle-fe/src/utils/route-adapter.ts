import type { RouteObject } from 'react-router-dom';

// Import the type directly from the source since the package export might not be updated yet
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

/**
 * Converts React Router route structure to CustomRouteObject format
 * expected by the components package Layout/Sidebar
 */
export function convertRoutesToNavigation(routes: RouteObject[]): CustomRouteObject[] {
  const navigationRoutes: CustomRouteObject[] = [];

  console.log('convertRoutesToNavigation: input routes', routes);

  function processRoutes(routeList: RouteObject[], parentPath = ''): void {
    routeList.forEach((route) => {
      console.log('convertRoutesToNavigation: processing route', route);

      // Cast to access custom properties
      const customRoute = route as RouteObject & {
        isNav?: boolean;
        title?: string;
        icon?: React.ReactNode;
        label?: string;
      };

      // Build the full path
      const fullPath = route.path
        ? (parentPath + (route.path.startsWith('/') ? route.path : `/${route.path}`))
        : parentPath;

      // If this route has navigation properties, add it to navigation
      if (customRoute.isNav && customRoute.title) {
        console.log('convertRoutesToNavigation: adding navigation route', {
          path: fullPath,
          title: customRoute.title,
          label: customRoute.label || customRoute.title,
          icon: customRoute.icon,
          isNav: customRoute.isNav,
        });

        navigationRoutes.push({
          ...route,
          path: fullPath,
          title: customRoute.title,
          label: customRoute.label || customRoute.title,
          icon: customRoute.icon,
          isNav: customRoute.isNav,
        } as CustomRouteObject);
      }

      // Process children recursively
      if (route.children && Array.isArray(route.children)) {
        processRoutes(route.children, fullPath);
      }
    });
  }

  processRoutes(routes);
  console.log('convertRoutesToNavigation: final navigationRoutes', navigationRoutes);
  return navigationRoutes;
}

/**
 * Extracts navigation routes from the main layout route structure
 * Returns the structure expected by the components package getNavigationItems function
 */
export function extractNavigationFromRoutes(routes: RouteObject[]): CustomRouteObject[] {
  if (!routes || routes.length === 0) {
    console.warn('extractNavigationFromRoutes: No routes provided');
    return [];
  }

  // Get the main layout route (typically the first one)
  const layoutRoute = routes[0];

  if (!layoutRoute) {
    console.warn('extractNavigationFromRoutes: No layout route found');
    return [];
  }

  if (!layoutRoute.children || !Array.isArray(layoutRoute.children)) {
    console.warn('extractNavigationFromRoutes: No children found in layout route');
    return [];
  }

  // Convert the children to navigation format
  const navigationChildren = convertRoutesToNavigation(layoutRoute.children);

  console.log('extractNavigationFromRoutes: navigationChildren', navigationChildren);

  // Return in the format expected by components package:
  // An array with a single route object containing children
  const result = [{
    path: layoutRoute.path || '/',
    element: layoutRoute.element,
    children: navigationChildren,
    title: 'Layout', // Required by CustomRouteObject
    isNav: false, // Layout route itself is not a nav item
  }];

  console.log('extractNavigationFromRoutes: result', result);
  console.log('extractNavigationFromRoutes: result[0]', result[0]);
  console.log('extractNavigationFromRoutes: result[0].children', result[0].children);
  console.log('extractNavigationFromRoutes: Array.isArray(result)', Array.isArray(result));
  console.log('extractNavigationFromRoutes: result.length', result.length);

  // Let's also validate the structure matches what getNavigationItems expects
  if (result.length > 0 && result[0] && result[0].children) {
    console.log('✅ Structure looks correct for getNavigationItems');
  } else {
    console.error('❌ Structure may be incorrect for getNavigationItems');
  }

  return result;
}
