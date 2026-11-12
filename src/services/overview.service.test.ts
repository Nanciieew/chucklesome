import { describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { loadOverviewDashboard, readOverviewPages } from './overview.service'

describe('overview query pagination', () => {
  it('loads all records even when the server returns fewer than the requested page size', async () => {
    const all = Array.from({ length: 1205 }, (_, id) => ({ id }))
    const load = vi.fn(async (offset: number) => ({
      data: all.slice(offset, offset + 200),
      count: all.length,
      error: null,
    }))
    const result = await readOverviewPages(load)
    expect(result).toHaveLength(1205)
    expect(load.mock.calls.map((call) => call[0])).toEqual([
      0, 200, 400, 600, 800, 1000, 1200,
    ])
  })
  it('rejects truncated, failed, changing, and oversized datasets', async () => {
    await expect(
      readOverviewPages(async () => ({ data: [], count: 1205, error: null }))
    ).rejects.toThrow('before all rows')
    await expect(
      readOverviewPages(async () => ({
        data: null,
        count: null,
        error: { message: 'Permission denied' },
      }))
    ).rejects.toThrow('Permission denied')
    await expect(
      readOverviewPages(async () => ({ data: [], count: 100001, error: null }))
    ).rejects.toThrow('data volume')
    const load = vi
      .fn()
      .mockResolvedValueOnce({ data: [{ id: 1 }], count: 2, error: null })
      .mockResolvedValueOnce({ data: [{ id: 2 }], count: 3, error: null })
    await expect(readOverviewPages(load)).rejects.toThrow('dataset changed')
  })
  it('accepts a successfully empty dataset but requires an exact count', async () => {
    await expect(
      readOverviewPages(async () => ({ data: [], count: 0, error: null }))
    ).resolves.toEqual([])
    await expect(
      readOverviewPages(async () => ({ data: [], count: null, error: null }))
    ).rejects.toThrow('complete count')
  })
})

function client(
  superadmin = true,
  user: { id: string } | null = { id: 'acting-user' }
) {
  const calls: {
    table: string
    filters: [string, string, unknown][]
    order: string[]
    select?: string
    head?: boolean
  }[] = []
  const from = vi.fn((table: string) => {
    const call: (typeof calls)[number] = { table, filters: [], order: [] }
    calls.push(call)
    const query = {
      select: vi.fn((select: string, options?: { head?: boolean }) => {
        call.select = select
        call.head = options?.head
        return query
      }),
      eq: vi.fn((column: string, value: unknown) => {
        call.filters.push(['eq', column, value])
        return query
      }),
      gte: vi.fn((column: string, value: unknown) => {
        call.filters.push(['gte', column, value])
        return query
      }),
      lt: vi.fn((column: string, value: unknown) => {
        call.filters.push(['lt', column, value])
        return query
      }),
      order: vi.fn((column: string) => {
        call.order.push(column)
        return query
      }),
      range: vi.fn(() => query),
      in: vi.fn(() => query),
      single: vi.fn(async () => ({
        data: { is_superadmin: superadmin },
        error: null,
      })),
      abortSignal: vi.fn(async () => ({ data: [], count: 0, error: null })),
    }
    return query
  })
  const value = {
    from,
    auth: { getUser: vi.fn(async () => ({ data: { user }, error: null })) },
  }
  return { value: value as unknown as SupabaseClient<Database>, calls, from }
}

describe('JWT-scoped overview reads', () => {
  it('requires a signed-in user before making any table query', async () => {
    const mock = client(false, null)
    await expect(loadOverviewDashboard(mock.value, 'UTC')).rejects.toThrow(
      'Sign in'
    )
    expect(mock.from).not.toHaveBeenCalled()
  })
  it('denies non-admins before reading activity or aggregates', async () => {
    const mock = client(false)
    await expect(loadOverviewDashboard(mock.value, 'UTC')).rejects.toThrow(
      'Superadmin'
    )
    expect(mock.calls).toEqual([
      {
        table: 'profiles',
        filters: [['eq', 'id', 'acting-user']],
        order: [],
        select: 'is_superadmin',
        head: undefined,
      },
    ])
  })
  it('uses closed comparison windows, stable pagination order, and only the supplied user client', async () => {
    const mock = client()
    const result = await loadOverviewDashboard(
      mock.value,
      'America/New_York',
      new Date('2026-11-03T12:00:00Z')
    )
    expect(result.growth.data?.metrics.users.current).toBe(0)
    const recent = mock.calls.find((call) => call.table === 'caption_requests')!
    expect(recent.filters).toContainEqual([
      'gte',
      'created_datetime_utc',
      '2026-10-20T04:00:00.000Z',
    ])
    expect(recent.filters).toContainEqual([
      'lt',
      'created_datetime_utc',
      '2026-11-03T05:00:00.000Z',
    ])
    expect(recent.order).toEqual(['id'])
    expect(
      mock.calls.find((call) => call.table === 'study_participations')?.order
    ).toEqual(['study_id', 'profile_id'])
    expect(mock.calls.filter((call) => call.head)).toHaveLength(4)
  })
})
