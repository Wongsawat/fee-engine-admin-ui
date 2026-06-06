import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/auth/useAuth';
import { apiFetch } from './client';
import type {
  CreateFeeRuleRequest,
  FeeRuleFilters,
  FeeRulePageResponse,
  FeeRuleResponse,
  StatusToggleRequest,
  UpdateFeeRuleRequest,
} from '@/types/fee-rule';

function buildListUrl(filters: FeeRuleFilters, page: number, size = 20): string {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));
  if (filters.paymentType) params.set('paymentType', filters.paymentType);
  if (filters.scheme) params.set('scheme', filters.scheme);
  if (filters.chargeBearer) params.set('chargeBearer', filters.chargeBearer);
  if (filters.feeType) params.set('feeType', filters.feeType);
  if (filters.currency) params.set('currency', filters.currency);
  if (filters.accountIdentification) params.set('accountIdentification', filters.accountIdentification);
  if (filters.destinationCountry) params.set('destinationCountry', filters.destinationCountry);
  if (filters.active !== undefined) params.set('active', String(filters.active));
  return `/admin/fee-rules?${params}`;
}

export function useFeeRules(
  filters: FeeRuleFilters,
  page: number,
  size = 20,
  enabled = true,
) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['fee-rules', 'list', filters, page, size] as const,
    queryFn: () => apiFetch<FeeRulePageResponse>(buildListUrl(filters, page, size), token),
    enabled,
  });
}

export function useFeeRule(id: string | undefined) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['fee-rules', 'detail', id] as const,
    queryFn: () => apiFetch<FeeRuleResponse>(`/admin/fee-rules/${id}`, token),
    enabled: !!id,
  });
}

export function useCreateFeeRule() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateFeeRuleRequest) =>
      apiFetch<FeeRuleResponse>('/admin/fee-rules', token, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-rules', 'list'] });
    },
  });
}

export function useUpdateFeeRule() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: UpdateFeeRuleRequest & { id: string }) =>
      apiFetch<FeeRuleResponse>(`/admin/fee-rules/${id}`, token, {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['fee-rules', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['fee-rules', 'detail', id] });
    },
  });
}

export function useToggleFeeRuleStatus() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: StatusToggleRequest & { id: string }) =>
      apiFetch<FeeRuleResponse>(`/admin/fee-rules/${id}/status`, token, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onMutate: async ({ id, active }) => {
      await queryClient.cancelQueries({ queryKey: ['fee-rules', 'list'] });
      const snapshots = queryClient.getQueriesData<FeeRulePageResponse>({
        queryKey: ['fee-rules', 'list'],
      });
      queryClient.setQueriesData<FeeRulePageResponse>(
        { queryKey: ['fee-rules', 'list'] },
        (old) => old
          ? { ...old, content: old.content.map((r) => r.id === id ? { ...r, active } : r) }
          : old,
      );
      return { snapshots };
    },
    onError: (_err, _vars, context) => {
      context?.snapshots.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: (_data, _err, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['fee-rules', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['fee-rules', 'detail', id] });
    },
  });
}
