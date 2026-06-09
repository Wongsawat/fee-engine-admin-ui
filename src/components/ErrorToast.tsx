import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { Copy, Check } from 'lucide-react';
import { useAuth } from '@/auth/useAuth';
import { ApiError } from '@/api/client';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const TOAST_MAX_LENGTH = 120;

interface ErrorDialogState { title: string; message: string }

function ErrorDialog({ title, message, onClose }: ErrorDialogState & { onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [message]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <pre className="rounded-md bg-muted p-3 text-sm overflow-auto max-h-96 whitespace-pre-wrap break-all">
          {message}
        </pre>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied
              ? <><Check className="h-4 w-4 mr-1" />Copied</>
              : <><Copy className="h-4 w-4 mr-1" />Copy</>}
          </Button>
          <Button size="sm" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function useApiErrorToast(onLongError: (e: ErrorDialogState) => void) {
  const queryClient = useQueryClient();
  const { login } = useAuth();

  useEffect(() => {
    function handle(error: unknown) {
      if (!(error instanceof ApiError)) return;
      if (error.status === 401) { login(); return; }
      const title = error.status === 403 ? 'Insufficient permissions' : 'Request failed';
      if (error.message && error.message.length > TOAST_MAX_LENGTH) {
        onLongError({ title, message: error.message });
      } else {
        toast.error(title, { description: error.message });
      }
    }

    const unsubQuery = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'updated' && event.query.state.status === 'error') {
        handle(event.query.state.error);
      }
    });
    const unsubMutation = queryClient.getMutationCache().subscribe((event) => {
      if (event.type === 'updated' && event.mutation?.state.status === 'error') {
        const err = event.mutation.state.error;
        if (err instanceof ApiError && (err.status === 404 || err.status === 409)) return;
        handle(err);
      }
    });

    return () => { unsubQuery(); unsubMutation(); };
  }, [queryClient, login, onLongError]);
}

export function ErrorToast() {
  const [dialog, setDialog] = useState<ErrorDialogState | null>(null);
  useApiErrorToast(setDialog);

  return (
    <>
      <Toaster />
      {dialog && (
        <ErrorDialog
          title={dialog.title}
          message={dialog.message}
          onClose={() => setDialog(null)}
        />
      )}
    </>
  );
}
