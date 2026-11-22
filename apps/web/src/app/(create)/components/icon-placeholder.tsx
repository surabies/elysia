import * as React from "react";
import * as LucideIcons from "lucide-react";

export interface IconPlaceholderProps extends React.SVGProps<SVGSVGElement> {
  lucide?: string;
  tabler?: string;
  hugeicons?: string;
  phosphor?: string;
  remixicon?: string;
  className?: string;
}

export function IconPlaceholder({
  lucide,
  className,
  ...props
}: IconPlaceholderProps) {
  if (!lucide) return null;

  // Nama icon bisa berupa "ArrowDownIcon" atau "ArrowDown"
  const cleanName = lucide.endsWith("Icon") ? lucide.slice(0, -4) : lucide;
  const IconComponent =
    (LucideIcons as Record<string, any>)[cleanName] ??
    (LucideIcons as Record<string, any>)[lucide] ??
    (LucideIcons as Record<string, any>)[cleanName.toLowerCase()] ??
    LucideIcons.HelpCircle;

  if (!IconComponent) return null;

  return <IconComponent className={className} {...props} />;
}
