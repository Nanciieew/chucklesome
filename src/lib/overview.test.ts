import { describe, expect, it } from 'vitest'
import {
  buildOverviewDashboard,
  compareOverview,
  getOverviewPeriod,
  overviewDay,
  rankOverviewCaptions,
  studyStatus,
} from './overview'
import { createOverviewPreview } from './overview-preview'
import type {
  OverviewResult,
  OverviewSources,
  OverviewStudy,
  OverviewVote,
} from '@/types/overview'

const now = new Date('2026-11-12T16:00:00Z')
const period = getOverviewPeriod('UTC', now)
const ok = <T>(data: T): OverviewResult<T> => ({ data, error: null })
const empty = (): OverviewSources => ({
  profiles: ok([]),
  images: ok([]),
  captions: ok([]),
  requests: ok([]),
  votes: ok([]),
  shares: ok([]),
  screenshots: ok([]),
  studies: ok([]),
  participations: ok([]),
  studyVotes: ok([]),
  captionDetails: ok([]),
})
const totals = {
  users: ok(0),
  captions: ok(0),
  shares: ok(0),
  screenshots: ok(0),
}
const stamp = (day: string) => `${day}T12:00:00Z`
const study = (fields: Partial<OverviewStudy> = {}): OverviewStudy => ({
  id: 1,
  slug: 'Test study',
  created_datetime_utc: period.currentStart,
  start_datetime_utc: null,
  end_datetime_utc: null,
  is_private: false,
  ...fields,
})
const vote = (fields: Partial<OverviewVote> = {}): OverviewVote => ({
  id: 'vote',
  profile_id: 'person',
  caption_id: 'caption',
  vote_value: 1,
  created_datetime_utc: period.currentStart,
  ...fields,
})

describe('overview calendar windows', () => {
  it('compares two complete, adjacent seven-day windows and excludes today', () => {
    expect(period.currentDays).toEqual([
      '2026-11-05',
      '2026-11-06',
      '2026-11-07',
      '2026-11-08',
      '2026-11-09',
      '2026-11-10',
      '2026-11-11',
    ])
    expect(period.previousStart).toBe('2026-10-29T00:00:00.000Z')
    expect(period.end).toBe('2026-11-12T00:00:00.000Z')
    expect(overviewDay('2026-11-12T01:00:00Z', 'America/New_York')).toBe(
      '2026-11-11'
    )
  })
  it.each([
    [
      '2026-11-03T12:00:00Z',
      '2026-10-27T04:00:00.000Z',
      '2026-11-03T05:00:00.000Z',
      169,
    ],
    [
      '2026-03-10T12:00:00Z',
      '2026-03-03T05:00:00.000Z',
      '2026-03-10T04:00:00.000Z',
      167,
    ],
  ])(
    'uses calendar days across daylight-saving transitions (%s)',
    (date, start, end, hours) => {
      const result = getOverviewPeriod('America/New_York', new Date(date))
      expect(result.currentStart).toBe(start)
      expect(result.end).toBe(end)
      expect(
        (Date.parse(result.end) - Date.parse(result.currentStart)) / 3600_000
      ).toBe(hours)
    }
  )
  it('supports positive UTC offsets and validates the timezone', () => {
    const tokyo = getOverviewPeriod('Asia/Tokyo', now)
    expect(tokyo.end).toBe('2026-11-12T15:00:00.000Z')
    expect(() => getOverviewPeriod('invalid-zone', now)).toThrow()
  })
})

describe('overview growth and activity', () => {
  it('does not invent an infinite growth percentage from a zero baseline', () => {
    expect(compareOverview(10, 0)).toEqual({
      current: 10,
      previous: 0,
      percent: null,
    })
    expect(compareOverview(0, 0).percent).toBe(0)
    expect(compareOverview(15, 10).percent).toBe(50)
    expect(compareOverview(5, 10).percent).toBe(-50)
  })
  it('zero fills days and ignores records from today and outside the comparison windows', () => {
    const sources = empty()
    sources.profiles = ok([
      { id: 'old', created_datetime_utc: stamp(period.previousDays[0]) },
      { id: 'current', created_datetime_utc: stamp(period.currentDays[2]) },
      { id: 'today', created_datetime_utc: period.end },
      { id: 'ancient', created_datetime_utc: '2025-01-01T00:00:00Z' },
    ])
    const result = buildOverviewDashboard(period, sources, totals, now)
    expect(result.growth.data?.metrics.users).toEqual({
      current: 1,
      previous: 1,
      percent: 0,
    })
    expect(result.growth.data?.daily.map((day) => day.users)).toEqual([
      0, 0, 1, 0, 0, 0, 0,
    ])
  })
  it('deduplicates people across days and activity types, and excludes anonymous API activity', () => {
    const sources = empty()
    sources.requests = ok([
      {
        id: 1,
        profile_id: 'alice',
        created_datetime_utc: stamp(period.currentDays[0]),
      },
      {
        id: 2,
        profile_id: 'alice',
        created_datetime_utc: stamp(period.currentDays[1]),
      },
      {
        id: 3,
        profile_id: 'alice',
        created_datetime_utc: stamp(period.previousDays[0]),
      },
      {
        id: 4,
        profile_id: null,
        created_datetime_utc: stamp(period.currentDays[0]),
      },
    ])
    sources.votes = ok([
      vote({
        profile_id: 'alice',
        created_datetime_utc: stamp(period.currentDays[0]),
      }),
      vote({
        id: 'second',
        profile_id: 'bob',
        created_datetime_utc: stamp(period.currentDays[0]),
      }),
    ])
    sources.shares = ok([
      {
        id: 5,
        profile_id: 'bob',
        caption_id: null,
        created_datetime_utc: stamp(period.currentDays[0]),
      },
    ])
    const active = buildOverviewDashboard(period, sources, totals, now).activity
      .data!
    expect(active.weekly).toEqual({ current: 2, previous: 1, percent: 100 })
    expect(active.daily.map((day) => day.users)).toEqual([2, 1, 0, 0, 0, 0, 0])
    expect(active.dailyAverage).toBe(3 / 7)
    expect(active.returning).toBe(1)
    expect(active.breakdown.map((item) => item.users)).toEqual([1, 2, 1])
  })
  it('isolates failed sources instead of replacing unavailable metrics with zero', () => {
    const sources = empty()
    sources.votes = { data: null, error: 'Access denied' }
    const result = buildOverviewDashboard(period, sources, totals, now)
    expect(result.growth.data).not.toBeNull()
    expect(result.studies.data).not.toBeNull()
    expect(result.activity.data).toBeNull()
    expect(result.performance.data).toBeNull()
    expect(result.performance.error).toBeTruthy()
  })
})

