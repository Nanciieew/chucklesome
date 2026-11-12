import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import type {
  CaptionSummary,
  OverviewActivity,
  OverviewDashboardData,
  OverviewParticipation,
  OverviewResult,
  OverviewShare,
  OverviewStudy,
  OverviewStudyVote,
  OverviewTimestamp,
  OverviewVote,
} from '@/types/overview'
import {
  buildOverviewDashboard,
  getOverviewPeriod,
  rankOverviewCaptions,
} from '@/lib/overview'

type Page<T> = {
  data: T[] | null
  count: number | null
  error: { message: string } | null
}
type Table = keyof Database['public']['Tables']
type Client = SupabaseClient<Database>
const PAGE_SIZE = 500
const MAX_ROWS = 100_000

/** Never mistake Supabase's row cap or a failed page for a complete dataset. */
export async function readOverviewPages<T>(
  load: (offset: number, limit: number) => PromiseLike<Page<T>>
): Promise<T[]> {
  const rows: T[] = []
  let expected: number | null = null
  do {
    const result = await load(rows.length, PAGE_SIZE)
    if (result.error) throw new Error(result.error.message)
    if (!result.data || result.count === null)
      throw new Error('The summary query did not return a complete count.')
    if (expected !== null && result.count !== expected)
      throw new Error('The dataset changed while the summary was loading.')
    if (expected === null) expected = result.count
    if (expected > MAX_ROWS)
      throw new Error('The summary exceeds the supported data volume.')
    if (!result.data.length && rows.length < expected)
      throw new Error('The summary query ended before all rows were returned.')
    rows.push(...result.data)
    if (rows.length > MAX_ROWS)
      throw new Error('The summary exceeds the supported data volume.')
  } while (rows.length < expected)
  return rows
}

async function safe<T>(
  name: string,
  load: () => Promise<T>
): Promise<OverviewResult<T>> {
  try {
    return { data: await load(), error: null }
  } catch {
    console.error(`Overview: could not load ${name}.`)
    return { data: null, error: `Could not load ${name}.` }
  }
}

function rows<T>(
  client: Client,
  table: Table,
  columns: string,
  start?: string,
  end?: string,
  timestamp = 'created_datetime_utc',
  order = ['id']
) {
  return readOverviewPages<T>((offset, limit) => {
    let query = client.from(table).select(columns, { count: 'exact' })
    if (start) query = query.gte(timestamp, start)
    if (end) query = query.lt(timestamp, end)
    for (const column of order) query = query.order(column, { ascending: true })
    return query
      .range(offset, offset + limit - 1)
      .abortSignal(AbortSignal.timeout(20_000)) as unknown as PromiseLike<
      Page<T>
    >
  })
}

async function count(
  client: Client,
  table: 'profiles' | 'captions' | 'shares' | 'screenshots'
) {
  const result = await client
    .from(table)
    .select('id', { count: 'exact', head: true })
    .abortSignal(AbortSignal.timeout(20_000))
  if (result.error || result.count === null)
    throw new Error('Count unavailable.')
  return result.count
}

export async function loadOverviewDashboard(
  client: Client,
  timeZone: string,
  now = new Date()
): Promise<OverviewDashboardData> {
  const period = getOverviewPeriod(timeZone, now)
  // This action is callable outside the admin layout. Check the signed-in user before reading metrics.
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser()
  if (userError || !user) throw new Error('Sign in to view the admin overview.')
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('is_superadmin')
    .eq('id', user.id)
    .single()
  if (profileError || profile?.is_superadmin !== true)
    throw new Error('Superadmin access is required to view the overview.')
  const { previousStart, currentStart, end } = period
  const [
    profiles,
    images,
    captions,
    requests,
    votes,
    shares,
    screenshots,
    studies,
    participations,
    studyVotes,
    usersTotal,
    captionsTotal,
    sharesTotal,
    screenshotsTotal,
  ] = await Promise.all([
    safe('new users', () =>
      rows<OverviewTimestamp>(
        client,
        'profiles',
        'id,created_datetime_utc',
        previousStart,
        end
      )
    ),
    safe('new images', () =>
      rows<OverviewTimestamp>(
        client,
        'images',
        'id,created_datetime_utc',
        previousStart,
        end
      )
    ),
    safe('new captions', () =>
      rows<OverviewTimestamp>(
        client,
        'captions',
        'id,created_datetime_utc',
        previousStart,
        end
      )
    ),
    safe('caption requests', () =>
      rows<OverviewActivity>(
        client,
        'caption_requests',
        'id,created_datetime_utc,profile_id',
        previousStart,
        end
      )
    ),
    safe('caption votes', () =>
      rows<OverviewVote>(
        client,
        'caption_votes',
        'id,created_datetime_utc,profile_id,caption_id,vote_value',
        previousStart,
        end
      )
    ),
    safe('shares', () =>
      rows<OverviewShare>(
        client,
        'shares',
        'id,created_datetime_utc,profile_id,caption_id',
        previousStart,
        end
      )
    ),
    safe('screenshots', () =>
      rows<OverviewTimestamp>(
        client,
        'screenshots',
        'id,created_datetime_utc',
        currentStart,
        end
      )
    ),
    safe('studies', () =>
      rows<OverviewStudy>(
        client,
        'studies',
        'id,slug,created_datetime_utc,start_datetime_utc,end_datetime_utc,is_private'
      )
    ),
    safe('study participation', () =>
      rows<OverviewParticipation>(
        client,
        'study_participations',
        'profile_id,study_id,started_at',
        currentStart,
        end,
        'started_at',
        ['study_id', 'profile_id']
      )
    ),
    safe('study votes', () =>
      rows<OverviewStudyVote>(
        client,
        'study_caption_vote_events',
        'id,created_datetime_utc,mapping:study_caption_mappings!study_caption_vote_events_study_caption_mapping_id_fkey(study_id)',
        currentStart,
        end
      )
    ),
    safe('total users', () => count(client, 'profiles')),
    safe('total captions', () => count(client, 'captions')),
    safe('total shares', () => count(client, 'shares')),
    safe('total screenshots', () => count(client, 'screenshots')),
  ])
  const ids = rankOverviewCaptions(votes.data ?? [], period).map(
    (row) => row.id
  )
  const captionDetails = await safe('caption text', async () => {
    if (!ids.length) return [] as CaptionSummary[]
    const result = await client
      .from('captions')
      .select('id,content')
      .in('id', ids)
      .abortSignal(AbortSignal.timeout(20_000))
    if (result.error || !result.data)
      throw new Error('Caption details unavailable.')
    return result.data
  })
  return buildOverviewDashboard(
    period,
    {
      profiles,
      images,
      captions,
      requests,
      votes,
      shares,
      screenshots,
      studies,
      participations,
      studyVotes,
      captionDetails,
    },
    {
      users: usersTotal,
      captions: captionsTotal,
      shares: sharesTotal,
      screenshots: screenshotsTotal,
    },
    now
  )
}
