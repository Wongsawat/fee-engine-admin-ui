import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { RulePicker } from './RulePicker';
import { promptFormSchema, type PromptFormValues } from '@/lib/schemas';
import { toGenerateRequest } from '@/lib/draft-helpers';
import type { GenerateDraftRequest } from '@/types/ai-draft';

interface PromptFormProps {
  onSubmit: (req: GenerateDraftRequest) => void;
  isSubmitting: boolean;
}

const MAX_PROMPT = 2000;

export function PromptForm({ onSubmit, isSubmitting }: PromptFormProps) {
  const navigate = useNavigate();
  const [cancelOpen, setCancelOpen] = useState(false);

  const form = useForm<PromptFormValues>({
    resolver: zodResolver(promptFormSchema),
    defaultValues: { mode: 'GENERATE', prompt: '', targetRuleId: undefined },
  });

  const mode = form.watch('mode');
  const prompt = form.watch('prompt');
  const remaining = MAX_PROMPT - (prompt?.length ?? 0);

  function handleSubmit(values: PromptFormValues) {
    onSubmit(toGenerateRequest(values));
  }

  function handleCancel() {
    if (prompt && prompt.length > 0) {
      setCancelOpen(true);
    } else {
      navigate('/ai-drafts');
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="mode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mode</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger aria-label="Mode">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="GENERATE">GENERATE</SelectItem>
                    <SelectItem value="UPDATE">UPDATE</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {mode === 'UPDATE' && (
            <FormField
              control={form.control}
              name="targetRuleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Rule</FormLabel>
                  <FormControl>
                    <RulePicker
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="prompt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prompt</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    aria-label="Prompt"
                    rows={5}
                    maxLength={MAX_PROMPT}
                    placeholder={
                      mode === 'UPDATE'
                        ? 'Describe the changes you want to make…'
                        : 'Describe the fee rule you want to create…'
                    }
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground text-right">
                  {remaining} characters remaining
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Generating…' : 'Generate'}
            </Button>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </Form>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard this draft?</AlertDialogTitle>
            <AlertDialogDescription>
              Your prompt will be lost. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate('/ai-drafts')}>
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
