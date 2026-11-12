'use server'

import { createClient } from '@/utils/supabase/server'
import { loadOverviewDashboard } from '@/services/overview.service'
import type { OverviewDashboardData, OverviewResult } from '@/types/overview'

export async function fetchOverviewDashboard(
  timeZone: string
): Promise<OverviewResult<OverviewDashboardData>> {
  try {
    return {
      data: await loadOverviewDashboard(await createClient(), timeZone),
      error: null,
    }
  } catch {
    return {
      data: null,
      error:
        'The overview could not be loaded. Check your admin session and try again.',
    }
  }
}
