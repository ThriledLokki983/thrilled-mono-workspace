import React, { Suspense } from 'react';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Wrapper component for lazy-loaded routes with proper loading state
 */
const LazyWrapper: React.FC<LazyWrapperProps> = ({ children, fallback }) => {
  const defaultFallback = <LoadingSpinner message="Loading page..." />;

  return <Suspense fallback={fallback || defaultFallback}>{children}</Suspense>;
};

export default LazyWrapper;
