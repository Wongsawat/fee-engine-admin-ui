import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test-utils';
import { PromptForm } from '@/components/PromptForm';

describe('PromptForm', () => {
  it('renders in GENERATE mode by default', () => {
    renderWithProviders(<PromptForm onSubmit={vi.fn()} isSubmitting={false} />);
    expect(screen.getByRole('combobox', { name: /mode/i })).toBeInTheDocument();
    expect(screen.queryByText(/target rule/i)).not.toBeInTheDocument();
  });

  it('shows RulePicker when UPDATE mode is selected', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PromptForm onSubmit={vi.fn()} isSubmitting={false} />);
    await user.click(screen.getByRole('combobox', { name: /mode/i }));
    await user.click(await screen.findByRole('option', { name: 'UPDATE' }));
    expect(await screen.findByText(/target rule/i)).toBeInTheDocument();
  });

  it('validates that prompt is required', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PromptForm onSubmit={vi.fn()} isSubmitting={false} />);
    await user.click(screen.getByRole('button', { name: /generate/i }));
    expect(await screen.findByText(/required/i)).toBeInTheDocument();
  });

  it('shows character count for prompt', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PromptForm onSubmit={vi.fn()} isSubmitting={false} />);
    await user.type(screen.getByRole('textbox', { name: /prompt/i }), 'abc');
    expect(screen.getByText(/1997/)).toBeInTheDocument();
  });

  it('calls onSubmit with mapped GENERATE request when form is valid', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<PromptForm onSubmit={onSubmit} isSubmitting={false} />);
    await user.type(screen.getByRole('textbox', { name: /prompt/i }), 'Create a flat fee rule');
    await user.click(screen.getByRole('button', { name: /generate/i }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({
      prompt: 'Create a flat fee rule',
      type: 'GENERATE',
    }));
  });

  it('disables submit button while isSubmitting', () => {
    renderWithProviders(<PromptForm onSubmit={vi.fn()} isSubmitting={true} />);
    expect(screen.getByRole('button', { name: /generating/i })).toBeDisabled();
  });

  it('shows AlertDialog when Cancel is clicked with dirty prompt', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PromptForm onSubmit={vi.fn()} isSubmitting={false} />, {
      initialEntries: ['/ai-drafts/new'],
    });
    await user.type(screen.getByRole('textbox', { name: /prompt/i }), 'some text');
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(await screen.findByText(/discard this draft/i)).toBeInTheDocument();
  });
});
