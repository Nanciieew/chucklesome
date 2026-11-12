import {
  buildOverviewDashboard,
  getOverviewPeriod,
  overviewDay,
} from '@/lib/overview'
import type {
  OverviewDashboardData,
  OverviewResult,
  OverviewSources,
} from '@/types/overview'

export function createOverviewPreview(
  timeZone: string,
  state: 'populated' | 'empty' | 'error' = 'populated',
  now = new Date()
): OverviewDashboardData {
  const period = getOverviewPeriod(timeZone, now)
  const ok = <T>(data: T): OverviewResult<T> => ({ data, error: null })
  const sources: OverviewSources = {
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
  }
  const totals: OverviewDashboardData['totals'] = {
    users: ok(0),
    captions: ok(0),
    shares: ok(0),
    screenshots: ok(0),
  }
  if (state === 'empty')
    return buildOverviewDashboard(period, sources, totals, now)
  const stamp = (day: string) => {
    let time = Date.parse(`${day}T12:00:00Z`)
    while (overviewDay(new Date(time), timeZone) > day) time -= 6 * 3600_000
    while (overviewDay(new Date(time), timeZone) < day) time += 6 * 3600_000
    return new Date(time).toISOString()
  }
  const captionIds = [
    'a24f1890-1a11-4111-8111-111111111111',
    'b3947a01-2b22-4222-8222-222222222222',
    'c7a92810-3c33-4333-8333-333333333333',
    'd82c1642-4d44-4444-8444-444444444444',
    'e57901b3-5e55-4555-8555-555555555555',
  ]
  const userCounts = [12, 18, 16, 24, 22, 31, 28],
    priorUsers = [9, 12, 15, 14, 18, 21, 19]
  const imageCounts = [23, 34, 29, 42, 39, 56, 47],
    priorImages = [20, 26, 28, 31, 27, 39, 35]
  const captionCounts = [124, 182, 159, 245, 214, 307, 268],
    priorCaptions = [112, 145, 153, 174, 162, 221, 195]
  for (const [week, days] of [
    period.previousDays,
    period.currentDays,
  ].entries()) {
    for (const [index, day] of days.entries()) {
      const date = stamp(day)
      for (const [key, counts] of [
        ['profiles', week ? userCounts : priorUsers],
        ['images', week ? imageCounts : priorImages],
        ['captions', week ? captionCounts : priorCaptions],
      ] as const) {
        sources[key].data!.push(
          ...Array.from({ length: counts[index] }, (_, i) => ({
            id: `${key}-${week}-${index}-${i}`,
            created_datetime_utc: date,
          }))
        )
      }
      const active = week ? 35 + index * 7 : 25 + index * 6
      for (let i = 0; i < active; i++) {
        sources.requests.data!.push({
          id: `r-${week}-${index}-${i}`,
          created_datetime_utc: date,
          profile_id: `person-${i + index * 3}`,
        })
        for (let j = 0; j < 3; j++)
          sources.votes.data!.push({
            id: `v-${week}-${index}-${i}-${j}`,
            created_datetime_utc: date,
            profile_id: `person-${i + index * 3}`,
            caption_id: captionIds[(i + j) % 5],
            vote_value: (i + j + index) % 6 === 0 ? -1 : 1,
          })
        if (i % 3 === 0)
          sources.shares.data!.push({
            id: `s-${week}-${index}-${i}`,
            created_datetime_utc: date,
            profile_id: `person-${i + index * 3}`,
            caption_id: captionIds[i % 5],
          })
        if (week && i % 5 === 0)
          sources.screenshots.data!.push({
            id: `sc-${index}-${i}`,
            created_datetime_utc: date,
          })
      }
      if (week) {
        for (let i = 0; i < 18 + index * 3; i++)
          sources.participations.data!.push({
            profile_id: `participant-${i}`,
            study_id: 501 + (i % 3),
            started_at: date,
          })
        for (let i = 0; i < 80 + index * 11; i++)
          sources.studyVotes.data!.push({
            id: `sv-${index}-${i}`,
            created_datetime_utc: date,
            mapping: { study_id: 501 + (i % 3) },
          })
      }
    }
  }
  const tomorrow = new Date(now.getTime() + 86400_000).toISOString()
  sources.studies = ok([
    {
      id: 501,
      slug: 'Campus comedy · Round 4',
      created_datetime_utc: period.currentStart,
      start_datetime_utc: period.previousStart,
      end_datetime_utc: tomorrow,
      is_private: false,
    },
    {
      id: 502,
      slug: 'Caption comparison · November',
      created_datetime_utc: period.currentStart,
      start_datetime_utc: period.previousStart,
      end_datetime_utc: null,
      is_private: false,
    },
    {
      id: 503,
      slug: 'Workplace humor pilot',
      created_datetime_utc: period.currentStart,
      start_datetime_utc: period.previousStart,
      end_datetime_utc: tomorrow,
      is_private: false,
    },
    {
      id: 504,
      slug: 'Weekend caption study',
      created_datetime_utc: period.currentStart,
      start_datetime_utc: tomorrow,
      end_datetime_utc: null,
      is_private: false,
    },
    {
      id: 505,
      slug: 'Flavor exploration draft',
      created_datetime_utc: period.currentStart,
      start_datetime_utc: null,
      end_datetime_utc: null,
      is_private: true,
    },
    {
      id: 506,
      slug: 'October baseline',
      created_datetime_utc: period.previousStart,
      start_datetime_utc: period.previousStart,
      end_datetime_utc: period.currentStart,
      is_private: false,
    },
  ])
  sources.captionDetails = ok(
    captionIds.map((id, i) => ({
      id,
      content: [
        'Me checking the calendar as if it can move the deadline.',
        'That could have been an email. The meeting had other plans.',
        'My five-minute break has developed its own schedule.',
        'The group project is a solo adventure with witnesses.',
        'I came prepared. Unfortunately, for a different question.',
      ][i],
    }))
  )
  totals.users = ok(1284)
  totals.captions = ok(24516)
  totals.shares = ok(6742)
  totals.screenshots = ok(2318)
  if (state === 'error') {
    sources.votes = { data: null, error: 'Caption votes could not be loaded.' }
    sources.studyVotes = {
      data: null,
      error: 'Study votes could not be loaded.',
    }
    totals.screenshots = {
      data: null,
      error: 'Screenshots could not be loaded.',
    }
  }
  return buildOverviewDashboard(period, sources, totals, now)
}
