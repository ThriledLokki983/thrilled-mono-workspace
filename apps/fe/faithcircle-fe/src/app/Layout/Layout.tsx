import { Fragment } from 'react';
import { Header, SkipLinks, Toast } from '@mono/components';
import { MainContent } from './MainContet';
import { Sidebar } from './SIdebar';
import styles from './Layout.module.scss';

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


/**
 *  Main layout component for the application.
 *  It includes the header, main content area, and toast notifications.
 *  The layout is designed to be flexible and can include a sidebar if needed.
 *  The `children` prop allows for dynamic content to be rendered within the layout.
 * @param param0
 * @returns
 */
export const Layout = ({ children }: LayoutProps) => {

  return (
    <Fragment>
      <div className={styles.layout}>
        <SkipLinks />
        <Sidebar />
        <div className={styles.content}>
          <Header />
          <MainContent content={children} />
        </div>
        <Toast/>
      </div>
    </Fragment>
  );

};

export default Layout;
