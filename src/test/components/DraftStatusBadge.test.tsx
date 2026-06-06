import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test-utils';
import { DraftStatusBadge } from '@/components/DraftStatusBadge';
import type { DraftStatus } from '@/types/ai-draft';

describe('DraftStatusBadge', () => {
  const cases: [DraftStatus, RegExp][] = [
    ['PENDING', /pending/i],
    ['DRY_RUN_PASSED', /dry run passed/i],
    ['DRY_RUN_FAILED', /dry run failed/i],
    ['APPROVED', /approved/i],
    ['REJECTED', /rejected/i],
  ];

  it.each(cases)('renders label for %s', (status, pattern) => {
    renderWithProviders(<DraftStatusBadge status={status} />);
    expect(screen.getByText(pattern)).toBeInTheDocument();
  });
});
