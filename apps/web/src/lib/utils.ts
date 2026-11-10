import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const GEIST_FONT_SIZES = [
  "heading-72",
  "heading-64",
  "heading-56",
  "heading-48",
  "heading-40",
  "heading-32",
  "heading-24",
  "heading-20",
  "heading-18",
  "heading-16",
  "heading-14",
  "copy-24",
  "copy-20",
  "copy-18",
  "copy-16",
  "copy-14",
  "copy-13",
  "copy-12",
  "copy-14-mono",
  "copy-13-mono",
  "label-16",
  "label-14",
  "label-13",
  "label-12",
  "label-11",
  "label-14-mono",
  "label-13-mono",
  "label-12-mono",
  "button-16",
  "button-14",
  "button-13",
  "button-12",
] as const;

const customTwMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: [...GEIST_FONT_SIZES] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(inputs));
}
