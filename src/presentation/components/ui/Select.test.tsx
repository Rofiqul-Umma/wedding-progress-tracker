import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { Select } from './Select';

describe('Select', () => {
  const options = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cherry' },
  ];

  it('renders select with options and default arrow bottom icon', () => {
    const { container } = render(
      <Select id="fruit-select" aria-label="Fruit" options={options} value="banana" onChange={() => {}} />,
    );

    const select = screen.getByRole('combobox', { name: 'Fruit' }) as HTMLSelectElement;
    expect(select).toBeInTheDocument();
    expect(select.value).toBe('banana');
    expect(select).toHaveClass('appearance-none', 'pr-10');

    // The arrow icon is present and marked as aria-hidden with pointer-events-none
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon).toHaveClass('pointer-events-none');
  });

  it('renders children options correctly', () => {
    render(
      <Select id="child-select" aria-label="Status" defaultValue="active">
        <option value="active">Active</option>
        <option value="paused">Paused</option>
      </Select>,
    );

    const select = screen.getByRole('combobox', { name: 'Status' }) as HTMLSelectElement;
    expect(select.value).toBe('active');
    expect(select.querySelectorAll('option')).toHaveLength(2);
  });

  it('calls onChange when user selects an option', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <Select aria-label="Fruit" options={options} defaultValue="apple" onChange={onChange} />,
    );

    const select = screen.getByRole('combobox', { name: 'Fruit' });
    await user.selectOptions(select, 'cherry');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(select).toHaveValue('cherry');
  });

  it('renders compact variant for inline controls', () => {
    render(
      <Select
        variant="compact"
        aria-label="Sort"
        options={options}
        value="apple"
        onChange={() => {}}
      />,
    );

    const select = screen.getByRole('combobox', { name: 'Sort' });
    expect(select).toHaveClass('rounded-[10px]', 'pr-7');
  });

  it('forwards ref to the underlying select element', () => {
    const ref = createRef<HTMLSelectElement>();
    render(<Select ref={ref} aria-label="Ref Test" options={options} />);

    expect(ref.current).toBeInstanceOf(HTMLSelectElement);
  });
});
