import type { ReactElement } from 'react';
import { useRoutes } from 'react-router-dom';
import ROUTES from './config/routes';
// import { useAppStore } from '@stores/appStore';
// import withMainAppHocs from '@hocs/index';
// import { App } from '@components/App';
// import { Loader } from '@components/common/index';

/**
 * Core component that handles routing and global app state
 */
function Core(): ReactElement | null {
  const routes = useRoutes(ROUTES);
  // const isLoading = useAppStore((state) => state.isLoading);

  // if (false) {
  //   return <Loader aria-label="Application loading" message="Initializing application..." />;
  // }

  return <App routes={routes} />;
}

interface AppProps {
  routes: ReactElement | null;
}

/**
 * Main App component that renders routes based on props
 */
export function App({ routes }: AppProps) {
  return routes;
}


/**
 * Main application with all HOCs applied
 */
// const WrappedApp = withMainAppHocs(Core);
// export default WrappedApp;

export default Core;
