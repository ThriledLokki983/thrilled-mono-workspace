import styles from './app.module.scss';
import { Button } from '@mono/components';
import { Route, Routes, Link } from 'react-router-dom';

export function App() {
  return (
    <div className={styles.app}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.container}>
          <div className={styles.headerContent}>
            <h1 className={styles.brand}>FaithCircle</h1>
            <nav className={styles.nav}>
              <Link to="/" className={styles.navLink}>
                Home
              </Link>
              <Link to="/page-2" className={styles.navLink}>
                Features
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.container}>
          <Routes>
            <Route
              path="/"
              element={
                <>
                  {/* Hero Section */}
                  <section className={styles.hero}>
                    <h2 className={styles.heroTitle}>Welcome to FaithCircle</h2>
                    <p className={styles.heroSubtitle}>
                      A modern monorepo demonstrating seamless component
                      integration
                    </p>
                  </section>

                  {/* Component Demo Section */}
                  <section className={styles.demoSection}>
                    <h3 className={styles.demoTitle}>
                      Component Integration Demo
                    </h3>
                    <p className={styles.demoDescription}>
                      Below are Button components from the @mono/components
                      package, showcasing how shared components work across the
                      monorepo.
                    </p>
                    <div className={styles.buttonGroup}>
                      <Button>Primary Button</Button>
                      <Button variant="secondary">Secondary Button</Button>
                      <Button>
                        <Link
                          to="/page-2"
                          style={{ color: 'inherit', textDecoration: 'none' }}
                        >
                          Explore Features
                        </Link>
                      </Button>
                    </div>
                  </section>

                  {/* Features Grid */}
                  <section className={styles.contentGrid}>
                    <div className={styles.featureCard}>
                      <h4 className={styles.featureTitle}>
                        Monorepo Architecture
                      </h4>
                      <p className={styles.featureDescription}>
                        Built with Nx for efficient development, testing, and
                        deployment across multiple applications and libraries.
                      </p>
                    </div>
                    <div className={styles.featureCard}>
                      <h4 className={styles.featureTitle}>Shared Components</h4>
                      <p className={styles.featureDescription}>
                        Reusable UI components that maintain consistency across
                        all applications in the workspace.
                      </p>
                    </div>
                    <div className={styles.featureCard}>
                      <h4 className={styles.featureTitle}>Modern Styling</h4>
                      <p className={styles.featureDescription}>
                        CSS Modules with SCSS for scoped styling and
                        maintainable design systems.
                      </p>
                    </div>
                  </section>
                </>
              }
            />
            <Route
              path="/page-2"
              element={
                <div className={styles.featureCard}>
                  <h3 className={styles.featureTitle}>Features Page</h3>
                  <p className={styles.featureDescription}>
                    This page demonstrates routing and component integration
                    across different pages in the application.
                  </p>
                  <Button variant="secondary">
                    <Link
                      to="/"
                      style={{ color: 'inherit', textDecoration: 'none' }}
                    >
                      Back to Home
                    </Link>
                  </Button>
                </div>
              }
            />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;
