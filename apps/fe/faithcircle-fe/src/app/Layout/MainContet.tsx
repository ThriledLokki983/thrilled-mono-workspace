import { Outlet } from 'react-router-dom';
import styles from './Layout.module.scss';

interface MainContentProps {
  style?: React.CSSProperties;
  content?: React.ReactNode;
}

export const MainContent = ({ content }: MainContentProps) => {
  return (
      <main className={styles.main}>
        <Outlet />
        {content}
      </main>
  );

};

export default MainContent;
export type { MainContentProps };
