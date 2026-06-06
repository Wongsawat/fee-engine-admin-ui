import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { useReviewRule } from '@/api/ai-drafts';

interface AiReviewDialogProps {
  ruleJson: unknown;
}

export function AiReviewDialog({ ruleJson }: AiReviewDialogProps) {
  const [open, setOpen] = useState(false);
  const review = useReviewRule();

  function handleOpen() {
    setOpen(true);
    review.mutate({ ruleJson: JSON.stringify(ruleJson) });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" onClick={handleOpen}>AI Review</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>AI Review</DialogTitle>
        </DialogHeader>
        {review.isPending && (
          <p className="text-sm text-muted-foreground">Analysing…</p>
        )}
        {review.isError && (
          <p className="text-sm text-destructive">Review failed. Please try again.</p>
        )}
        {review.data && (
          <p className="text-sm whitespace-pre-wrap">{review.data.analysis}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
