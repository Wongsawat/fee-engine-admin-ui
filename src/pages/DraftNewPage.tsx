import { useNavigate } from 'react-router-dom';
import { PromptForm } from '@/components/PromptForm';
import { useGenerateDraft } from '@/api/ai-drafts';
import type { GenerateDraftRequest } from '@/types/ai-draft';

export function DraftNewPage() {
  const navigate = useNavigate();
  const generate = useGenerateDraft();

  function handleSubmit(req: GenerateDraftRequest) {
    generate.mutate(req, {
      onSuccess: (draft) => {
        navigate(`/ai-drafts/${draft.id}`);
      },
    });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <h1 className="text-xl font-semibold">New AI Draft</h1>
      <PromptForm onSubmit={handleSubmit} isSubmitting={generate.isPending} />
    </div>
  );
}
