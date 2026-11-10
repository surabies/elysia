'use client';

import Link from 'next/link';
import { ChevronRight, ExternalLink, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  getStageCategoryLabel,
  getStageStatusBadgeVariant,
  getStageStatusLabel,
} from '../lib/closing-format';
import type { WorkflowStageItem } from '../types';

interface ClosingWorkflowMatrixProps {
  stages: WorkflowStageItem[];
  highlightStage?: string;
  standAngkatCount: number;
  actionLoading?: boolean;
  onOpenMutasiDialog: () => void;
  onExecuteStageAction?: (stageId: string) => void;
}

const DIRECT_ACTION_LABELS: Record<string, string> = {
  'update-zonasi': 'Sinkronkan Zonasi',
  'posting-datameter': 'Posting Massal',
  'create-closed-drd': 'Eksekusi DRD',
  'create-perbandingan': 'Lihat Komparasi',
  'create-bulan-baru': 'Buka Bulan Baru',
  'upload-master-pelanggan': 'Validasi Master',
  'sync-pelanggan-baru': 'Sync ke DPM',
  'update-data-pelanggan': 'Normalisasi Urutan',
};

export function ClosingWorkflowMatrix({
  stages,
  highlightStage,
  standAngkatCount,
  actionLoading = false,
  onOpenMutasiDialog,
  onExecuteStageAction,
}: ClosingWorkflowMatrixProps) {
  return (
    <section aria-labelledby="workflow-matrix-title" className="space-y-3">
      <div>
        <h2 id="workflow-matrix-title" className="text-heading-16 text-foreground">
          Alur Kerja 12 Tahapan Tutup Bulan
        </h2>
        <p className="mt-0.5 text-copy-13 text-muted-foreground">
          Seluruh tahapan diverifikasi secara otomatis terhadap basis data
          PostgreSQL riil dan dapat dieksekusi langsung per modul.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
        {stages.map((stage) => {
          const isHighlighted = stage.id === highlightStage;
          const directActionLabel = DIRECT_ACTION_LABELS[stage.id];

          return (
            <Card
              key={stage.id}
              className={cn(
                'flex flex-col justify-between gap-3 p-4 transition-colors duration-150 hover:border-(--ds-gray-500)',
                isHighlighted &&
                  'border-foreground bg-(--ds-gray-100) ring-2 ring-ring/35',
              )}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex size-5 items-center justify-center rounded-full border border-border bg-(--ds-gray-100) text-label-11-mono tabular-nums text-foreground">
                      {stage.stageNumber}
                    </span>
                    <span className="text-label-12 text-muted-foreground">
                      {getStageCategoryLabel(stage.kategori)}
                    </span>
                  </div>

                  <Badge
                    variant={getStageStatusBadgeVariant(stage.status)}
                    size="sm"
                  >
                    {getStageStatusLabel(stage.status)}
                  </Badge>
                </div>

                <h3 className="text-label-14 text-foreground">{stage.nama}</h3>
                <p className="line-clamp-2 text-copy-13 text-muted-foreground">
                  {stage.deskripsi}
                </p>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
                <span className="truncate text-label-12-mono tabular-nums text-foreground">
                  {stage.metrikUtama}
                </span>

                <div className="flex shrink-0 items-center gap-1">
                  {stage.id === 'cek-selisih-pelanggan' ? (
                    <Button asChild size="xs" variant="ghost">
                      <Link href="/tools-tutup/cek-selisih-pelanggan">
                        <span>Buka Audit</span>
                        <ChevronRight className="size-3" />
                      </Link>
                    </Button>
                  ) : stage.id === 'pbpk' ? (
                    <Button asChild size="xs" variant="ghost">
                      <Link href="/tools-tutup/pbpk">
                        <span>Buka PBPK</span>
                        <ChevronRight className="size-3" />
                      </Link>
                    </Button>
                  ) : stage.id === 'stand-angkat' ? (
                    <Button
                      type="button"
                      size="xs"
                      variant="ghost"
                      onClick={onOpenMutasiDialog}
                    >
                      <span>Review ({standAngkatCount})</span>
                      <ChevronRight className="size-3" />
                    </Button>
                  ) : directActionLabel && onExecuteStageAction ? (
                    <Button
                      type="button"
                      size="xs"
                      variant={
                        stage.status === 'PERLU_TINDAKAN' ||
                        stage.status === 'SIAP'
                          ? 'outline'
                          : 'ghost'
                      }
                      disabled={actionLoading}
                      onClick={() => onExecuteStageAction(stage.id)}
                    >
                      <Play className="size-2.5" />
                      <span>{directActionLabel}</span>
                    </Button>
                  ) : (
                    <Button asChild size="xs" variant="ghost">
                      <Link href={stage.routeUrl}>
                        <span>Akses</span>
                        <ExternalLink className="size-3" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
