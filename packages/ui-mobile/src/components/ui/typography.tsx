import * as React from "react";
import { Text as RNText, type TextProps as RNTextProps } from "react-native";
import { cn } from "../../lib/utils";

export interface TextProps extends RNTextProps {
  className?: string;
}

export const H1 = React.forwardRef<RNText, TextProps>(
  ({ className, ...props }, ref) => (
    <RNText
      ref={ref}
      className={cn("text-3xl font-bold tracking-tight text-foreground", className)}
      {...props}
    />
  )
);
H1.displayName = "H1";

export const H2 = React.forwardRef<RNText, TextProps>(
  ({ className, ...props }, ref) => (
    <RNText
      ref={ref}
      className={cn("text-2xl font-semibold tracking-tight text-foreground", className)}
      {...props}
    />
  )
);
H2.displayName = "H2";

export const H3 = React.forwardRef<RNText, TextProps>(
  ({ className, ...props }, ref) => (
    <RNText
      ref={ref}
      className={cn("text-xl font-semibold tracking-tight text-foreground", className)}
      {...props}
    />
  )
);
H3.displayName = "H3";

export const H4 = React.forwardRef<RNText, TextProps>(
  ({ className, ...props }, ref) => (
    <RNText
      ref={ref}
      className={cn("text-lg font-semibold tracking-tight text-foreground", className)}
      {...props}
    />
  )
);
H4.displayName = "H4";

export const P = React.forwardRef<RNText, TextProps>(
  ({ className, ...props }, ref) => (
    <RNText
      ref={ref}
      className={cn("text-base leading-6 text-foreground", className)}
      {...props}
    />
  )
);
P.displayName = "P";

export const Muted = React.forwardRef<RNText, TextProps>(
  ({ className, ...props }, ref) => (
    <RNText
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
);
Muted.displayName = "Muted";

export const Small = React.forwardRef<RNText, TextProps>(
  ({ className, ...props }, ref) => (
    <RNText
      ref={ref}
      className={cn("text-xs font-medium text-foreground", className)}
      {...props}
    />
  )
);
Small.displayName = "Small";
