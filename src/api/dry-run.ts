import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/auth/useAuth';
import { apiFetch } from './client';
import type { DryRunRequest, DryRunResponse } from '@/types/fee-rule';

export function useDryRun() {
  const { token } = useAuth();
  return useMutation({
    mutationFn: (body: DryRunRequest) =>
      apiFetch<DryRunResponse>('/admin/fee-rules/dry-run', token, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  });
}
