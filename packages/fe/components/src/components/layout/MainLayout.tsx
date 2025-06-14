import { Fragment } from 'react';
import type { ReactNode, ReactElement } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import styles from './MainLayout.module.scss';
import { SkipLinks, Toast } from '../common/index';
import type { CustomRouteObject } from '../../types/common-interfaces';
// import { FocusManager } from '@hooks/useFocusManagement';

interface LayoutProps {
  children?: ReactNode | ReactElement | ReactElement[];
  routes: CustomRouteObject[];
}

export const Layout = ({ children, routes }: LayoutProps) => {
  console.log('Layout================================', routes);

  return (
    <Fragment>
      {/* <FocusManager> */}
      <div className={styles.layout}>
        <SkipLinks />
        <Sidebar routes={routes} />
        <div className={styles.content}>
          <Header />
          <main
            id="main-content"
            className={styles.main}
            role="main"
            aria-label="Main content"
            tabIndex={-1}
          >
            <Outlet />
            {children}
          </main>
        </div>
        <Toast />
      </div>
    {/* </FocusManager> */}
    </Fragment>
  );
};

export default Layout;
