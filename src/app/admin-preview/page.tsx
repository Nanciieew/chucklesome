import { notFound } from 'next/navigation';
import Menu from '@/app/(admin)/(menu)';
import PreviewOverview from './PreviewOverview';

export const dynamic = 'force-dynamic';

export default function AdminPreviewPage() {
  if (process.env.NODE_ENV !== 'development') notFound();

  return <Menu previewContent={<PreviewOverview />} />;
}
