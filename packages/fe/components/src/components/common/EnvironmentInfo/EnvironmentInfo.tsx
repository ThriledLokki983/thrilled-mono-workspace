import env, { isDev, isProd, isStaging } from '../../../config/env';
import styles from './EnvironmentInfo.module.scss';

interface EnvironmentInfoProps {
  className?: string;
}

/**
 * A component that displays the current environment information
 */
export const EnvironmentInfo: React.FC<EnvironmentInfoProps> = ({ className = '' }) => {
  return (
    <div className={`${styles.envInfo} ${className}`}>
      <h3 className={styles.title}>Environment Information</h3>
      <div className={styles.infoGrid}>
        <div className={styles.infoItem}>
          <p className={styles.label}>Environment</p>
          <p className={styles.value}>
            {env.NODE_ENV}
            {isDev && <span className="tag tag--primary">DEV</span>}
            {isStaging && <span className="tag tag--warning">STAGING</span>}
            {isProd && <span className="tag tag--success">PROD</span>}
          </p>
        </div>
        <div className={styles.infoItem}>
          <p className={styles.label}>API URL</p>
          <p className={styles.value}>{env.API_URL}</p>
        </div>
        <div className={styles.infoItem}>
          <p className={styles.label}>Port</p>
          <p className={styles.value}>{env.PORT}</p>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentInfo;
