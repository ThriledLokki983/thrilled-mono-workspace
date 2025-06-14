import type { CustomRouteObject } from '../types/common-interfaces';
import { NavigationItem } from '../types/common-interfaces';


/**
 * Extracts navigation items from routes configuration
 * Filters routes that have isNav: true and required navigation properties
 * @param routes - Array of route objects to process
 * @returns Array of navigation items with id, label, path, and optional icon
 */
export function extractNavigationItems(routes: CustomRouteObject[] = []): NavigationItem[] {
  const navItems: NavigationItem[] = [];

  function processRoute(route: CustomRouteObject, basePath = '') {
    // Build full path
    const fullPath = route.path ? `${basePath}${route.path}` : basePath;

    // Check if this route should be in navigation
    if (route.isNav && route.label && route.path) {
      navItems.push({
        id: route.path.replace('/', '') || 'home', // Use path as ID, handle root path
        label: route.label,
        path: fullPath,
        icon: route.icon,
      });
    }

    // Process child routes recursively
    if (route.children) {
      route.children.forEach((child) => {
        processRoute(child as CustomRouteObject, fullPath);
      });
    }
  }

  routes.forEach((route) => processRoute(route));

  return navItems;
}

/**
 * Extracts navigation items from the main layout route
 * This function assumes the first route is the main layout and extracts its children
 * @param routes
 * @returns
 */
export const getNavigationItems = (routes : CustomRouteObject[] = []) => {
  // Defensive check for empty or invalid routes array
  if (!routes || !Array.isArray(routes) || routes.length === 0) {
    return [];
  }

  const layoutRoute = routes[0];

  // Defensive check for layout route existence and children
  if (!layoutRoute || !layoutRoute.children || !Array.isArray(layoutRoute.children)) {
    return [];
  }

  const childRoutes = layoutRoute.children as CustomRouteObject[];
  return extractNavigationItems(childRoutes);
};
