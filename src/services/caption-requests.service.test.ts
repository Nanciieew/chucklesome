import { beforeEach, describe, expect, it, vi } from 'vitest'

const { from, select, eq, single } = vi.hoisted(() => ({
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  single: vi.fn(),
}))
vi.mock('@/utils/supabase/client', () => ({ supabase: { from } }))
import { CaptionRequestsService } from './caption-requests.service'

beforeEach(() => {
  vi.resetAllMocks()
  from.mockReturnValue({ select })
  select.mockReturnValue({ eq })
  eq.mockReturnValue({ single })
})

describe('caption request navigation data', () => {
  it('preserves the source image, prompt chains, and formatted model responses', async () => {
    single.mockResolvedValue({
      data: {
        id: 12,
        image_id: 'image-1',
        profile_id: 'user-1',
        created_datetime_utc: '2026-11-07T12:00:00Z',
        images: { url: 'https://example.com/image.png' },
        llm_prompt_chains: [{ id: 21 }, { id: 22 }],
        llm_model_responses: [
          {
            id: 4,
            llm_model_response: '{"caption":"hello"}',
            llm_models: { name: 'Model' },
            humor_flavors: { slug: 'dry' },
          },
        ],
      },
      error: null,
    })
    const result = await CaptionRequestsService.getCaptionRequestDetails(12)
    expect(from).toHaveBeenCalledWith('caption_requests')
    expect(eq).toHaveBeenCalledWith('id', 12)
    expect(select.mock.calls[0][0]).toContain(
      'llm_prompt_chains_caption_request_id_fkey'
    )
    expect(result).toMatchObject({
      image_id: 'image-1',
      llm_prompt_chains: [{ id: 21 }, { id: 22 }],
      llm_model_responses: [
        { id: 4, llm_model_name: 'Model', humor_flavor_slug: 'dry' },
      ],
    })
    expect(result?.llm_model_responses?.[0].llm_model_response).toBe(
      JSON.stringify({ caption: 'hello' }, null, 2)
    )
  })

  it('supports requests without prompt chains or responses', async () => {
    single.mockResolvedValue({
      data: { id: 12, llm_prompt_chains: null, llm_model_responses: null },
      error: null,
    })
    expect(
      await CaptionRequestsService.getCaptionRequestDetails(12)
    ).toMatchObject({ llm_prompt_chains: [], llm_model_responses: [] })
  })
})
