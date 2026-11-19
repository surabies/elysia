import * as React from "react";
import { TextInput, type TextInputProps } from "react-native";
import { cn } from "../../lib/utils";

export interface InputProps extends TextInputProps {
  className?: string;
  error?: boolean;
  placeholderTextColor?: string;
}

export const Input = React.forwardRef<TextInput, InputProps>(
  ({ className, error, placeholderTextColor, ...props }, ref) => {
    return (
      <TextInput
        ref={ref}
        placeholderTextColor={placeholderTextColor ?? "#94a3b8"}
        className={cn(
          "h-12 w-full rounded-xl border border-input bg-background px-4 text-base text-foreground",
          "focus:border-primary focus:ring-1 focus:ring-primary",
          error && "border-destructive focus:border-destructive focus:ring-destructive",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
