import styles from './Home.module.scss';

const Home = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Modern React Enterprise Template</h1>
      <p className={styles.subtitle}>
        A sophisticated foundation for building scalable enterprise applications
      </p>

      <div className={styles.features}>
        <section className={styles.featureSection}>
          <h2 className={styles.featureTitle}>Modern Tech Stack</h2>
          <p className={styles.featureDescription}>
            Built with React, TypeScript, and Vite for blazing-fast development and optimal
            performance. Leverages modern tooling and best practices for enterprise-grade
            applications.
          </p>
        </section>

        <section className={styles.featureSection}>
          <h2 className={styles.featureTitle}>Component Library</h2>
          <p className={styles.featureDescription}>
            Includes a comprehensive set of reusable components designed with modern aesthetics and
            accessibility in mind. From buttons to complex UI patterns, everything you need to build
            consistent interfaces.
          </p>
        </section>

        <section className={styles.featureSection}>
          <h2 className={styles.featureTitle}>Enterprise Ready</h2>
          <p className={styles.featureDescription}>
            Features a scalable architecture, robust state management, and established patterns for
            building large-scale applications. Includes error handling, loading states, and more.
          </p>
        </section>

        <section className={styles.featureSection}>
          <h2 className={styles.featureTitle}>Developer Experience</h2>
          <p className={styles.featureDescription}>
            Enhanced developer experience with ESLint, Prettier, and TypeScript integration.
            Includes hot module replacement, fast refresh, and optimized build configurations.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Home;
