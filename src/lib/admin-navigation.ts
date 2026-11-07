import { isJobId } from '@/utils/caption-jobs'

export type AdminPage = {
  id: string
  label: string
  href: string
  description: string
  keywords: string[]
  related: string[]
}

export type AdminNavGroup = {
  id: string
  label: string
  description: string
  sections: { label?: string; pages: AdminPage[] }[]
}

const page = (
  id: string,
  label: string,
  href: string,
  description: string,
  related: string[] = [],
  keywords: string[] = []
): AdminPage => ({ id, label, href, description, related, keywords })

export const ADMIN_NAVIGATION: AdminNavGroup[] = [
  {
    id: 'overview',
    label: 'Overview',
    description: 'Start here for activity and common admin tasks.',
    sections: [
      {
        pages: [
          page(
            'overview',
            'Overview',
            '/overview',
            'Manage content, investigate generation, run studies, and administer access from the groups on the left.',
            ['images', 'study-wizard', 'reported-captions', 'users'],
            ['dashboard', 'home', 'start']
          ),
        ],
      },
    ],
  },
  {
    id: 'content',
    label: 'Content',
    description: 'Upload, organize, inspect, and maintain images and captions.',
    sections: [
      {
        pages: [
          page(
            'images',
            'Images',
            '/images',
            'Browse images and open one to inspect its details and captions.',
            [
              'common-use-upload',
              'image-categories',
              'external-image-replacement-jobs',
              'captions',
            ],
            ['library', 'galleries', 'user images']
          ),
          page(
            'common-use-upload',
            'Upload Images',
            '/common-use/upload',
            'Add images from local files or URLs, then review them in Images.',
            ['images', 'image-categories']
          ),
          page(
            'image-categories',
            'Image Categories',
            '/image-categories',
            'Organize the categories used to classify images.',
            ['images', 'common-use-upload']
          ),
          page(
            'captions',
            'Captions',
            '/captions',
            'Browse saved captions and open a caption to inspect its source image and generation details.',
            ['images', 'caption-requests', 'reported-captions', 'insights'],
            ['user captions']
          ),
          page(
            'external-image-replacement-jobs',
            'External Image Replacement Jobs',
            '/external-image-replacement-jobs',
            'Track the replacement of externally hosted images and investigate failed replacements.',
            ['images']
          ),
        ],
      },
    ],
  },
  {
    id: 'caption-generation',
    label: 'Caption Generation',
    description: 'Follow generation progress and investigate its outputs.',
    sections: [
      {
        pages: [
          page(
            'caption-jobs',
            'Caption Jobs',
            '/caption-jobs',
            'Track queued and running generation jobs. Open a job for its image tasks, requests, prompt chains, and saved captions.',
            [
              'caption-requests',
              'llm-prompt-chains',
              'llm-responses',
              'captions',
            ]
          ),
          page(
            'caption-requests',
            'Caption Requests',
            '/caption-requests',
            'Inspect individual requests to generate captions, including the source image and model responses.',
            ['caption-jobs', 'llm-prompt-chains', 'llm-responses', 'captions']
          ),
          page(
            'llm-prompt-chains',
            'LLM Prompt Chains',
            '/llm-prompt-chains',
            'Review recorded generation chains and their generated captions and model responses.',
            ['caption-requests', 'caption-jobs', 'llm-responses', 'captions'],
            ['AI', 'history', 'logs']
          ),
          page(
            'llm-responses',
            'LLM Responses',
            '/llm-responses',
            'Inspect model prompts and responses to understand how captions were generated.',
            ['caption-requests', 'llm-prompt-chains', 'llm-models'],
            ['AI', 'logs', 'debug']
          ),
        ],
      },
    ],
  },
  {
    id: 'studies',
    label: 'Studies',
    description:
      'Prepare research material, run studies, and review experiments.',
    sections: [
      {
        pages: [
          page(
            'studies',
            'Studies',
            '/studies',
            'Manage existing studies and their captions, visibility, and public study links.',
            [
              'study-wizard',
              'study-quick',
              'study-image-sets',
              'study-caption-mappings',
              'caption-jobs',
            ]
          ),
        ],
      },
      {
        label: 'Create a Study',
        pages: [
          page(
            'study-wizard',
            'Study Wizard',
            '/study/wizard',
            'Start with images, generate captions, review the results, and create a study.',
            ['studies', 'study-quick', 'study-image-sets', 'humor-flavors']
          ),
          page(
            'study-quick',
            'Quick Study',
            '/study-quick',
            'Import existing image and caption material, review it, and create a study.',
            ['studies', 'study-wizard', 'experiments'],
            ['import']
          ),
        ],
      },
      {
        label: 'Prepare & Evaluate',
        pages: [
          page(
            'study-image-sets',
            'Image Sets',
            '/study-image-sets',
            'Group images into reusable sets for studies and caption generation.',
            ['studies', 'generate-captions', 'images']
          ),
          page(
            'generate-captions',
            'Generate Captions',
            '/study/generate-captions',
            'Generate captions for an existing study using an image or image set and humor flavors.',
            ['studies', 'study-image-sets', 'caption-jobs', 'humor-mix']
          ),
          page(
            'study-caption-mappings',
            'Caption Mappings',
            '/study-caption-mappings',
            'Manage which saved captions are included in each study.',
            ['studies', 'captions', 'generate-captions']
          ),
          page(
            'experiments',
            'Experiments',
            '/experiments',
            'Review research hypotheses, associated runs and studies, votes, and findings.',
            ['studies', 'study-quick']
          ),
        ],
      },
    ],
  },
  {
    id: 'humor-ai',
    label: 'Humor & AI Configuration',
    description:
      'Configure humor behavior and the resources used by generation.',
    sections: [
      {
        label: 'Humor',
        pages: [
          page(
            'humor-flavors',
            'Humor Flavors',
            '/humor-flavors',
            'Manage reusable caption-generation instructions. Open a flavor to configure its steps.',
            [
              'humor-themes',
              'humor-mix',
              'caption-examples',
              'terms',
              'llm-models',
            ]
          ),
          page(
            'humor-themes',
            'Humor Themes',
            '/humor-themes',
            'Manage themes that can be assigned to humor flavors.',
            ['humor-flavors', 'humor-mix']
          ),
          page(
            'humor-mix',
            'Humor Mix',
            '/humor-mix',
            'Choose which humor flavors participate in caption generation and how many captions each contributes.',
            ['humor-flavors', 'generate-captions']
          ),
          page(
            'image-humor-potential-prompts',
            'Humor Potential Prompts',
            '/image-humor-potential-prompts',
            'Manage prompts used to assess the humor potential of images.',
            ['llm-models', 'images', 'humor-flavors']
          ),
        ],
      },
      {
        label: 'Reference Material',
        pages: [
          page(
            'caption-examples',
            'Caption Examples',
            '/caption-examples',
            'Review curated examples used for prompts and quality checks.',
            ['humor-flavors', 'terms', 'captions']
          ),
          page(
            'terms',
            'Terms',
            '/terms',
            'Manage vocabulary, definitions, and examples available as reference material.',
            ['term-types', 'caption-examples', 'humor-flavors']
          ),
          page(
            'term-types',
            'Term Types',
            '/term-types',
            'Organize the types used to categorize terms.',
            ['terms']
          ),
        ],
      },
      {
        label: 'Models & Providers',
        pages: [
          page(
            'llm-models',
            'LLM Models',
            '/llm-models',
            'Inspect the AI models available for humor flavor steps and prompts.',
            ['llm-providers', 'humor-flavors', 'image-humor-potential-prompts'],
            ['AI']
          ),
          page(
            'llm-providers',
            'LLM Providers',
            '/llm-providers',
            'Inspect the providers associated with AI models.',
            ['llm-models'],
            ['AI']
          ),
        ],
      },
    ],
  },
  {
    id: 'audience',
    label: 'Communities & Demographics',
    description: 'Organize community context and demographic information.',
    sections: [
      {
        label: 'Communities',
        pages: [
          page(
            'communities',
            'Communities',
            '/communities',
            'Manage the communities that community contexts can describe.',
            ['community-contexts', 'community-context-tags']
          ),
          page(
            'community-contexts',
            'Community Contexts',
            '/community-contexts',
            'Manage community information and assign context tags for image matching.',
            ['communities', 'community-context-tags']
          ),
          page(
            'community-context-tags',
            'Community Context Tags',
            '/community-context-tags',
            'Manage tags assigned to community contexts for image matching.',
            ['community-contexts', 'communities']
          ),
        ],
      },
      {
        label: 'Demographics',
        pages: [
          page(
            'demographics',
            'Questions',
            '/demographics',
            'Configure demographic questions, then associate their available answers through Question–Answer Mapping.',
            [
              'demographics-answers',
              'demographics-mappings',
              'demographics-responses',
            ],
            ['demographic questions']
          ),
          page(
            'demographics-answers',
            'Answers',
            '/demographics/answers',
            'Manage demographic answer choices used by Question–Answer Mapping.',
            ['demographics', 'demographics-mappings', 'demographics-responses'],
            ['demographic answers']
          ),
          page(
            'demographics-mappings',
            'Question–Answer Mapping',
            '/demographics/mappings',
            'Associate demographic questions with their available answers.',
            ['demographics', 'demographics-answers', 'demographics-responses'],
            ['demographic mappings']
          ),
          page(
            'demographics-responses',
            'User Responses',
            '/demographics/responses',
            'Review collected demographic responses against the configured question and answer mappings.',
            ['demographics-mappings', 'demographics', 'demographics-answers'],
            ['demographics']
          ),
        ],
      },
    ],
  },
  {
    id: 'access',
    label: 'Users & Access',
    description: 'Manage user permissions, admission rules, and API access.',
    sections: [
      {
        label: 'User Permissions',
        pages: [
          page(
            'users',
            'Users',
            '/users',
            'Manage user accounts and permissions, and inspect each user’s images and captions.',
            [
              'users-bulk-permissions',
              'allowed-domains',
              'whitelist-email-addresses',
              'clients',
            ]
          ),
          page(
            'users-bulk-permissions',
            'Bulk Permissions',
            '/users/bulk-permissions',
            'Apply permission updates to multiple users by email address.',
            ['users']
          ),
        ],
      },
      {
        label: 'Admission Rules',
        pages: [
          page(
            'allowed-domains',
            'Domains',
            '/allowed-domains',
            'Manage the email domains allowed to access the service.',
            ['whitelist-email-addresses', 'users'],
            ['whitelist', 'allowlist']
          ),
          page(
            'whitelist-email-addresses',
            'E-Mail Addresses',
            '/whitelist-email-addresses',
            'Manage the individual email addresses allowed to access the service.',
            ['allowed-domains', 'users'],
            ['whitelist', 'allowlist', 'email']
          ),
        ],
      },
      {
        label: 'API Access',
        pages: [
          page(
            'clients',
            'Clients',
            '/clients',
            'Manage API clients and their credentials for programmatic access.',
            ['users'],
            ['OAuth', 'integrations']
          ),
        ],
      },
    ],
  },
  {
    id: 'moderation',
    label: 'Moderation & Support',
    description: 'Review reported content and software issues.',
    sections: [
      {
        pages: [
          page(
            'reported-captions',
            'Reported Captions',
            '/reported-captions',
            'Inspect flagged captions before deciding whether to keep or delete them.',
            ['reported-images', 'captions']
          ),
          page(
            'reported-images',
            'Reported Images',
            '/reported-images',
            'Inspect flagged images before deciding whether to keep or delete them.',
            ['reported-captions', 'images']
          ),
          page(
            'bug-reports',
            'Bug Reports',
            '/bug-reports',
            'Review software problems and track their resolution.',
            ['reported-captions', 'reported-images']
          ),
        ],
      },
    ],
  },
  {
    id: 'insights-sharing',
    label: 'Insights & Sharing',
    description: 'Understand usage and create links to share.',
    sections: [
      {
        label: 'Insights',
        pages: [
          page(
            'insights',
            'Captions Insights',
            '/insights',
            'Explore caption activity and generate caption reports.',
            ['captions', 'user-insights', 'sharing-insights']
          ),
          page(
            'user-insights',
            'User Insights',
            '/insights/user',
            'Explore user activity and engagement.',
            ['users', 'insights', 'sharing-insights']
          ),
          page(
            'sharing-insights',
            'Sharing Insights',
            '/insights/sharing',
            'Explore how people share content.',
            ['insights', 'user-insights', 'qr-generator']
          ),
        ],
      },
      {
        label: 'Sharing Tools',
        pages: [
          page(
            'qr-generator',
            'QR Generator',
            '/qr-generator',
            'Create QR codes and manage redirect links for sharing.',
            ['sharing-insights'],
            ['QR code', 'distribution']
          ),
        ],
      },
    ],
  },
]

