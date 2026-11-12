'use client'

import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTimeZone } from '@/components/TimeZoneContext'
import OverviewDashboard from '@/components/overview/OverviewDashboard'
import { createOverviewPreview } from '@/lib/overview-preview'

export default function PreviewOverview() {
  const { timeZone } = useTimeZone()
  const scenario = useSearchParams().get('overview')
  const state =
    scenario === 'empty' || scenario === 'error' ? scenario : 'populated'
  const data = useMemo(
    () => createOverviewPreview(timeZone, state),
    [timeZone, state]
  )
  return <OverviewDashboard preview={data} />
}
