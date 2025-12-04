import type { VariantProps } from 'class-variance-authority'
import type { HTMLMotionProps } from 'framer-motion'

import React from 'react'
import { cva } from 'class-variance-authority'
import { motion } from 'framer-motion'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chili-coral/50 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-chili-coral text-white shadow-card hover:bg-chili-light',
        secondary: 'bg-white text-obsidian border border-gray-200 shadow-sm hover:bg-gray-50',
        ghost: 'bg-transparent text-obsidian-muted hover:bg-gray-100',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends Omit<HTMLMotionProps<'button'>, 'className'>,
    VariantProps<typeof buttonVariants> {
  className?: string
}

const springHover = {
  y: -2,
  scale: 1.01,
  transition: { type: 'spring' as const, stiffness: 400, damping: 30 },
}

const activeTap = { scale: 0.98 }

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    const isPrimary = variant === 'primary'

    return (
      <motion.button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        whileHover={isPrimary ? springHover : {}}
        whileTap={activeTap}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
