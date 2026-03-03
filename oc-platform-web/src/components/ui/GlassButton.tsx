import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-95",
          
          // Variants
          variant === 'primary' && "bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary/90 hover:shadow-primary/40",
          variant === 'secondary' && "bg-white/80 text-slate-800 shadow-sm hover:bg-white border border-white/20 backdrop-blur-sm",
          variant === 'outline' && "border-2 border-primary text-primary bg-transparent hover:bg-primary/10",
          variant === 'ghost' && "bg-transparent text-slate-700 hover:bg-white/20",

          // Sizes
          size === 'sm' && "h-8 px-3 text-sm",
          size === 'md' && "h-10 px-4 text-sm",
          size === 'lg' && "h-12 px-6 text-base",
          
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
GlassButton.displayName = "GlassButton";
