import type { Metadata } from 'next';
import { MenuPage } from '@/components/layout/index';

export const metadata: Metadata = {
  title: 'Import Backup',
};

export default function ImportBackupPage() {
  return <MenuPage href="/tools/import-backup" />;
}
