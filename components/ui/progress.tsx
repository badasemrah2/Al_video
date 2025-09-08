'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import styles from './progress.module.css';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number; // 0-100
  max?: number;   // default 100
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, ...props }, ref) => {
    const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const now = Math.round(pct); // retained if future ARIA needed
    const barRef = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
      if (barRef.current) {
        barRef.current.style.width = pct + '%';
      }
    }, [pct]);
    return (
      <div
        ref={ref}
        className={cn(
          'relative h-2 w-full overflow-hidden rounded-full bg-secondary',
          styles.wrapper,
          className
        )}
    data-progress={pct}
        {...props}
      >
        {/* eslint-disable-next-line react/forbid-dom-props */}
        <div
          ref={barRef}
          className={cn('h-full bg-primary transition-all', styles.bar)}
        />
      </div>
    );
  }
);
Progress.displayName = 'Progress';
