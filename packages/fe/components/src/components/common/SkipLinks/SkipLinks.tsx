import React from 'react';
import styles from './SkipLinks.module.scss';

interface SkipLink {
  href: string;
  label: string;
}

interface SkipLinksProps {
  links?: SkipLink[];
}

/**
 * Skip links component for keyboard navigation accessibility
 * Allows users to skip to main content areas
 */
const SkipLinks: React.FC<SkipLinksProps> = ({
  links = [
    { href: '#main-content', label: 'Skip to main content' },
    { href: '#navigation', label: 'Skip to navigation' },
  ],
}) => {
  return (
    <nav className={styles.root} aria-label="Skip navigation links">
      {links.map((link, index) => (
        <a key={index} href={link.href} className={styles.link}>
          {link.label}
        </a>
      ))}
    </nav>
  );
};

export default SkipLinks;
