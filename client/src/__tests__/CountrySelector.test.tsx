import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CountrySelector } from '../components/CountrySelector';

describe('CountrySelector', () => {
  it('displays the selected country name when not focused', () => {
    render(<CountrySelector value="VNM" onChange={vi.fn()} />);
    const input = screen.getByRole('combobox');
    expect(input).toHaveValue('Viet Nam');
  });

  it('shows a dropdown with matching options when user types', async () => {
    const user = userEvent.setup();
    render(<CountrySelector value="VNM" onChange={vi.fn()} />);
    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.clear(input);
    await user.type(input, 'Thai');
    expect(await screen.findByText(/Thailand/)).toBeInTheDocument();
  });

  it('calls onChange with the selected ISO3 when user clicks an option', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CountrySelector value="VNM" onChange={onChange} />);
    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.clear(input);
    await user.type(input, 'Thai');
    const option = await screen.findByText(/Thailand/);
    await user.click(option);
    expect(onChange).toHaveBeenCalledWith('THA');
  });

  it('navigates the list with ArrowDown and selects with Enter', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CountrySelector value="" onChange={onChange} />);
    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.clear(input);
    await user.type(input, 'Viet');
    await screen.findByText(/Viet Nam/);
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onChange).toHaveBeenCalled();
  });

  it('closes the dropdown on Escape', async () => {
    const user = userEvent.setup();
    render(<CountrySelector value="VNM" onChange={vi.fn()} />);
    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.clear(input);
    await user.type(input, 'Viet');
    await screen.findByText(/Viet Nam/);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
