import type { Database } from '@/types/supabase'

type Row<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type OverviewResult<T> =
  | { data: T; error: null }
  | { data: null; error: string }
export type GrowthMetric = 'users' | 'images' | 'captions'
export type OverviewPeriod = {
  timeZone: string
  previousStart: string
  currentStart: string
  end: string
  currentDays: string[]
  previousDays: string[]
}
export type OverviewTimestamp = {
  id: string | number
  created_datetime_utc: string
}
export type OverviewActivity = OverviewTimestamp & { profile_id: string | null }
export type OverviewVote = OverviewActivity &
  Pick<Row<'caption_votes'>, 'caption_id' | 'vote_value'>
export type OverviewShare = OverviewActivity & { caption_id: string | null }
export type OverviewStudy = Pick<
  Row<'studies'>,
  | 'id'
  | 'slug'
  | 'created_datetime_utc'
  | 'start_datetime_utc'
  | 'end_datetime_utc'
  | 'is_private'
>
export type OverviewParticipation = Pick<
  Row<'study_participations'>,
  'profile_id' | 'study_id' | 'started_at'
>
export type OverviewStudyVote = OverviewTimestamp & {
  mapping: { study_id: number } | null
}
export type CaptionSummary = Pick<Row<'captions'>, 'id' | 'content'>
export type OverviewSources = {
  profiles: OverviewResult<OverviewTimestamp[]>
  images: OverviewResult<OverviewTimestamp[]>
  captions: OverviewResult<OverviewTimestamp[]>
  requests: OverviewResult<OverviewActivity[]>
  votes: OverviewResult<OverviewVote[]>
  shares: OverviewResult<OverviewShare[]>
  screenshots: OverviewResult<OverviewTimestamp[]>
  studies: OverviewResult<OverviewStudy[]>
  participations: OverviewResult<OverviewParticipation[]>
  studyVotes: OverviewResult<OverviewStudyVote[]>
  captionDetails: OverviewResult<CaptionSummary[]>
}
export type OverviewComparison = {
  current: number
  previous: number
  percent: number | null
}
export type GrowthSeriesPoint = { date: string; previousDate: string } & Record<
  GrowthMetric | `previous${Capitalize<GrowthMetric>}`,
  number
>
export type StudyStatus = 'Open' | 'Scheduled' | 'Ended' | 'Private'
export type StudyProgressRow = {
  id: number
  name: string
  status: StudyStatus
  participants: number
  votes: number
}
export type CaptionPerformanceRow = {
  id: string
  content: string | null
  positive: number
  negative: number
  total: number
  approval: number | null
  shares: number
}

export type OverviewDashboardData = {
  period: OverviewPeriod
  generatedAt: string
  totals: Record<
    'users' | 'captions' | 'shares' | 'screenshots',
    OverviewResult<number>
  >
  growth: OverviewResult<{
    metrics: Record<GrowthMetric, OverviewComparison>
    daily: GrowthSeriesPoint[]
  }>
  activity: OverviewResult<{
    weekly: OverviewComparison
    dailyAverage: number
    returning: number
    daily: { date: string; users: number; previous: number }[]
    breakdown: { name: string; users: number }[]
  }>
  studies: OverviewResult<{
    open: number
    scheduled: number
    ended: number
    private: number
    participants: number
    votes: number
    rows: StudyProgressRow[]
  }>
  performance: OverviewResult<{
    positive: number
    negative: number
    approval: number | null
    shares: number
    screenshots: number
    daily: { date: string; positive: number; negative: number }[]
    captions: CaptionPerformanceRow[]
    detailsUnavailable: boolean
  }>
}
