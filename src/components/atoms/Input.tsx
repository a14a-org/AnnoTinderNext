import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, ...props }, ref) => {
    return (
      <div className="relative">
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-lg border border-gray-200 bg-white/50 backdrop-blur-sm px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-obsidian-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chili-coral/20 focus-visible:border-chili-coral disabled:cursor-not-allowed disabled:opacity-50 shadow-card transition-all",
            icon && "pl-10",
            className
          )}
          ref={ref}
          {...props}
        />
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
