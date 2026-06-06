import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { DraftStatusBadge } from '@/components/DraftStatusBadge';
import { AiReviewDialog } from '@/components/AiReviewDialog';
import { RuleForm } from '@/components/RuleForm';
import { useAiDraft, useUpdateDraft, useDraftDryRun, useApproveDraft, useRejectDraft, useDeleteDraft } from '@/api/ai-drafts';
import { canDryRun, canApprove, canReject, canDelete, canEdit } from '@/lib/draft-helpers';
import type { RuleFormValues } from '@/lib/schemas';

function extractIdFromPath(pathname: string): string | undefined {
  const segments = pathname.split('/').filter(Boolean);
  const idx = segments.indexOf('ai-drafts');
  if (idx === -1 || idx + 1 >= segments.length) return undefined;
  return segments[idx + 1];
}

function ruleJsonToFormValues(ruleJson: unknown): Partial<RuleFormValues> {
  if (!ruleJson || typeof ruleJson !== 'object') return {};
  const r = ruleJson as Record<string, unknown>;
  return {
    paymentType: r.paymentType as RuleFormValues['paymentType'],
    scheme: r.scheme as RuleFormValues['scheme'],
    chargeBearer: r.chargeBearer as RuleFormValues['chargeBearer'],
    accountIdentification: typeof r.accountIdentification === 'string' ? r.accountIdentification : undefined,
    chargeType: typeof r.chargeType === 'string' ? r.chargeType : '',
    feeType: r.feeType as RuleFormValues['feeType'],
    flatAmount: typeof r.flatAmount === 'string' ? r.flatAmount : undefined,
    percentage: typeof r.percentage === 'string' ? r.percentage : undefined,
    minFee: typeof r.minFee === 'string' ? r.minFee : undefined,
    maxFee: typeof r.maxFee === 'string' ? r.maxFee : undefined,
    tiers: Array.isArray(r.tiers) ? r.tiers as RuleFormValues['tiers'] : [],
    currency: typeof r.currency === 'string' ? r.currency : '',
    destinationCountry: typeof r.destinationCountry === 'string' ? r.destinationCountry : undefined,
    priority: typeof r.priority === 'number' ? r.priority : undefined,
  };
}

