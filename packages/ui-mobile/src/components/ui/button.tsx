import * as React from "react";
import { Pressable, Text, type PressableProps } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "flex-row items-center justify-center rounded-xl font-medium active:opacity-80 transition-all",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-border bg-background",
        secondary: "bg-secondary text-secondary-foreground",
        ghost: "bg-transparent",
        link: "bg-transparent underline",
      },
      size: {
        default: "h-12 px-4 py-3",
        sm: "h-9 rounded-lg px-3",
        lg: "h-14 rounded-2xl px-8",
        icon: "h-11 w-11 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const buttonTextVariants = cva("text-center font-semibold", {
  variants: {
    variant: {
      default: "text-primary-foreground",
      destructive: "text-destructive-foreground",
      outline: "text-foreground",
      secondary: "text-secondary-foreground",
      ghost: "text-foreground",
      link: "text-primary underline",
    },
    size: {
      default: "text-base",
      sm: "text-sm",
      lg: "text-lg",
      icon: "text-base",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export interface ButtonProps
  extends PressableProps,
    VariantProps<typeof buttonVariants> {
  children?: React.ReactNode;
  label?: string;
  className?: string;
  textClassName?: string;
  disabled?: boolean;
}

export const Button = React.forwardRef<React.ElementRef<typeof Pressable>, ButtonProps>(
  ({ className, textClassName, variant, size, children, label, disabled, ...props }, ref) => {
    return (
      <Pressable
        ref={ref}
        disabled={disabled}
        className={cn(
          buttonVariants({ variant, size }),
          disabled && "opacity-50",
          className
        )}
        {...props}
      >
        {label ? (
          <Text className={cn(buttonTextVariants({ variant, size }), textClassName)}>
            {label}
          </Text>
        ) : typeof children === "string" ? (
          <Text className={cn(buttonTextVariants({ variant, size }), textClassName)}>
            {children}
          </Text>
        ) : (
          children
        )}
      </Pressable>
    );
  }
);
Button.displayName = "Button";

export { buttonVariants, buttonTextVariants };
