import { BroadcastFormPage } from '@/components/broadcast/BroadcastFormPage'

export const metadata = {
  title: 'Edit Konten Siaran & Iklan | Tirtawening',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditBroadcastPage({ params }: PageProps) {
  const { id } = await params
  return <BroadcastFormPage idEdit={id} />
}
