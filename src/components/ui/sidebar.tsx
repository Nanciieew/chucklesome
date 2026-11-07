'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  ChevronDown,
  Users,
  Home,
  Layers,
  PanelsTopLeft,
  Bot,
  ListChecks,
  BarChart3,
  FlaskConical,
  LogOut,
  Settings,
} from 'lucide-react'
import {
  ADMIN_NAVIGATION,
  getAdminNavigation,
  parseSidebarGroups,
} from '@/lib/admin-navigation'

import { cn } from '@/lib/utils'
import TimezoneSelect from '@/components/TimezoneSelect'
import { Button } from '@/components/ui/button'
import { signOutAction } from '@/app/actions'
import { checkAuth } from '@/utils/auth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme } from 'next-themes'

const GROUP_ICONS = {
  overview: Home,
  content: PanelsTopLeft,
  'caption-generation': Bot,
  studies: FlaskConical,
  'humor-ai': Layers,
  audience: Users,
  access: Users,
  moderation: ListChecks,
  'insights-sharing': BarChart3,
}

export default function Sidebar({
  preview = false,
}: { preview?: boolean } = {}) {
  const currentPathname = usePathname()
  const pathname = preview ? '/overview' : currentPathname
  const { theme, setTheme } = useTheme()
  const [collapsed, setCollapsed] = useState(false)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})
  const [showLogout, setShowLogout] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const activeGroup = getAdminNavigation(pathname)?.group.id
  const activePage = getAdminNavigation(pathname)?.page.id
  const publicRoutes = ['/', '/sign-in', '/forgot-password', '/reset-password']
  const isAdminRoute =
    Boolean(pathname) &&
    !publicRoutes.includes(pathname) &&
    !pathname.startsWith('/auth')

  useEffect(() => {
    let groups: Record<string, boolean> = {}
    try {
      setCollapsed(localStorage.getItem('sidebar.collapsed') === 'true')
      groups = parseSidebarGroups(localStorage.getItem('sidebar.groups.v2'))
    } catch {
      /* Navigation remains usable when storage is unavailable. */
    }
    const current = getAdminNavigation(pathname)?.group.id
    setOpenGroups(current ? { ...groups, [current]: true } : groups)
    setHydrated(true)

    const handleState = (e: Event) => {
      const d = (e as CustomEvent).detail as { collapsed?: boolean }
      if (typeof d?.collapsed === 'boolean') {
        setCollapsed(d.collapsed)
      }
    }
    window.addEventListener('sidebar:state', handleState as EventListener)
    return () => {
      window.removeEventListener('sidebar:state', handleState as EventListener)
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem('sidebar.collapsed', String(collapsed))
    } catch {
      /* Optional preference. */
    }
    window.dispatchEvent(
      new CustomEvent('sidebar:state', { detail: { collapsed } })
    )
  }, [collapsed, hydrated])

  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem('sidebar.groups.v2', JSON.stringify(openGroups))
    } catch {
      /* Optional preference. */
    }
  }, [openGroups, hydrated])

  useEffect(() => {
    if (activeGroup) setOpenGroups((prev) => ({ ...prev, [activeGroup]: true }))
  }, [activeGroup, pathname])

  useEffect(() => {
    if (preview) return
    const checkSession = async () => {
      try {
        const { user } = await checkAuth()
        setShowLogout(!!user || isAdminRoute)
      } catch (error) {
        console.error('Failed to fetch user session in Sidebar:', error)
        setShowLogout(isAdminRoute)
      }
    }
    checkSession()
  }, [isAdminRoute, preview])

  const toggleGroup = (label: string) =>
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }))

  return (
    <aside
      className={cn(
        'fixed left-0 top-14 z-30 h-[calc(100vh-3.5rem)] flex flex-col border-r bg-sidebar text-sidebar-foreground border-sidebar-border',
        collapsed ? 'w-16' : 'w-64',
        'transition-[width] duration-200'
      )}
    >
      <nav
        aria-label="Admin navigation"
        className="min-h-0 flex-1 overflow-y-auto px-2 py-4 custom-scroll"
      >
        <ul className="space-y-1">
          {ADMIN_NAVIGATION.map((group) => {
            const Icon = GROUP_ICONS[group.id as keyof typeof GROUP_ICONS]
            const active = activeGroup === group.id
            const open = !collapsed && (openGroups[group.id] ?? false)
            const linkClass = cn(
              'relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              active
                ? 'bg-primary/10 text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/80'
            )
            return (
              <li key={group.id}>
                {group.id === 'overview' ? (
                  <Link
                    href={
                      preview
                        ? '/admin-preview'
                        : group.sections[0].pages[0].href
                    }
                    aria-label={collapsed ? group.label : undefined}
                    title={collapsed ? group.label : group.description}
                    aria-current={active ? 'page' : undefined}
                    className={linkClass}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {!collapsed && <span>{group.label}</span>}
                  </Link>
                ) : (
                  <>
                    <button
                      type="button"
                      aria-label={collapsed ? group.label : undefined}
                      title={collapsed ? group.label : group.description}
                      aria-expanded={open}
                      aria-controls={`nav-${group.id}`}
                      className={linkClass}
                      onClick={() => {
                        if (collapsed) {
                          setCollapsed(false)
                          setOpenGroups((prev) => ({
                            ...prev,
                            [group.id]: true,
                          }))
                        } else toggleGroup(group.id)
                      }}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {!collapsed && (
                        <>
                          <span className="min-w-0 flex-1 whitespace-normal leading-snug">
                            {group.label}
                          </span>
                          <ChevronDown
                            aria-hidden="true"
                            className={cn(
                              'h-4 w-4 shrink-0 transition-transform duration-200',
                              open && 'rotate-180'
                            )}
                          />
                        </>
                      )}
                    </button>
                    <div id={`nav-${group.id}`} hidden={!open}>
                      <ul className="ml-5 mt-1 space-y-1 border-l border-sidebar-border pl-2 animate-in fade-in-0 slide-in-from-top-1 duration-200">
                        {group.sections.map((section, index) => (
                          <li key={section.label ?? index}>
                            {section.label && (
                              <p className="px-2 pb-1 pt-3 text-xs font-semibold text-sidebar-foreground/60">
                                {section.label}
                              </p>
                            )}
                            <ul className="space-y-0.5">
                              {section.pages.map((entry) => (
                                <li key={entry.id}>
                                  <Link
                                    href={
                                      preview ? '/admin-preview' : entry.href
                                    }
                                    title={
                                      preview
                                        ? `${entry.description} · Dashboard preview only`
                                        : entry.description
                                    }
                                    aria-current={
                                      entry.id === activePage
                                        ? 'page'
                                        : undefined
                                    }
                                    className={cn(
                                      'block whitespace-normal break-words rounded-md px-2 py-2 text-sm leading-snug transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                                      entry.id === activePage
                                        ? 'bg-primary/10 font-medium text-sidebar-accent-foreground'
                                        : 'text-sidebar-foreground/75'
                                    )}
                                  >
                                    {entry.label}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      <div
        className={cn(
          'mt-auto border-t border-sidebar-border px-3 py-4',
          collapsed ? 'flex flex-col items-center gap-3' : 'flex flex-col gap-3'
        )}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className={cn('gap-2', collapsed ? '' : 'w-full justify-start')}
              size={collapsed ? 'icon' : 'default'}
              variant="secondary"
              aria-label="Open settings menu"
            >
              <Settings className="h-4 w-4" />
              {collapsed ? (
                <span className="sr-only">Settings</span>
              ) : (
                <span>Settings</span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align={collapsed ? 'center' : 'start'}
            side="top"
            className="w-72 p-2"
          >
            <div className="px-2 py-2">
              <TimezoneSelect />
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Theme</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={theme ?? 'system'}
              onValueChange={(value) => setTheme(value)}
            >
              <DropdownMenuRadioItem value="light">
                Light Mode
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">
                Dark Mode
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">
                System Default
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            {showLogout && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await signOutAction()
                    setShowLogout(false)
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  Log Out
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <style jsx global>{`
        .custom-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: rgba(120, 120, 120, 0.3);
          border-radius: 8px;
        }
        .custom-scroll:hover::-webkit-scrollbar-thumb {
          background: rgba(120, 120, 120, 0.5);
        }
      `}</style>
    </aside>
  )
}
