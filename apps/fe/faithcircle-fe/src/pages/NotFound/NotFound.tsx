// import { useEffect } from 'react';
import { PATH_HOME } from '../../config/paths';
import { Button } from '@mono/components';
// import { useAppStore } from '@stores/appStore';
import styles from './NotFound.module.scss';

const NotFound = () => {
  // const { setTitle } = useAppStore();

  // useEffect(() => {
  //   setTitle('Page not found');
  // }, [setTitle]);

  return (
    <article className={styles.root}>
      <div className={styles.content}>
        <h1 className={styles.title}>404</h1>
        <div className={styles.message}>
          <p>Sorry, we couldn't find the page you're looking for</p>
          <span className={styles.statusCode}>Error 404 | Page Not Found</span>
        </div>
        <div className={styles.homeButton}>
          <Button url={PATH_HOME} variant="primary" size="large">
            Return to Homepage
          </Button>
        </div>
      </div>
    </article>
  );
};

export default NotFound;
