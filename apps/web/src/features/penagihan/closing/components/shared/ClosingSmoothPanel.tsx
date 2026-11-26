'use client';

import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export interface ClosingSmoothPanelProps {
  children: ReactNode;
  refreshing?: boolean;
  className?: string;
}

/**
 * Kontainer transisi halus (tanpa kedipan putih):
 * Memulai dari opacity 0.96 -> 1 dengan pergeseran mikro 2px selama 140ms,
 * serta menjaga tinggi konten tetap stabil saat revalidasi latar belakang (`refreshing`).
 */
export function ClosingSmoothPanel({
  children,
  refreshing = false,
  className,
}: ClosingSmoothPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0.95, y: 2 }}
      animate={{ opacity: refreshing ? 0.92 : 1, y: 0 }}
      transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
      className={cn('space-y-4 transition-opacity duration-150', className)}
    >
      {children}
    </motion.div>
  );
}
