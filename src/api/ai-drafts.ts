// src/api/ai-drafts.ts
import {
  useQuery, useMutation, useInfiniteQuery, useQueryClient,
} from '@tanstack/react-query';
import { useAuth } from '@/auth/useAuth';
import { apiFetch } from './client';
import type {
  AiDraftResponse, DraftFilters, GenerateDraftRequest,
  ReviewRuleRequest, ReviewRuleResponse, UpdateDraftRequest,
} from '@/types/ai-draft';
import type { RuleFormValues } from '@/lib/schemas';

const SIZE = 20;

function buildDraftListUrl(filters: DraftFilters, page: number): string {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(SIZE));
  if (filters.status) params.set('status', filters.status);
  return `/ai/drafts?${params}`;
}

export function useAiDrafts(filters: DraftFilters) {
  const { token } = useAuth();
  return useInfiniteQuery({
    queryKey: ['ai-drafts', 'list', filters] as const,
    queryFn: ({ pageParam }) =>
      apiFetch<AiDraftResponse[]>(buildDraftListUrl(filters, pageParam as number), token),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      (lastPage as AiDraftResponse[]).length === SIZE
        ? (lastPageParam as number) + 1
        : undefined,
  });
}

export function useAiDraft(id: string | undefined) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['ai-drafts', 'detail', id] as const,
    queryFn: () => apiFetch<AiDraftResponse>(`/ai/drafts/${id}`, token),
    enabled: !!id,
  });
}

export function useGenerateDraft() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: GenerateDraftRequest) =>
      apiFetch<AiDraftResponse>('/ai/drafts/generate', token, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-drafts', 'list'] });
    },
  });
}

export function useUpdateDraft() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rule }: { id: string; rule: RuleFormValues }) =>
      apiFetch<AiDraftResponse>(`/ai/drafts/${id}`, token, {
        method: 'PUT',
        body: JSON.stringify({ ruleJson: JSON.stringify(rule) } satisfies UpdateDraftRequest),
      }),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['ai-drafts', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['ai-drafts', 'detail', id] });
    },
  });
}

export function useDeleteDraft() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/ai/drafts/${id}`, token, { method: 'DELETE' }),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['ai-drafts', 'list'] });
      queryClient.removeQueries({ queryKey: ['ai-drafts', 'detail', id] });
    },
  });
}

export function useDraftDryRun() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<AiDraftResponse>(`/ai/drafts/${id}/dry-run`, token, { method: 'POST' }),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['ai-drafts', 'detail', id] });
    },
  });
}

export function useApproveDraft() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<AiDraftResponse>(`/ai/drafts/${id}/approve`, token, { method: 'POST' }),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['ai-drafts', 'detail', id] });
      queryClient.invalidateQueries({ queryKey: ['ai-drafts', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['fee-rules', 'list'] });
    },
    onError: (_err, id) => {
      queryClient.invalidateQueries({ queryKey: ['ai-drafts', 'detail', id] });
    },
  });
}

export function useRejectDraft() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<AiDraftResponse>(`/ai/drafts/${id}/reject`, token, { method: 'POST' }),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['ai-drafts', 'detail', id] });
      queryClient.invalidateQueries({ queryKey: ['ai-drafts', 'list'] });
    },
  });
}

export function useReviewRule() {
  const { token } = useAuth();
  return useMutation({
    mutationFn: (body: ReviewRuleRequest) =>
      apiFetch<ReviewRuleResponse>('/ai/drafts/review', token, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  });
}
