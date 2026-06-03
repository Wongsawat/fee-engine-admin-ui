import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { useAuth } from '@/auth/useAuth';
import { ApiError } from '@/api/client';

function useApiErrorToast() {
  const queryClient = useQueryClient();
  const { login } = useAuth();

  useEffect(() => {
    function handle(error: unknown) {
      if (!(error instanceof ApiError)) return;
      if (error.status === 401) { login(); return; }
      toast.error(
        error.status === 403 ? 'Insufficient permissions' : 'Request failed',
        { description: error.message }
      );
    }

    const unsubQuery = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'updated' && event.query.state.status === 'error') {
        handle(event.query.state.error);
      }
    });
    const unsubMutation = queryClient.getMutationCache().subscribe((event) => {
      if (
        event.type === 'updated' &&
        event.mutation?.state.status === 'error'
      ) {
        handle(event.mutation.state.error);
      }
    });

    return () => { unsubQuery(); unsubMutation(); };
  }, [queryClient, login]);
}

export function ErrorToast() {
  useApiErrorToast();
  return <Toaster />;
}
