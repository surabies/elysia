import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Custom twMerge that recognizes Geist typography scale classes
 * (`text-heading-*`, `text-copy-*`, `text-label-*`, `text-button-*`)
 * as `font-size` utilities rather than generic `text-*` color utilities.
 * This prevents `tailwind-merge` from stripping text color classes
 * such as `text-primary-foreground` when paired with button or copy sizes.
 */
const customTwMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [(value: string) => /^(heading|copy|label|button)-\d+$/.test(value)],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(inputs));
}
