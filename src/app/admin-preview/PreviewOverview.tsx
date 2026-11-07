'use client';

import { Camera, Flame, Share2, Users } from 'lucide-react';
import OverviewCard from '@/components/card/OverviewCard';
import { OverviewChart } from '@/components/chart/OverviewChart';

const sharingPreview = {
  destinations: [
    { id: 1, name: 'Messages' },
    { id: 2, name: 'Instagram' },
    { id: 3, name: 'Other' },
  ],
  data: [
    { date: 'Sunday', Messages: 42, Instagram: 31, Other: 18 },
    { date: 'Monday', Messages: 55, Instagram: 38, Other: 24 },
    { date: 'Tuesday', Messages: 48, Instagram: 42, Other: 21 },
    { date: 'Wednesday', Messages: 68, Instagram: 49, Other: 30 },
    { date: 'Thursday', Messages: 61, Instagram: 45, Other: 28 },
    { date: 'Friday', Messages: 82, Instagram: 63, Other: 35 },
    { date: 'Saturday', Messages: 75, Instagram: 57, Other: 32 },
  ],
};

export default function PreviewOverview() {
  return (
    <div className="page-shell" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
      <div className="page-header">
        <h1 className="page-title">Overview</h1>
        <p className="page-subtitle">Key stats and activity at a glance.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 [&_.rounded-lg]:max-w-full">
        <div className="flex min-w-0 flex-col gap-4">
          <OverviewCard title="Users" content={1284} icon={Users} />
          <OverviewCard title="Shares" content={6742} icon={Share2} />
          <OverviewCard title="Screenshots" content={2318} icon={Camera} />
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <OverviewCard title="Total Captions" content={24516} icon={Flame} />
          <OverviewChart preview={sharingPreview} />
        </div>
      </div>
    </div>
  );
}