export function DraftDetailPage() {
  const location = useLocation();
  const id = extractIdFromPath(location.pathname);
  const [editMode, setEditMode] = useState(false);

  const { data: draft, isLoading, error } = useAiDraft(id);
  const updateDraft = useUpdateDraft();
  const dryRun = useDraftDryRun();
  const approve = useApproveDraft();
  const reject = useRejectDraft();
  const deleteDraft = useDeleteDraft();

  if (isLoading) {
    return <div className="mx-auto max-w-4xl px-4 py-6 text-muted-foreground">Loading…</div>;
  }

  const is404 = error && (error as { status?: number }).status === 404;
  if (is404 || !draft) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-2">
        <p className="text-muted-foreground">Draft not found</p>
        <Link to="/ai-drafts" className="underline text-sm">Back to AI Drafts</Link>
      </div>
    );
  }

  // NOTE: handleEditSubmit, handleApprove, and handleDelete below are intentionally
  // minimal — the missing toasts and navigate-on-delete are added in Task 19.
  function handleEditSubmit(values: RuleFormValues) {
    const prevStatus = draft!.status;
    updateDraft.mutate({ id: draft!.id, rule: values }, {
      onSuccess: (updated) => {
        setEditMode(false);
        if (updated.status !== prevStatus) {
          // status reset to PENDING — handled via query invalidation + re-render
        }
      },
    });
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
      {/* Header row */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link to="/ai-drafts" className="text-sm text-muted-foreground underline" aria-label="Back">
          ← AI Drafts
        </Link>
        <Badge variant="outline">{draft.type}</Badge>
        <DraftStatusBadge status={draft.status} />
        <span className="text-xs text-muted-foreground">v{draft.version}</span>
      </div>

      {/* Prompt section */}
      <section aria-labelledby="prompt-heading">
        <h2 id="prompt-heading" className="text-sm font-medium mb-1">Prompt</h2>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{draft.prompt}</p>
        {draft.targetRuleId && (
          <p className="text-xs text-muted-foreground mt-1">
            Target rule: <span className="font-mono">{draft.targetRuleId}</span>
          </p>
        )}
      </section>

      {draft.explanation != null && (
        <section aria-labelledby="explanation-heading">
          <h2 id="explanation-heading" className="text-sm font-medium mb-1">AI Explanation</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{draft.explanation}</p>
        </section>
      )}

      {/* Rule JSON section */}
      <section aria-label="Rule JSON" aria-labelledby="rule-json-heading">
        <div className="flex items-center gap-2 mb-2">
          <h2 id="rule-json-heading" className="text-sm font-medium">Rule JSON</h2>
          {canEdit(draft.status) && !editMode && (
            <Button size="sm" variant="outline" onClick={() => setEditMode(true)}
              disabled={!draft.ruleJson}>
              Edit Rule
            </Button>
          )}
          <AiReviewDialog ruleJson={draft.ruleJson} />
        </div>

        {editMode ? (
          <div className="border rounded-md p-4">
            <RuleForm
              defaultValues={ruleJsonToFormValues(draft.ruleJson)}
              onSubmit={handleEditSubmit}
              isSubmitting={updateDraft.isPending}
              submitLabel="Save"
            />
            <Button variant="ghost" size="sm" onClick={() => setEditMode(false)} className="mt-2">
              Cancel edit
            </Button>
          </div>
        ) : (
          <pre className="rounded-md bg-muted p-4 text-xs overflow-auto">
            {draft.ruleJson
              ? JSON.stringify(draft.ruleJson, null, 2)
              : 'No rule data.'}
          </pre>
        )}
      </section>

      {/* Dry-run result section */}
      {!!draft.dryRunResult && (
        <section aria-labelledby="dry-run-result-heading">
          <h2 id="dry-run-result-heading" className="text-sm font-medium mb-1">Dry-run Result</h2>
          <div className={`rounded-md p-4 text-xs font-mono ${
            draft.status === 'DRY_RUN_PASSED' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <pre className="whitespace-pre-wrap">{JSON.stringify(draft.dryRunResult, null, 2)}</pre>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            This result corresponds to the current rule JSON. It will be cleared if you edit the rule.
          </p>
        </section>
      )}

      {/* Linked rule section (APPROVED) */}
      {draft.feeRuleId && (
        <section>
          <p className="text-sm">
            Pushed to fee-engine as rule{' '}
            <Link to={`/rules/${draft.feeRuleId}`} className="font-mono underline">
              {draft.feeRuleId}
            </Link>
          </p>
        </section>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {canDryRun(draft.status) && (
          <Button
            variant="outline"
            onClick={() => dryRun.mutate(draft.id)}
            disabled={dryRun.isPending}
          >
            {dryRun.isPending ? 'Running…' : 'Dry Run'}
          </Button>
        )}
        {canApprove(draft.status) && (
          <Button
            onClick={() => approve.mutate(draft.id)}
            disabled={approve.isPending}
          >
            {approve.isPending ? 'Approving…' : 'Approve'}
          </Button>
        )}
        {canReject(draft.status) && (
          <Button
            variant="destructive"
            onClick={() => reject.mutate(draft.id)}
            disabled={reject.isPending}
          >
            {reject.isPending ? 'Rejecting…' : 'Reject'}
          </Button>
        )}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (canDelete(draft.status)) deleteDraft.mutate(draft.id);
                  }}
                  disabled={!canDelete(draft.status) || deleteDraft.isPending}
                >
                  {deleteDraft.isPending ? 'Deleting…' : 'Delete'}
                </Button>
              </span>
            </TooltipTrigger>
            {!canDelete(draft.status) && (
              <TooltipContent>Approved drafts cannot be deleted</TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Metadata footer */}
      <footer className="text-xs text-muted-foreground border-t pt-4">
        <p>Created by {draft.createdBy} at {draft.createdAt} · Updated by {draft.updatedBy} at {draft.updatedAt}</p>
      </footer>
    </div>
  );
}
