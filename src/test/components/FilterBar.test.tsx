import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test-utils';
import { FilterBar } from '@/components/FilterBar';

describe('FilterBar — destination country', () => {
  it('renders Destination Country filter input', () => {
    renderWithProviders(<FilterBar />);
    expect(screen.getByLabelText(/filter by destination country/i)).toBeInTheDocument();
  });

  it('auto-uppercases typed country code', async () => {
    renderWithProviders(<FilterBar />);
    const input = screen.getByLabelText(/filter by destination country/i);
    await userEvent.type(input, 'in');
    expect(input).toHaveValue('IN');
  });

  it('initializes country filter value from URL search params', () => {
    renderWithProviders(<FilterBar />, { initialEntries: ['/?destinationCountry=FR'] });
    expect(screen.getByLabelText(/filter by destination country/i)).toHaveValue('FR');
  });
});
