import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../test-utils';
import { TierEditor } from '@/components/TierEditor';
import { tierSchema } from '@/lib/schemas';

const schema = z.object({ tiers: z.array(tierSchema) });

function Harness() {
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { tiers: [] } });
  return (
    <FormProvider {...form}>
      <TierEditor control={form.control} name="tiers" />
    </FormProvider>
  );
}

describe('TierEditor', () => {
  it('renders empty state with add button', () => {
    renderWithProviders(<Harness />);
    expect(screen.getByRole('button', { name: /add tier/i })).toBeInTheDocument();
  });

  it('adds a tier row when Add Tier is clicked', () => {
    renderWithProviders(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: /add tier/i }));
    expect(screen.getByPlaceholderText('Min')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Max')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Amount')).toBeInTheDocument();
  });

  it('removes a tier row when Remove is clicked', () => {
    renderWithProviders(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: /add tier/i }));
    fireEvent.click(screen.getByRole('button', { name: /remove/i }));
    expect(screen.queryByPlaceholderText('Min')).not.toBeInTheDocument();
  });
});
