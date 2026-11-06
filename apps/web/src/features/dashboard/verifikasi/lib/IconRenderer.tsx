import type { ComponentProps } from "react";
import type { LucideIcon } from "lucide-react";

export type IconSvgElement = LucideIcon;

export function HugeiconsIcon({
  icon: Icon,
  ...props
}: ComponentProps<LucideIcon> & { icon: LucideIcon }) {
  return <Icon {...props} />;
}
