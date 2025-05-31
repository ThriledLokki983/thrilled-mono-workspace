import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: 'Click me' });
    expect(button).toBeDefined();
  });

  it('applies correct variant class', () => {
    render(<Button variant="secondary">Secondary Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDefined();
    expect(screen.getByText('Secondary Button')).toBeDefined();
  });

  it('applies correct size class', () => {
    render(<Button size="large">Large Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDefined();
    expect(screen.getByText('Large Button')).toBeDefined();
  });

  it('shows loading state', () => {
    render(<Button loading>Loading Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDefined();
    expect(screen.getByText('Loading Button')).toBeDefined();
  });

  it('renders with left icon', () => {
    const LeftIcon = () => <svg data-testid="left-icon" />;
    render(<Button leftIcon={<LeftIcon />}>With Icon</Button>);
    expect(screen.getByTestId('left-icon')).toBeDefined();
  });

  it('renders with right icon', () => {
    const RightIcon = () => <svg data-testid="right-icon" />;
    render(<Button rightIcon={<RightIcon />}>With Icon</Button>);
    expect(screen.getByTestId('right-icon')).toBeDefined();
  });

  it('applies full width class', () => {
    render(<Button fullWidth>Full Width</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDefined();
    expect(screen.getByText('Full Width')).toBeDefined();
  });

  it('handles onPress', async () => {
    const user = userEvent.setup();
    const handlePress = vi.fn();
    render(<Button onPress={handlePress}>Click me</Button>);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(handlePress).toHaveBeenCalledTimes(1);
  });

  it('can be disabled', () => {
    render(<Button isDisabled>Disabled Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDefined();
    expect(screen.getByText('Disabled Button')).toBeDefined();
  });

  it('does not call onPress when disabled', async () => {
    const user = userEvent.setup();
    const handlePress = vi.fn();
    render(<Button isDisabled onPress={handlePress}>Disabled</Button>);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(handlePress).not.toHaveBeenCalled();
  });

  it('does not call onPress when loading', async () => {
    const user = userEvent.setup();
    const handlePress = vi.fn();
    render(<Button loading onPress={handlePress}>Loading</Button>);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(handlePress).not.toHaveBeenCalled();
  });

  it('hides icons when loading', () => {
    const LeftIcon = () => <svg data-testid="left-icon" />;
    const RightIcon = () => <svg data-testid="right-icon" />;
    render(
      <Button loading leftIcon={<LeftIcon />} rightIcon={<RightIcon />}>
        Loading
      </Button>
    );
    
    // Icons should not be visible when loading
    expect(screen.queryByTestId('left-icon')).toBeNull();
    expect(screen.queryByTestId('right-icon')).toBeNull();
  });
});
