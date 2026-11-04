import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'accent' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]';

    const variants = {
      primary: 'bg-emerald-800 text-white hover:bg-emerald-900 focus:ring-emerald-700 shadow-sm',
      secondary: 'bg-neutral-900 text-white hover:bg-neutral-800 focus:ring-neutral-700 shadow-sm',
      accent: 'bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-500 shadow-sm',
      outline: 'border border-neutral-300 bg-transparent text-neutral-800 hover:bg-neutral-100 focus:ring-neutral-400',
      ghost: 'bg-transparent text-neutral-700 hover:bg-neutral-100 focus:ring-neutral-300',
      danger: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2.5 gap-2',
      lg: 'text-base px-6 py-3.5 gap-2.5 font-semibold',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