export const ADMIN_PAGES = ADMIN_NAVIGATION.flatMap((group) =>
  group.sections.flatMap((section) =>
    section.pages.map((entry) => ({
      ...entry,
      groupId: group.id,
      category: group.label,
      section: section.label,
    }))
  )
)

export function searchAdminPages(query: string) {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean)
  return ADMIN_PAGES.filter((entry) => {
    const text = [
      entry.label,
      entry.category,
      entry.section,
      entry.description,
      ...entry.keywords,
    ]
      .join(' ')
      .toLocaleLowerCase()
    return words.every((word) => text.includes(word))
  })
}

type Breadcrumb = { label: string; href?: string }
type DetailRoute = {
  pattern: RegExp
  owner: string
  crumbs: (match: RegExpMatchArray) => Breadcrumb[]
}
const detail = (label: string, id: string): Breadcrumb => ({
  label: `${label} ${id}`,
})
const DETAIL_ROUTES: DetailRoute[] = [
  {
    pattern: /^\/image\/([^/]+)$/,
    owner: 'images',
    crumbs: (m) => [detail('Image', m[1])],
  },
  {
    pattern: /^\/caption\/([^/]+)$/,
    owner: 'captions',
    crumbs: (m) => [detail('Caption', m[1])],
  },
  {
    pattern: /^\/caption-job\/([^/]+)$/,
    owner: 'caption-jobs',
    crumbs: (m) => [detail('Caption Job', m[1])],
  },
  {
    pattern: /^\/caption-request\/([^/]+)$/,
    owner: 'caption-requests',
    crumbs: (m) => [detail('Caption Request', m[1])],
  },
  {
    pattern: /^\/llm-prompt-chain\/([^/]+)$/,
    owner: 'llm-prompt-chains',
    crumbs: (m) => [detail('LLM Prompt Chain', m[1])],
  },
  {
    pattern: /^\/study\/(?!wizard$|generate-captions$)([^/]+)$/,
    owner: 'studies',
    crumbs: (m) => [detail('Study', m[1])],
  },
  {
    pattern: /^\/study-image-set\/([^/]+)$/,
    owner: 'study-image-sets',
    crumbs: (m) => [detail('Image Set', m[1])],
  },
  {
    pattern: /^\/image-humor-potential-prompts\/([^/]+)$/,
    owner: 'image-humor-potential-prompts',
    crumbs: (m) => [detail('Prompt', m[1])],
  },
  {
    pattern: /^\/user\/([^/]+)\/images$/,
    owner: 'images',
    crumbs: (m) => [{ label: `User ${m[1]} Images` }],
  },
  {
    pattern: /^\/user\/([^/]+)\/captions$/,
    owner: 'captions',
    crumbs: (m) => [{ label: `User ${m[1]} Captions` }],
  },
  {
    pattern: /^\/humor-flavor\/([^/]+)\/steps(?:\/(new)|\/([^/]+)\/(edit))?$/,
    owner: 'humor-flavors',
    crumbs: (m) => [
      {
        label: `Flavor ${m[1]} Steps`,
        href: m[2] || m[4] ? `/humor-flavor/${m[1]}/steps` : undefined,
      },
      ...(m[2]
        ? [{ label: 'Add Step' }]
        : m[4]
          ? [{ label: `Edit Step ${m[3]}` }]
          : []),
    ],
  },
  {
    pattern: /^\/humor-flavors\/steps\/new$/,
    owner: 'humor-flavors',
    crumbs: () => [{ label: 'Add Step' }],
  },
  {
    pattern: /^\/humor-flavors\/steps\/([^/]+)\/edit$/,
    owner: 'humor-flavors',
    crumbs: (m) => [{ label: `Edit Step ${m[1]}` }],
  },
]

