import type {
  CaptionPerformanceRow,
  GrowthMetric,
  OverviewComparison,
  OverviewDashboardData,
  OverviewPeriod,
  OverviewResult,
  OverviewSources,
  OverviewStudy,
  OverviewVote,
  StudyStatus,
} from '@/types/overview'

const dateFormatters = new Map<string, Intl.DateTimeFormat>()
export function overviewDay(
  timestamp: string | Date,
  timeZone: string
): string {
  let formatter = dateFormatters.get(timeZone)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    dateFormatters.set(timeZone, formatter)
  }
  const values = Object.fromEntries(
    formatter
      .formatToParts(new Date(timestamp))
      .map((part) => [part.type, part.value])
  )
  return `${values.year}-${values.month}-${values.day}`
}

function shiftDay(day: string, offset: number): string {
  const date = new Date(`${day}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + offset)
  return date.toISOString().slice(0, 10)
}

// Convert a calendar midnight without assuming that every local day is 24 hours.
function midnight(day: string, timeZone: string): string {
  const target = Date.parse(`${day}T00:00:00Z`)
  let guess = target
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })
  for (let i = 0; i < 4; i++) {
    const p = Object.fromEntries(
      formatter
        .formatToParts(new Date(guess))
        .map((part) => [part.type, part.value])
    )
    const rendered = Date.UTC(
      Number(p.year),
      Number(p.month) - 1,
      Number(p.day),
      Number(p.hour),
      Number(p.minute),
      Number(p.second)
    )
    const adjustment = target - rendered
    if (adjustment === 0) break
    guess += adjustment
  }
  return new Date(guess).toISOString()
}

export function getOverviewPeriod(
  timeZone: string,
  now = new Date()
): OverviewPeriod {
  const today = overviewDay(now, timeZone) // Also validates the supplied IANA time zone.
  const currentDays = Array.from({ length: 7 }, (_, i) =>
    shiftDay(today, i - 7)
  )
  const previousDays = Array.from({ length: 7 }, (_, i) =>
    shiftDay(today, i - 14)
  )
  return {
    timeZone,
    currentDays,
    previousDays,
    currentStart: midnight(currentDays[0], timeZone),
    previousStart: midnight(previousDays[0], timeZone),
    end: midnight(today, timeZone),
  }
}

export function compareOverview(
  current: number,
  previous: number
): OverviewComparison {
  return {
    current,
    previous,
    percent:
      previous === 0
        ? current === 0
          ? 0
          : null
        : ((current - previous) / previous) * 100,
  }
}

export function studyStatus(study: OverviewStudy, now: Date): StudyStatus {
  if (study.is_private) return 'Private'
  if (
    study.end_datetime_utc &&
    Date.parse(study.end_datetime_utc) <= now.getTime()
  )
    return 'Ended'
  if (
    study.start_datetime_utc &&
    Date.parse(study.start_datetime_utc) > now.getTime()
  )
    return 'Scheduled'
  return 'Open'
}

export function rankOverviewCaptions(
  votes: OverviewVote[],
  period: OverviewPeriod
): CaptionPerformanceRow[] {
  const byCaption = new Map<string, CaptionPerformanceRow>()
  const start = Date.parse(period.currentStart),
    end = Date.parse(period.end)
  for (const vote of votes) {
    const timestamp = Date.parse(vote.created_datetime_utc)
    if (!(timestamp >= start && timestamp < end) || vote.vote_value === 0)
      continue
    const row = byCaption.get(vote.caption_id) ?? {
      id: vote.caption_id,
      content: null,
      positive: 0,
      negative: 0,
      total: 0,
      approval: null,
      shares: 0,
    }
    if (vote.vote_value > 0) row.positive++
    else row.negative++
    row.total++
    row.approval = (row.positive / row.total) * 100
    byCaption.set(row.id, row)
  }
  return [...byCaption.values()]
    .sort(
      (a, b) =>
        b.positive - a.positive || b.total - a.total || a.id.localeCompare(b.id)
    )
    .slice(0, 5)
}

export function buildOverviewDashboard(
  period: OverviewPeriod,
  sources: OverviewSources,
  totals: OverviewDashboardData['totals'],
  now = new Date()
): OverviewDashboardData {
  const { currentDays, previousDays, timeZone } = period
  const inCurrentPeriod = (timestamp: string) =>
    Date.parse(timestamp) >= Date.parse(period.currentStart) &&
    Date.parse(timestamp) < Date.parse(period.end)
  const current = new Set(currentDays)
  const previous = new Set(previousDays)
  const countDays = (rows: { created_datetime_utc: string }[]) => {
    const counts = new Map<string, number>()
    for (const row of rows) {
      const day = overviewDay(row.created_datetime_utc, timeZone)
      if (current.has(day) || previous.has(day))
        counts.set(day, (counts.get(day) ?? 0) + 1)
    }
    return counts
  }
  const summarize = (counts: Map<string, number>) =>
    compareOverview(
      currentDays.reduce((sum, day) => sum + (counts.get(day) ?? 0), 0),
      previousDays.reduce((sum, day) => sum + (counts.get(day) ?? 0), 0)
    )
  const failure = <T>(message: string): OverviewResult<T> => ({
    data: null,
    error: message,
  })
  let growth: OverviewDashboardData['growth'] = failure(
    'Weekly growth could not be loaded. Try refreshing.'
  )
  if (sources.profiles.data && sources.images.data && sources.captions.data) {
    const counts: Record<GrowthMetric, Map<string, number>> = {
      users: countDays(sources.profiles.data),
      images: countDays(sources.images.data),
      captions: countDays(sources.captions.data),
    }
    growth = {
      error: null,
      data: {
        metrics: {
          users: summarize(counts.users),
          images: summarize(counts.images),
          captions: summarize(counts.captions),
        },
        daily: currentDays.map((date, i) => ({
          date,
          previousDate: previousDays[i],
          users: counts.users.get(date) ?? 0,
          images: counts.images.get(date) ?? 0,
          captions: counts.captions.get(date) ?? 0,
          previousUsers: counts.users.get(previousDays[i]) ?? 0,
          previousImages: counts.images.get(previousDays[i]) ?? 0,
          previousCaptions: counts.captions.get(previousDays[i]) ?? 0,
        })),
      },
    }
  }
  let activity: OverviewDashboardData['activity'] = failure(
    'Active users could not be loaded. Try refreshing.'
  )
  if (sources.requests.data && sources.votes.data && sources.shares.data) {
    const groups = [
      { name: 'Requested captions', rows: sources.requests.data },
      { name: 'Voted', rows: sources.votes.data },
      { name: 'Shared', rows: sources.shares.data },
    ]
    const usersByDay = new Map<string, Set<string>>()
    const thisWeek = new Set<string>(),
      lastWeek = new Set<string>()
    const breakdown = groups.map((group) => {
      const users = new Set<string>()
      for (const row of group.rows) {
        if (!row.profile_id) continue
        const day = overviewDay(row.created_datetime_utc, timeZone)
        if (!current.has(day) && !previous.has(day)) continue
        const set = usersByDay.get(day) ?? new Set<string>()
        set.add(row.profile_id)
        usersByDay.set(day, set)
        if (current.has(day)) {
          thisWeek.add(row.profile_id)
          users.add(row.profile_id)
        } else lastWeek.add(row.profile_id)
      }
      return { name: group.name, users: users.size }
    })
    const daily = currentDays.map((date, i) => ({
      date,
      users: usersByDay.get(date)?.size ?? 0,
      previous: usersByDay.get(previousDays[i])?.size ?? 0,
    }))
    activity = {
      error: null,
      data: {
        weekly: compareOverview(thisWeek.size, lastWeek.size),
        dailyAverage: daily.reduce((sum, point) => sum + point.users, 0) / 7,
        returning: [...thisWeek].filter((id) => lastWeek.has(id)).length,
        daily,
        breakdown,
      },
    }
  }
  let studies: OverviewDashboardData['studies'] = failure(
    'Study progress could not be loaded. Try refreshing.'
  )
  if (
    sources.studies.data &&
    sources.participations.data &&
    sources.studyVotes.data
  ) {
    const participants = new Map<number, Set<string>>()
    const allParticipants = new Set<string>()
    for (const row of sources.participations.data) {
      if (!inCurrentPeriod(row.started_at)) continue
      const users = participants.get(row.study_id) ?? new Set<string>()
      users.add(row.profile_id)
      participants.set(row.study_id, users)
      allParticipants.add(row.profile_id)
    }
    const voteCounts = new Map<number, number>()
    for (const row of sources.studyVotes.data) {
      if (!row.mapping || !inCurrentPeriod(row.created_datetime_utc)) continue
      voteCounts.set(
        row.mapping.study_id,
        (voteCounts.get(row.mapping.study_id) ?? 0) + 1
      )
    }
    const statuses = { Open: 0, Scheduled: 0, Ended: 0, Private: 0 }
    const rows = sources.studies.data.map((study) => {
      const status = studyStatus(study, now)
      statuses[status]++
      return {
        id: study.id,
        name: study.slug?.trim() || `Study ${study.id}`,
        status,
        participants: participants.get(study.id)?.size ?? 0,
        votes: voteCounts.get(study.id) ?? 0,
        created: study.created_datetime_utc,
      }
    })
    const order: Record<StudyStatus, number> = {
      Open: 0,
      Scheduled: 1,
      Private: 2,
      Ended: 3,
    }
    rows.sort(
      (a, b) =>
        order[a.status] - order[b.status] ||
        b.created.localeCompare(a.created) ||
        b.id - a.id
    )
    studies = {
      error: null,
      data: {
        open: statuses.Open,
        scheduled: statuses.Scheduled,
        ended: statuses.Ended,
        private: statuses.Private,
        participants: allParticipants.size,
        votes: [...voteCounts.values()].reduce((sum, value) => sum + value, 0),
        rows: rows.slice(0, 6).map(({ created: _created, ...row }) => row),
      },
    }
  }
  let performance: OverviewDashboardData['performance'] = failure(
    'Caption performance could not be loaded. Try refreshing.'
  )
  if (sources.votes.data && sources.shares.data && sources.screenshots.data) {
    const daily = currentDays.map((date) => ({
      date,
      positive: 0,
      negative: 0,
    }))
    const byDay = new Map(daily.map((point) => [point.date, point]))
    for (const vote of sources.votes.data) {
      const point = byDay.get(overviewDay(vote.created_datetime_utc, timeZone))
      if (point && vote.vote_value > 0) point.positive++
      if (point && vote.vote_value < 0) point.negative++
    }
    const positive = daily.reduce((sum, point) => sum + point.positive, 0)
    const negative = daily.reduce((sum, point) => sum + point.negative, 0)
    const details = new Map(
      (sources.captionDetails.data ?? []).map((row) => [row.id, row.content])
    )
    const shareCounts = new Map<string, number>()
    let shares = 0,
      screenshots = 0
    for (const share of sources.shares.data) {
      if (!current.has(overviewDay(share.created_datetime_utc, timeZone)))
        continue
      shares++
      if (share.caption_id)
        shareCounts.set(
          share.caption_id,
          (shareCounts.get(share.caption_id) ?? 0) + 1
        )
    }
    for (const screenshot of sources.screenshots.data)
      if (current.has(overviewDay(screenshot.created_datetime_utc, timeZone)))
        screenshots++
    performance = {
      error: null,
      data: {
        positive,
        negative,
        approval:
          positive + negative ? (positive / (positive + negative)) * 100 : null,
        shares,
        screenshots,
        daily,
        captions: rankOverviewCaptions(sources.votes.data, period).map(
          (row) => ({
            ...row,
            content: details.get(row.id) ?? null,
            shares: shareCounts.get(row.id) ?? 0,
          })
        ),
        detailsUnavailable: sources.captionDetails.error !== null,
      },
    }
  }
  return {
    period,
    totals,
    growth,
    activity,
    studies,
    performance,
    generatedAt: now.toISOString(),
  }
}
