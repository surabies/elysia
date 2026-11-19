import * as React from "react";
import { View, type ViewProps } from "react-native";
import { cn } from "../../lib/utils";

export interface ProgressProps extends ViewProps {
  value?: number; // 0 to 100
  className?: string;
  indicatorClassName?: string;
}

export function Progress({
  value = 0,
  className,
  indicatorClassName,
  ...props
}: ProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <View
      className={cn(
        "h-3 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      <View
        className={cn("h-full bg-primary rounded-full transition-all", indicatorClassName)}
        style={{ width: `${clampedValue}%` }}
      />
    </View>
  );
}
