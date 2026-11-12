'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Camera,
  CheckCircle2,
  FileText,
  FlaskConical,
  Images,
  RefreshCw,
  Share2,
  Users,
  AlertCircle,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Button } from '@/components/ui/button'
import { useTimeZone } from '@/components/TimeZoneContext'
import { fetchOverviewDashboard } from '@/app/actions/overview-dashboard'
import { getOverviewPeriod } from '@/lib/overview'
import { cn } from '@/lib/utils'
import type {
  GrowthMetric,
  OverviewComparison,
  OverviewDashboardData,
  OverviewResult,
  StudyStatus,
} from '@/types/overview'

const number = (value: number) =>
  value.toLocaleString('en-US', { maximumFractionDigits: 1 })
const percent = (value: number | null) =>
  value === null ? '—' : `${number(value)}%`
const day = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T12:00:00Z`))
const compact = (value: number) =>
  Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
const GROWTH = {
  users: {
    label: 'New users',
    icon: Users,
    href: '/users',
    previous: 'previousUsers',
  },
  images: {
    label: 'New images',
    icon: Images,
    href: '/images',
    previous: 'previousImages',
  },
  captions: {
    label: 'New captions',
    icon: FileText,
    href: '/captions',
    previous: 'previousCaptions',
  },
} as const
const statusStyle: Record<StudyStatus, string> = {
  Open: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  Scheduled: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  Ended: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
  Private: 'bg-violet-500/10 text-violet-700 dark:text-violet-400',
}

function Comparison({ value }: { value: OverviewComparison }) {
  const up = value.current > value.previous
  const down = value.current < value.previous
  const Icon = down ? ArrowDownRight : ArrowUpRight
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium',
          up
            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
            : down
              ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
              : 'bg-muted text-muted-foreground'
        )}
      >
        {(up || down) && <Icon className="h-3 w-3" aria-hidden="true" />}
        {value.percent === null
          ? 'New activity'
          : `${number(Math.abs(value.percent))}%${down ? ' decrease' : up ? ' increase' : ' change'}`}
      </span>
      <span className="text-muted-foreground">
        vs {number(value.previous)} last week
      </span>
    </div>
  )
}

function Metric({
  label,
  value,
  icon: Icon,
  href,
  children,
  accent = false,
}: {
  label: string
  value: number | string | null
  icon?: LucideIcon
  href?: string
  children?: ReactNode
  accent?: boolean
}) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-2 text-[13px] text-muted-foreground sm:text-sm">
        <span className="min-w-0 break-words">{label}</span>
        {Icon && (
          <Icon
            className="hidden h-4 w-4 shrink-0 lg:block"
            aria-hidden="true"
          />
        )}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-foreground sm:text-3xl">
        {value === null
          ? '—'
          : typeof value === 'number'
            ? number(value)
            : value}
      </div>
      {children}
    </>
  )
  const classes = cn(
    'block min-w-0 rounded-xl border p-4 transition-colors',
    accent
      ? 'border-primary/20 bg-primary/5'
      : 'border-border/70 bg-background/70',
    href &&
      'hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
  )
  return href ? (
    <Link href={href} className={classes}>
      {content}
    </Link>
  ) : (
    <div className={classes}>{content}</div>
  )
}

function Panel({
  id,
  title,
  description,
  icon: Icon,
  href,
  children,
}: {
  id: string
  title: string
  description: string
  icon: LucideIcon
  href: string
  children: ReactNode
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="min-w-0 scroll-mt-20 overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm animate-in fade-in-0 slide-in-from-bottom-2 duration-500"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 px-5 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h2
              id={`${id}-title`}
              className="text-lg font-semibold tracking-tight"
            >
              {title}
            </h2>
            <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 rounded-md py-1 text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          View details <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
      <div className="space-y-5 p-5 sm:p-6">{children}</div>
    </section>
  )
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-8 text-center text-sm text-muted-foreground">
      <BarChart3 className="h-6 w-6 opacity-50" aria-hidden="true" />
      <p>{children}</p>
    </div>
  )
}

function SectionState<T>({
  result,
  children,
  retry,
}: {
  result?: OverviewResult<T>
  children: (data: T) => ReactNode
  retry: () => void
}) {
  if (!result)
    return (
      <div aria-label="Loading section" className="space-y-4 animate-pulse">
        <div className="grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((id) => (
            <div key={id} className="h-24 rounded-xl bg-muted" />
          ))}
        </div>
        <div className="h-48 rounded-xl bg-muted/70" />
        <span className="sr-only">Loading dashboard data</span>
      </div>
    )
  if (result.error !== null)
    return (
      <div
        role="status"
        className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5"
      >
        <p className="flex items-center gap-2 text-sm font-medium">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          Data unavailable
        </p>
        <p className="mt-2 text-sm text-muted-foreground">{result.error}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={retry}>
          Try again
        </Button>
      </div>
    )
  return <>{children(result.data)}</>
}

function ChartLegend({
  active = 'This week',
  color = 'bg-primary',
  previous = true,
}: {
  active?: string
  color?: string
  previous?: boolean
}) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-2">
        <span className={cn('h-2 w-2 rounded-full', color)} />
        {active}
      </span>
      {previous && (
        <span className="inline-flex items-center gap-2">
          <span className="w-4 border-t-2 border-dashed border-slate-400" />
          Previous week
        </span>
      )}
    </div>
  )
}

export default function OverviewDashboard({
  preview,
}: { preview?: OverviewDashboardData } = {}) {
  const { timeZone } = useTimeZone()
  const [data, setData] = useState<OverviewDashboardData | null>(
    preview ?? null
  )
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(!preview)
  const [refresh, setRefresh] = useState(0)
  const [metric, setMetric] = useState<GrowthMetric>('captions')
  const retry = () => setRefresh((value) => value + 1)
  const href = (path: string) => (preview ? '/admin-preview' : path)
  useEffect(() => {
    if (preview) {
      setData(preview)
      return
    }
    let alive = true
    setLoading(true)
    setData(null)
    setError(null)
    fetchOverviewDashboard(timeZone)
      .then((result) => {
        if (!alive) return
        if (result.error !== null) setError(result.error)
        else setData(result.data)
      })
      .catch(() => {
        if (alive)
          setError(
            'The overview could not be loaded. Try refreshing or signing in again.'
          )
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [timeZone, refresh, preview])
  const period = data?.period ?? getOverviewPeriod(timeZone)
  const range = `${day(period.currentDays[0])} – ${day(period.currentDays[6])}`
  const totals = [
    { key: 'users', label: 'Total users', icon: Users, href: '/users' },
    {
      key: 'captions',
      label: 'Total captions',
      icon: FileText,
      href: '/captions',
    },
    {
      key: 'shares',
      label: 'Total shares',
      icon: Share2,
      href: '/insights/sharing',
    },
    {
      key: 'screenshots',
      label: 'Total screenshots',
      icon: Camera,
      href: '/insights/sharing',
    },
  ] as const

  return (
    <div
      className="min-w-0 space-y-6"
      style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
    >
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-widest text-primary">
            Workspace pulse
          </p>
          <h1 className="page-title">Overview</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Growth, engagement, and research at a glance.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm">
            <CalendarDays
              className="h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            {range}
          </span>
          <Button
            variant="outline"
            size="icon"
            aria-label="Refresh overview"
            title="Refresh overview"
            disabled={loading || !!preview}
            onClick={retry}
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
        </div>
      </header>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          Last 7 complete days · compared with the previous 7 ·{' '}
          {period.timeZone}
        </span>
        {data && (
          <span>
            {preview
              ? 'Illustrative sample data'
              : `Updated ${new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: period.timeZone }).format(new Date(data.generatedAt))}`}
          </span>
        )}
      </div>
      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-5"
        >
          <p className="font-medium">Overview unavailable</p>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Button className="mt-4" onClick={retry}>
            Try again
          </Button>
        </div>
      ) : (
        <>
          <div
            className="grid grid-cols-2 gap-3 xl:grid-cols-4"
            aria-label="All-time totals"
          >
            {totals.map((total) => (
              <Metric
                key={total.key}
                label={total.label}
                value={loading ? '…' : (data?.totals[total.key].data ?? null)}
                icon={total.icon}
                href={href(total.href)}
              >
                <p className="mt-2 text-xs text-muted-foreground">
                  {loading
                    ? 'Loading…'
                    : data?.totals[total.key].error
                      ? 'Unavailable · refresh to retry'
                      : 'All time'}
                </p>
              </Metric>
            ))}
          </div>
          <nav
            aria-label="Overview sections"
            className="flex flex-wrap gap-2 border-b border-border/60 pb-4"
          >
            {[
              ['growth', 'Weekly growth', TrendingUp],
              ['active-users', 'Active users', Activity],
              ['study-progress', 'Study progress', FlaskConical],
              ['caption-performance', 'Caption performance', BarChart3],
            ].map(([id, label, Icon]) => {
              const SectionIcon = Icon as LucideIcon
              return (
                <a
                  key={id as string}
                  href={`#${id}`}
                  className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <SectionIcon
                    className="h-3.5 w-3.5 text-primary"
                    aria-hidden="true"
                  />
                  {label as string}
                </a>
              )
            })}
          </nav>

          <Panel
            id="growth"
            title="Weekly growth"
            description="New people and content, with a like-for-like weekly comparison."
            icon={TrendingUp}
            href={href('/insights')}
          >
            <SectionState result={data?.growth} retry={retry}>
              {(growth) => (
                <>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {(Object.keys(GROWTH) as GrowthMetric[]).map((key) => (
                      <Metric
                        key={key}
                        label={GROWTH[key].label}
                        value={growth.metrics[key].current}
                        icon={GROWTH[key].icon}
                        href={href(GROWTH[key].href)}
                        accent={metric === key}
                      >
                        <Comparison value={growth.metrics[key]} />
                      </Metric>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div
                      role="group"
                      aria-label="Growth chart metric"
                      className="inline-flex flex-wrap rounded-lg bg-muted/70 p-1"
                    >
                      {(Object.keys(GROWTH) as GrowthMetric[]).map((key) => (
                        <button
                          key={key}
                          type="button"
                          aria-pressed={metric === key}
                          onClick={() => setMetric(key)}
                          className={cn(
                            'rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                            metric === key
                              ? 'bg-background text-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          {GROWTH[key].label}
                        </button>
                      ))}
                    </div>
                    <ChartLegend />
                  </div>
                  {growth.daily.every(
                    (point) =>
                      point[metric] === 0 &&
                      point[GROWTH[metric].previous] === 0
                  ) ? (
                    <Empty>
                      No {GROWTH[metric].label.toLowerCase()} were recorded in
                      either week.
                    </Empty>
                  ) : (
                    <figure
                      aria-label={`${GROWTH[metric].label} per day compared with the previous week`}
                    >
                      <ChartContainer
                        className="h-60 w-full aspect-auto"
                        config={{
                          [metric]: {
                            label: GROWTH[metric].label,
                            color: 'hsl(var(--primary))',
                          },
                          [GROWTH[metric].previous]: {
                            label: 'Previous week',
                            color: '#94a3b8',
                          },
                        }}
                      >
                        <LineChart
                          accessibilityLayer
                          data={growth.daily}
                          margin={{ top: 12, right: 14, left: -15, bottom: 0 }}
                        >
                          <CartesianGrid
                            vertical={false}
                            strokeDasharray="3 3"
                          />
                          <XAxis
                            dataKey="date"
                            tickFormatter={day}
                            tickLine={false}
                            axisLine={false}
                            tickMargin={10}
                            minTickGap={15}
                          />
                          <YAxis
                            allowDecimals={false}
                            tickFormatter={compact}
                            tickLine={false}
                            axisLine={false}
                          />
                          <ChartTooltip
                            content={
                              <ChartTooltipContent
                                labelFormatter={(label) => day(String(label))}
                              />
                            }
                          />
                          <Line
                            type="monotone"
                            dataKey={GROWTH[metric].previous}
                            stroke="#94a3b8"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={false}
                            isAnimationActive
                            animationDuration={650}
                          />
                          <Line
                            type="monotone"
                            dataKey={metric}
                            stroke="hsl(var(--primary))"
                            strokeWidth={3}
                            dot={{ r: 3 }}
                            activeDot={{ r: 5 }}
                            isAnimationActive
                            animationDuration={650}
                          />
                        </LineChart>
                      </ChartContainer>
                      <figcaption className="mt-2 text-xs text-muted-foreground">
                        Previous-week values align by weekday. Counts include
                        all newly saved records.
                      </figcaption>
                    </figure>
                  )}
                </>
              )}
            </SectionState>
          </Panel>

          <div className="grid items-start gap-6 xl:grid-cols-2">
            <Panel
              id="active-users"
              title="Active users"
              description="People who requested captions, voted, or shared content."
              icon={Activity}
              href={href('/insights/user')}
            >
              <SectionState result={data?.activity} retry={retry}>
                {(activity) => (
                  <>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Metric
                        label="Weekly active"
                        value={activity.weekly.current}
                        icon={Users}
                        accent
                      >
                        <Comparison value={activity.weekly} />
                      </Metric>
                      <Metric
                        label="Daily average"
                        value={activity.dailyAverage}
                      >
                        <p className="mt-2 text-xs text-muted-foreground">
                          Unique people per day
                        </p>
                      </Metric>
                      <Metric
                        label="Active both weeks"
                        value={activity.returning}
                      >
                        <p className="mt-2 text-xs text-muted-foreground">
                          Present in both periods
                        </p>
                      </Metric>
                    </div>
                    <ChartLegend
                      active="Daily active people"
                      color="bg-cyan-600"
                      previous={false}
                    />
                    {activity.weekly.current === 0 ? (
                      <Empty>
                        No identifiable user activity was recorded this week.
                      </Empty>
                    ) : (
                      <ChartContainer
                        className="h-48 w-full aspect-auto"
                        config={{
                          users: { label: 'Active people', color: '#0891b2' },
                        }}
                        aria-label="Unique active people by day"
                      >
                        <AreaChart
                          accessibilityLayer
                          data={activity.daily}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid
                            vertical={false}
                            strokeDasharray="3 3"
                          />
                          <XAxis
                            dataKey="date"
                            tickFormatter={day}
                            axisLine={false}
                            tickLine={false}
                            minTickGap={15}
                          />
                          <YAxis
                            allowDecimals={false}
                            tickFormatter={compact}
                            axisLine={false}
                            tickLine={false}
                          />
                          <ChartTooltip
                            content={
                              <ChartTooltipContent
                                labelFormatter={(label) => day(String(label))}
                              />
                            }
                          />
                          <Area
                            type="monotone"
                            dataKey="users"
                            stroke="#0891b2"
                            fill="#0891b2"
                            fillOpacity={0.12}
                            strokeWidth={2.5}
                            isAnimationActive
                            animationDuration={650}
                          />
                        </AreaChart>
                      </ChartContainer>
                    )}
                    <div className="space-y-3 border-t pt-4">
                      <h3 className="text-sm font-medium">
                        How people participated
                      </h3>
                      {activity.breakdown.map((item) => (
                        <div key={item.name}>
                          <div className="mb-1.5 flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              {item.name}
                            </span>
                            <span className="font-medium tabular-nums">
                              {number(item.users)}
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-cyan-600 transition-[width] duration-700"
                              style={{
                                width: `${activity.weekly.current ? (item.users / activity.weekly.current) * 100 : 0}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        Each person is counted once per day or week. Activity
                        categories can overlap; API requests without a user are
                        excluded.
                      </p>
                    </div>
                  </>
                )}
              </SectionState>
            </Panel>

            <Panel
              id="study-progress"
              title="Study progress"
              description="Study status now, with participation and votes during the week."
              icon={FlaskConical}
              href={href('/studies')}
            >
              <SectionState result={data?.studies} retry={retry}>
                {(studies) => (
                  <>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Metric
                        label="Open studies"
                        value={studies.open}
                        icon={FlaskConical}
                        accent
                      />
                      <Metric
                        label="Participants"
                        value={studies.participants}
                        icon={Users}
                      />
                      <Metric
                        label="Study votes"
                        value={studies.votes}
                        icon={CheckCircle2}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {[
                        ['Open', studies.open],
                        ['Scheduled', studies.scheduled],
                        ['Ended', studies.ended],
                        ['Private', studies.private],
                      ].map(([status, count]) => (
                        <span
                          key={status as string}
                          className={cn(
                            'rounded-full px-2.5 py-1 font-medium',
                            statusStyle[status as StudyStatus]
                          )}
                        >
                          {status} · {count}
                        </span>
                      ))}
                    </div>
                    {studies.rows.length === 0 ? (
                      <Empty>
                        No studies are available yet. Create a study to begin
                        tracking participation.
                      </Empty>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border">
                        <table className="w-full min-w-[450px] text-left text-xs">
                          <caption className="sr-only">
                            Recent studies, with open studies first.
                            Participants and votes are for the displayed week.
                          </caption>
                          <thead className="bg-muted/60 text-muted-foreground">
                            <tr>
                              {['Id', 'Study', 'Status', 'People', 'Votes'].map(
                                (label) => (
                                  <th
                                    key={label}
                                    scope="col"
                                    className="px-3 py-3 font-medium"
                                  >
                                    {label}
                                  </th>
                                )
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {studies.rows.map((study) => (
                              <tr
                                key={study.id}
                                className="transition-colors hover:bg-muted/40"
                              >
                                <td className="px-3 py-3 font-mono">
                                  <Link
                                    href={href(`/study/${study.id}`)}
                                    className="text-primary underline-offset-4 hover:underline"
                                  >
                                    {study.id}
                                  </Link>
                                </td>
                                <td className="max-w-52 px-3 py-3">
                                  <Link
                                    href={href(`/study/${study.id}`)}
                                    className="line-clamp-2 font-medium text-foreground hover:text-primary"
                                  >
                                    {study.name}
                                  </Link>
                                </td>
                                <td className="px-3 py-3">
                                  <span
                                    className={cn(
                                      'inline-block rounded-full px-2 py-1 font-medium',
                                      statusStyle[study.status]
                                    )}
                                  >
                                    {study.status}
                                  </span>
                                </td>
                                <td className="px-3 py-3 tabular-nums">
                                  {number(study.participants)}
                                </td>
                                <td className="px-3 py-3 tabular-nums">
                                  {number(study.votes)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Open public studies appear first, then scheduled, private,
                      and ended studies. Participants are people who started a
                      study this week; votes must have a study association.
                    </p>
                  </>
                )}
              </SectionState>
            </Panel>
          </div>

          <Panel
            id="caption-performance"
            title="Caption performance"
            description="Audience feedback and sharing, backed by the number of votes."
            icon={BarChart3}
            href={href('/insights')}
          >
            <SectionState result={data?.performance} retry={retry}>
              {(performance) => (
                <>
                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <Metric
                      label="Positive-vote rate"
                      value={percent(performance.approval)}
                      icon={TrendingUp}
                      accent
                    >
                      <p className="mt-2 text-xs text-muted-foreground">
                        {number(performance.positive)} positive /{' '}
                        {number(performance.positive + performance.negative)}{' '}
                        scored votes
                      </p>
                    </Metric>
                    <Metric
                      label="Scored votes"
                      value={performance.positive + performance.negative}
                      icon={CheckCircle2}
                    >
                      <p className="mt-2 text-xs text-muted-foreground">
                        Positive and negative votes
                      </p>
                    </Metric>
                    <Metric
                      label="Shares"
                      value={performance.shares}
                      icon={Share2}
                      href={href('/insights/sharing')}
                    />
                    <Metric
                      label="Screenshots"
                      value={performance.screenshots}
                      icon={Camera}
                      href={href('/insights/sharing')}
                    />
                  </div>
                  {performance.positive + performance.negative === 0 ? (
                    <Empty>
                      No positive or negative caption votes were recorded this
                      week. Shares and screenshots are shown separately above.
                    </Empty>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-600" />
                          Positive votes
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-rose-500" />
                          Negative votes
                        </span>
                      </div>
                      <ChartContainer
                        className="h-48 w-full aspect-auto"
                        config={{
                          positive: {
                            label: 'Positive votes',
                            color: '#059669',
                          },
                          negative: {
                            label: 'Negative votes',
                            color: '#f43f5e',
                          },
                        }}
                        aria-label="Positive and negative caption votes per day"
                      >
                        <BarChart
                          accessibilityLayer
                          data={performance.daily}
                          margin={{ top: 6, right: 12, left: -15, bottom: 0 }}
                        >
                          <CartesianGrid
                            vertical={false}
                            strokeDasharray="3 3"
                          />
                          <XAxis
                            dataKey="date"
                            tickFormatter={day}
                            axisLine={false}
                            tickLine={false}
                            minTickGap={15}
                          />
                          <YAxis
                            allowDecimals={false}
                            tickFormatter={compact}
                            axisLine={false}
                            tickLine={false}
                          />
                          <ChartTooltip
                            content={
                              <ChartTooltipContent
                                labelFormatter={(label) => day(String(label))}
                              />
                            }
                          />
                          <Bar
                            dataKey="positive"
                            stackId="votes"
                            fill="#059669"
                            isAnimationActive
                            animationDuration={650}
                            maxBarSize={42}
                          />
                          <Bar
                            dataKey="negative"
                            stackId="votes"
                            fill="#f43f5e"
                            radius={[4, 4, 0, 0]}
                            isAnimationActive
                            animationDuration={650}
                            maxBarSize={42}
                          />
                        </BarChart>
                      </ChartContainer>
                      <div>
                        <h3 className="text-sm font-semibold">
                          Leading captions this week
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Ranked by positive votes, then total scored votes.
                          Rates include their sample size.
                        </p>
                      </div>
                      {performance.detailsUnavailable && (
                        <p
                          role="status"
                          className="text-xs text-amber-700 dark:text-amber-400"
                        >
                          Caption text is unavailable. Vote totals and caption
                          links are still shown.
                        </p>
                      )}
                      <div className="overflow-x-auto rounded-xl border">
                        <table className="w-full min-w-[680px] text-left text-sm">
                          <caption className="sr-only">
                            Top five captions ranked by positive votes during
                            the displayed week.
                          </caption>
                          <thead className="bg-muted/60 text-xs text-muted-foreground">
                            <tr>
                              {[
                                'Id',
                                'Caption',
                                'Positive',
                                'Total votes',
                                'Positive rate',
                                'Shares',
                              ].map((label) => (
                                <th
                                  key={label}
                                  scope="col"
                                  className="px-4 py-3 font-medium"
                                >
                                  {label}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {performance.captions.map((caption) => (
                              <tr
                                key={caption.id}
                                className="transition-colors hover:bg-muted/40"
                              >
                                <td className="px-4 py-4 font-mono text-xs">
                                  <Link
                                    href={href(`/caption/${caption.id}`)}
                                    title={caption.id}
                                    className="text-primary underline-offset-4 hover:underline"
                                  >
                                    {caption.id.slice(0, 8)}
                                    {caption.id.length > 8 ? '…' : ''}
                                  </Link>
                                </td>
                                <td className="max-w-lg px-4 py-4">
                                  <Link
                                    href={href(`/caption/${caption.id}`)}
                                    className="line-clamp-2 font-medium hover:text-primary"
                                  >
                                    {caption.content ||
                                      'Caption text unavailable'}
                                  </Link>
                                </td>
                                <td className="px-4 py-4 tabular-nums">
                                  {number(caption.positive)}
                                </td>
                                <td className="px-4 py-4 tabular-nums">
                                  {number(caption.total)}
                                </td>
                                <td className="px-4 py-4">
                                  <span className="font-medium tabular-nums">
                                    {percent(caption.approval)}
                                  </span>
                                  <div className="mt-1.5 h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                                    <div
                                      className="h-full rounded-full bg-emerald-600 transition-[width] duration-700"
                                      style={{
                                        width: `${caption.approval ?? 0}%`,
                                      }}
                                    />
                                  </div>
                                </td>
                                <td className="px-4 py-4 tabular-nums">
                                  {number(caption.shares)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Uses caption vote records created during the displayed week.
                    Neutral votes are excluded from the positive-vote rate; an
                    empty sample has no rate.
                  </p>
                </>
              )}
            </SectionState>
          </Panel>
        </>
      )}
    </div>
  )
}
