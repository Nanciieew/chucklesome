'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { ArrowRight, ChevronRight } from 'lucide-react'
import { ADMIN_PAGES, getAdminNavigation } from '@/lib/admin-navigation'
import { isJobId } from '@/utils/caption-jobs'

const ACTION_PAGES = new Set([
  'study-wizard',
  'study-quick',
  'generate-captions',
  'common-use-upload',
  'qr-generator',
  'users-bulk-permissions',
])

export default function AdminNavigationGuide({
  preview = false,
}: {
  preview?: boolean
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const context = getAdminNavigation(preview ? '/overview' : pathname)
  if (!context || context.page.id === 'overview') return null
  const { page, breadcrumbs, isDetail } = context
  const overview = page.id === 'overview'
  const jobId = searchParams.get('jobId')
  const showJobReturn =
    !preview &&
    isDetail &&
    context.group.id === 'caption-generation' &&
    jobId &&
    isJobId(jobId)
  const related = page.related.flatMap((id) => {
    const entry = ADMIN_PAGES.find((item) => item.id === id)
    return entry ? [entry] : []
  })
  return (
    <div
      className="mb-5 space-y-3"
      style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
    >
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          {breadcrumbs.map((crumb, index) => (
            <li
              key={`${index}-${crumb.label}`}
              className="flex min-w-0 items-center gap-2"
            >
              {index > 0 && (
                <ChevronRight
                  className="h-3.5 w-3.5 shrink-0"
                  aria-hidden="true"
                />
              )}
              {crumb.href ? (
                <Link
                  href={preview ? '/admin-preview' : crumb.href}
                  className="rounded-sm text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  className="break-all"
                  aria-current={
                    index === breadcrumbs.length - 1 ? 'page' : undefined
                  }
                >
                  {crumb.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      {showJobReturn && (
        <Link
          href={`/caption-job/${jobId}`}
          className="inline-flex rounded-md text-sm font-medium text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Return to Caption Job {jobId}
        </Link>
      )}
      <section
        aria-label={overview ? 'Overview shortcuts' : 'Page guidance'}
        className="rounded-xl border border-border bg-card p-4 animate-in fade-in-0 duration-200"
      >
        {!overview && (
          <>
            <p className="text-sm font-semibold">About {page.label}</p>
            <p className="mt-1 max-w-4xl text-sm leading-relaxed text-muted-foreground">
              {page.description}
            </p>
          </>
        )}
        {related.length > 0 && (
          <>
            {!overview && (
              <p className="mb-2 mt-3 text-xs font-medium text-muted-foreground">
                {isDetail ? 'Browse related pages' : 'Continue with'}
              </p>
            )}
            <ul
              className={
                overview
                  ? 'grid gap-3 sm:grid-cols-2 xl:grid-cols-4'
                  : 'flex flex-wrap gap-2'
              }
            >
              {related.map((entry) => (
                <li key={entry.id}>
                  <Link
                    href={preview ? '/admin-preview' : entry.href}
                    title={
                      preview ? 'Dashboard preview only' : entry.description
                    }
                    className={
                      overview
                        ? 'group flex h-full items-start justify-between gap-3 rounded-lg border bg-background p-3 transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                        : 'inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1.5 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                    }
                  >
                    <span>
                      <span className="font-medium">
                        {isDetail && !ACTION_PAGES.has(entry.id)
                          ? `All ${entry.label}`
                          : entry.label}
                      </span>
                      {overview && (
                        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                          {entry.description}
                        </span>
                      )}
                    </span>
                    <ArrowRight
                      aria-hidden="true"
                      className="mt-0.5 h-3.5 w-3.5 shrink-0"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  )
}
