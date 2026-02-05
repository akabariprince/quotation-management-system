import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonLoaderProps {
  className?: string;
  type?: 'text' | 'card' | 'table' | 'avatar' | 'button';
  count?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  className, 
  type = 'text',
  count = 1 
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className="enterprise-card p-6 space-y-4">
            <div className="skeleton-loading h-4 w-1/3" />
            <div className="skeleton-loading h-8 w-1/2" />
            <div className="skeleton-loading h-4 w-2/3" />
          </div>
        );
      case 'table':
        return (
          <div className="enterprise-card overflow-hidden">
            <div className="skeleton-loading h-12 w-full" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4 p-4 border-t border-border">
                <div className="skeleton-loading h-4 flex-1" />
                <div className="skeleton-loading h-4 flex-1" />
                <div className="skeleton-loading h-4 flex-1" />
                <div className="skeleton-loading h-4 w-24" />
              </div>
            ))}
          </div>
        );
      case 'avatar':
        return <div className="skeleton-loading h-10 w-10 rounded-full" />;
      case 'button':
        return <div className="skeleton-loading h-10 w-24 rounded-md" />;
      default:
        return <div className={cn("skeleton-loading h-4", className)} />;
    }
  };

  return (
    <>
      {[...Array(count)].map((_, index) => (
        <div key={index}>{renderSkeleton()}</div>
      ))}
    </>
  );
};

export default SkeletonLoader;
