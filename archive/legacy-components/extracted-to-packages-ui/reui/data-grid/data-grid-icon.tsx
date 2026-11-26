import type { ComponentProps } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowLeftToLine,
  ArrowRight,
  ArrowRightToLine,
  ArrowUp,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  CirclePlus,
  GripHorizontal,
  GripVertical,
  PinOff,
  Plus,
  Settings2,
} from "lucide-react";

const icons = {
  ArrowDownIcon: ArrowDown,
  ArrowLeftIcon: ArrowLeft,
  ArrowLeftToLineIcon: ArrowLeftToLine,
  ArrowRightIcon: ArrowRight,
  ArrowRightToLineIcon: ArrowRightToLine,
  ArrowUpIcon: ArrowUp,
  CheckIcon: Check,
  ChevronLeftIcon: ChevronLeft,
  ChevronRightIcon: ChevronRight,
  ChevronsUpDownIcon: ChevronsUpDown,
  CirclePlusIcon: CirclePlus,
  GripHorizontalIcon: GripHorizontal,
  GripVerticalIcon: GripVertical,
  PinOffIcon: PinOff,
  PlusIcon: Plus,
  Settings2Icon: Settings2,
};

type DataGridIconName = keyof typeof icons;

type DataGridIconProps = Omit<
  ComponentProps<(typeof icons)[DataGridIconName]>,
  "ref"
> & {
  lucide: DataGridIconName;
  tabler?: string;
  hugeicons?: string;
  phosphor?: string;
  remixicon?: string;
};

function DataGridIcon({ lucide, ...props }: DataGridIconProps) {
  const Icon = icons[lucide];
  return <Icon {...props} />;
}

export { DataGridIcon };