describe('study progress', () => {
  it('classifies visibility and schedule without treating private studies as open', () => {
    expect(studyStatus(study(), now)).toBe('Open')
    expect(studyStatus(study({ is_private: true }), now)).toBe('Private')
    expect(
      studyStatus(study({ start_datetime_utc: '2026-12-01T00:00:00Z' }), now)
    ).toBe('Scheduled')
    expect(
      studyStatus(study({ end_datetime_utc: now.toISOString() }), now)
    ).toBe('Ended')
  })
  it('counts unique participants, assigns votes by study, and puts open studies first', () => {
    const sources = empty()
    sources.studies = ok([study({ id: 2, is_private: true }), study()])
    sources.participations = ok([
      {
        study_id: 1,
        profile_id: 'alice',
        started_at: period.currentStart.replace('.000Z', '+00:00'),
      },
      {
        study_id: 1,
        profile_id: 'alice',
        started_at: stamp(period.currentDays[1]),
      },
      {
        study_id: 2,
        profile_id: 'alice',
        started_at: stamp(period.currentDays[2]),
      },
      { study_id: 1, profile_id: 'today', started_at: period.end },
    ])
    sources.studyVotes = ok([
      {
        id: 1,
        created_datetime_utc: period.currentStart,
        mapping: { study_id: 1 },
      },
      { id: 2, created_datetime_utc: period.currentStart, mapping: null },
    ])
    const result = buildOverviewDashboard(period, sources, totals, now).studies
      .data!
    expect(result.open).toBe(1)
    expect(result.private).toBe(1)
    expect(result.participants).toBe(1)
    expect(result.votes).toBe(1)
    expect(result.rows.map((row) => row.id)).toEqual([1, 2])
    expect(result.rows[0]).toMatchObject({ participants: 1, votes: 1 })
  })
})

describe('caption performance', () => {
  it('excludes neutral votes, handles ISO offset formats, and ranks by positive vote volume', () => {
    const votes = [
      vote({
        id: '1',
        caption_id: 'popular',
        created_datetime_utc: period.currentStart.replace('.000Z', '+00:00'),
      }),
      vote({ id: '2', caption_id: 'popular' }),
      vote({ id: '3', caption_id: 'popular', vote_value: -1 }),
      vote({ id: '4', caption_id: 'tiny-sample' }),
      vote({ id: '5', caption_id: 'neutral', vote_value: 0 }),
      vote({ id: '6', caption_id: 'today', created_datetime_utc: period.end }),
    ]
    const rows = rankOverviewCaptions(votes, period)
    expect(rows.map((row) => row.id)).toEqual(['popular', 'tiny-sample'])
    expect(rows[0]).toMatchObject({ positive: 2, negative: 1, total: 3 })
    expect(rows[0].approval).toBeCloseTo(200 / 3)
  })
  it('shows valid vote totals when caption text is unavailable and leaves no-vote rates empty', () => {
    const sources = empty()
    expect(
      buildOverviewDashboard(period, sources, totals, now).performance.data
        ?.approval
    ).toBeNull()
    sources.votes = ok([vote(), vote({ id: 'negative', vote_value: -1 })])
    sources.shares = ok([
      {
        id: 1,
        profile_id: 'alice',
        caption_id: 'caption',
        created_datetime_utc: period.currentStart,
      },
    ])
    sources.captionDetails = { data: null, error: 'No caption text' }
    const result = buildOverviewDashboard(period, sources, totals, now)
      .performance.data!
    expect(result.approval).toBe(50)
    expect(result.captions[0]).toMatchObject({ shares: 1, content: null })
    expect(result.detailsUnavailable).toBe(true)
  })
})

describe('dashboard preview', () => {
  it.each(['UTC', 'America/New_York', 'Pacific/Kiritimati'])(
    'uses the same calculations as live data in %s',
    (zone) => {
      const data = createOverviewPreview(zone, 'populated', now)
      expect(data.growth.data?.metrics.users.current).toBe(151)
      expect(data.growth.data?.metrics.users.previous).toBe(108)
      expect(data.studies.data?.open).toBe(3)
      expect(data.performance.data?.captions).toHaveLength(5)
      expect(data.activity.data?.weekly.current).toBeGreaterThan(0)
    }
  )
})
