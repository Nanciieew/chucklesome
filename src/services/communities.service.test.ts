import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  configured: true,
  from: vi.fn(),
  select: vi.fn(),
}));

vi.mock('@/utils/supabase/client', () => ({
  get supabase() {
    return mocks.configured ? { from: mocks.from } : null;
  },
}));
vi.mock('@/app/actions', () => ({ getAuthTokenAction: vi.fn() }));

import { CommunitiesService } from './communities.service';

beforeEach(() => {
  vi.resetAllMocks();
  mocks.configured = true;
  mocks.from.mockReturnValue({ select: mocks.select });
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => vi.restoreAllMocks());

describe('community list errors', () => {
  it('returns community rows from the configured database', async () => {
    const rows = [{ id: 2, name: 'Columbia' }, { id: 3, name: 'Barnard' }];
    mocks.select.mockResolvedValue({ data: rows, error: null });
    expect(await CommunitiesService.getAllCommunities()).toEqual(rows);
    expect(mocks.from).toHaveBeenCalledWith('communities');
  });

  it('keeps an actual empty result distinct from a failed query', async () => {
    mocks.select.mockResolvedValue({ data: [], error: null });
    expect(await CommunitiesService.getAllCommunities()).toEqual([]);
  });

  it('reports a Supabase permission error instead of presenting an empty list', async () => {
    mocks.select.mockResolvedValue({ data: null, error: { code: '42501', message: 'permission denied for table communities' } });
    expect(await CommunitiesService.getAllCommunities()).toEqual({ error: 'permission denied for table communities' });
  });

  it('reports a missing client instead of presenting an empty list', async () => {
    mocks.configured = false;
    expect(await CommunitiesService.getAllCommunities()).toEqual({ error: 'Supabase client not available' });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('reports a connection failure instead of presenting an empty list', async () => {
    mocks.select.mockRejectedValue(new Error('Network unavailable'));
    expect(await CommunitiesService.getAllCommunities()).toEqual({ error: 'Network unavailable' });
  });
});