export function getAdminNavigation(pathname: string) {
  const path = pathname.split(/[?#]/)[0].replace(/\/$/, '') || '/'
  let entry = ADMIN_PAGES.find((item) => item.href === path)
  let extra: Breadcrumb[] = []
  if (!entry) {
    for (const route of DETAIL_ROUTES) {
      const match = path.match(route.pattern)
      if (match) {
        entry = ADMIN_PAGES.find((item) => item.id === route.owner)
        extra = route.crumbs(match)
        break
      }
    }
  }
  // Retained legacy routes keep a stable owner without introducing duplicate sidebar links.
  if (!entry) {
    const aliases: Record<string, string> = {
      '/user-images': 'images',
      '/images/common-use': 'images',
      '/images/user-uploaded': 'images',
      '/humor-management': 'humor-flavors',
    }
    entry = ADMIN_PAGES.find((item) => item.id === aliases[path])
  }
  if (!entry) return null
  const group = ADMIN_NAVIGATION.find((item) => item.id === entry.groupId)!
  const breadcrumbs: Breadcrumb[] = [
    ...(group.label === entry.label ? [] : [{ label: group.label }]),
    { label: entry.label, href: extra.length ? entry.href : undefined },
    ...extra,
  ]
  return { page: entry, group, breadcrumbs, isDetail: extra.length > 0 }
}

/** Keep the originating job reachable without depending on browser history. */
export function withCaptionJob(href: string, jobId: string | null) {
  return jobId && isJobId(jobId)
    ? `${href}?jobId=${encodeURIComponent(jobId)}`
    : href
}

export function parseSidebarGroups(
  value: string | null
): Record<string, boolean> {
  try {
    const parsed: unknown = JSON.parse(value ?? '{}')
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
      return {}
    return Object.fromEntries(
      ADMIN_NAVIGATION.filter(
        (group) =>
          typeof (parsed as Record<string, unknown>)[group.id] === 'boolean'
      ).map((group) => [
        group.id,
        (parsed as Record<string, boolean>)[group.id],
      ])
    )
  } catch {
    return {}
  }
}
