import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  ADMIN_NAVIGATION,
  ADMIN_PAGES,
  getAdminNavigation,
  parseSidebarGroups,
  searchAdminPages,
  withCaptionJob,
} from './admin-navigation'

describe('admin navigation catalog', () => {
  it('retains 45 unique, implemented destinations in the nine agreed groups', () => {
    expect(ADMIN_NAVIGATION.map((group) => group.label)).toEqual([
      'Overview',
      'Content',
      'Caption Generation',
      'Studies',
      'Humor & AI Configuration',
      'Communities & Demographics',
      'Users & Access',
      'Moderation & Support',
      'Insights & Sharing',
    ])
    expect(ADMIN_PAGES).toHaveLength(45)
    expect(new Set(ADMIN_PAGES.map((page) => page.href)).size).toBe(45)
    expect(new Set(ADMIN_PAGES.map((page) => page.id)).size).toBe(45)
    for (const page of ADMIN_PAGES) {
      expect(
        existsSync(
          join(process.cwd(), 'src/app/(admin)/(menu)', page.href, 'page.tsx')
        ),
        page.href
      ).toBe(true)
      expect(getAdminNavigation(page.href)?.page.id).toBe(page.id)
      expect(
        searchAdminPages(page.label).some((result) => result.id === page.id)
      ).toBe(true)
      for (const related of page.related)
        expect(
          ADMIN_PAGES.some((entry) => entry.id === related),
          `${page.id} → ${related}`
        ).toBe(true)
    }
  })

  it('includes the previously absent research, analytics, and access destinations in search', () => {
    expect(searchAdminPages('')).toHaveLength(45)
    expect(
      searchAdminPages('demographics answers').map((page) => page.id)
    ).toContain('demographics-answers')
    expect(searchAdminPages('AI logs').map((page) => page.id)).toContain(
      'llm-prompt-chains'
    )
    expect(searchAdminPages('oauth').map((page) => page.id)).toContain(
      'clients'
    )
    expect(
      searchAdminPages('  IMAGE   LIBRARY ').map((page) => page.id)
    ).toContain('images')
    expect(searchAdminPages('no-such-function')).toEqual([])
  })
})

describe('route ownership and breadcrumbs', () => {
  it.each([
    ['/caption-job/job-1', 'caption-jobs', 'caption-generation'],
    ['/caption-request/12', 'caption-requests', 'caption-generation'],
    ['/llm-prompt-chain/21', 'llm-prompt-chains', 'caption-generation'],
    ['/caption/caption-1', 'captions', 'content'],
    ['/image/image-1', 'images', 'content'],
    ['/user/user-1/images', 'images', 'content'],
    ['/user/user-1/captions', 'captions', 'content'],
    ['/users/bulk-permissions', 'users-bulk-permissions', 'access'],
    ['/demographics/answers', 'demographics-answers', 'audience'],
    ['/demographics/mappings', 'demographics-mappings', 'audience'],
    ['/demographics/responses', 'demographics-responses', 'audience'],
    ['/insights/user', 'user-insights', 'insights-sharing'],
    ['/insights/sharing', 'sharing-insights', 'insights-sharing'],
    ['/study/14', 'studies', 'studies'],
    ['/study/wizard', 'study-wizard', 'studies'],
    ['/study/generate-captions', 'generate-captions', 'studies'],
    ['/study-image-set/8', 'study-image-sets', 'studies'],
    ['/humor-flavor/3/steps', 'humor-flavors', 'humor-ai'],
    ['/humor-flavor/3/steps/new', 'humor-flavors', 'humor-ai'],
    ['/humor-flavor/3/steps/7/edit', 'humor-flavors', 'humor-ai'],
    ['/humor-flavors/steps/new', 'humor-flavors', 'humor-ai'],
    ['/humor-flavors/steps/7/edit', 'humor-flavors', 'humor-ai'],
    [
      '/image-humor-potential-prompts/2',
      'image-humor-potential-prompts',
      'humor-ai',
    ],
    ['/images/common-use', 'images', 'content'],
    ['/images/user-uploaded', 'images', 'content'],
    ['/user-images', 'images', 'content'],
  ])('resolves %s to one stable owner', (path, owner, group) => {
    const context = getAdminNavigation(path)
    expect(context?.page.id).toBe(owner)
    expect(context?.group.id).toBe(group)
    expect(context?.breadcrumbs.at(-1)?.href).toBeUndefined()
  })

  it('retains the flavor steps parent on an edit page', () => {
    expect(
      getAdminNavigation('/humor-flavor/3/steps/7/edit')?.breadcrumbs
    ).toEqual([
      { label: 'Humor & AI Configuration' },
      { label: 'Humor Flavors', href: '/humor-flavors' },
      { label: 'Flavor 3 Steps', href: '/humor-flavor/3/steps' },
      { label: 'Edit Step 7' },
    ])
  })

  it('normalizes query strings and trailing slashes without matching unrelated prefixes', () => {
    expect(getAdminNavigation('/caption-request/12/?jobId=abc')?.page.id).toBe(
      'caption-requests'
    )
    for (const path of [
      '/',
      '/sign-in',
      '/users-archive',
      '/insights/unknown',
      '/study/14/unknown',
    ])
      expect(getAdminNavigation(path)).toBeNull()
  })
})

describe('navigation preferences and job return links', () => {
  it('accepts only stable group IDs with boolean preferences', () => {
    expect(
      parseSidebarGroups(
        '{"content":true,"studies":false,"access":"true","Users":true,"unknown":true}'
      )
    ).toEqual({ content: true, studies: false })
    for (const value of [null, 'broken', 'null', '[]', 'true', '12'])
      expect(parseSidebarGroups(value)).toEqual({})
  })

  it('carries a valid originating job and ignores invalid IDs', () => {
    const id = '00000000-0000-0000-0000-000000000001'
    expect(withCaptionJob('/caption-request/12', id)).toBe(
      `/caption-request/12?jobId=${id}`
    )
    for (const invalid of [
      null,
      '',
      'bad-id',
      '//example.com',
      `${id}&redirect=elsewhere`,
    ])
      expect(withCaptionJob('/caption-request/12', invalid)).toBe(
        '/caption-request/12'
      )
  })
})
