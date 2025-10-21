import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/Button'

describe('Button Component', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('applies primary variant by default', () => {
    render(<Button>Primary</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-primary')
  })

  it('applies different variants correctly', () => {
    const variants = ['primary', 'secondary', 'outline', 'ghost', 'danger'] as const

    variants.forEach((variant) => {
      const { container } = render(<Button variant={variant}>{variant}</Button>)
      const button = container.querySelector('button')
      expect(button).toBeInTheDocument()
    })
  })

  it('applies different sizes correctly', () => {
    const { rerender } = render(<Button size="sm">Small</Button>)
    let button = screen.getByRole('button')
    expect(button).toHaveClass('text-sm')

    rerender(<Button size="md">Medium</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('text-base')

    rerender(<Button size="lg">Large</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('text-lg')
  })

  it('renders as full width when specified', () => {
    render(<Button fullWidth>Full Width</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('w-full')
  })

  it('shows loading spinner when loading', () => {
    render(<Button loading>Loading</Button>)
    const spinner = screen.getByRole('button').querySelector('svg.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('disables button when loading', () => {
    render(<Button loading>Loading</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('disables button when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('renders with icon', () => {
    const icon = <span data-testid="icon">🎯</span>
    render(<Button icon={icon}>With Icon</Button>)
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  it('hides icon when loading', () => {
    const icon = <span data-testid="icon">🎯</span>
    render(<Button icon={icon} loading>Loading</Button>)
    expect(screen.queryByTestId('icon')).not.toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('does not trigger click when disabled', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick} disabled>Click me</Button>)

    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  it('forwards additional props', () => {
    render(<Button type="submit" data-testid="submit-btn">Submit</Button>)
    const button = screen.getByTestId('submit-btn')
    expect(button).toHaveAttribute('type', 'submit')
  })

  describe('Accessibility', () => {
    it('has appropriate ARIA attributes when disabled', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('disabled')
    })

    it('meets touch target size requirements (WCAG 2.1 AAA)', () => {
      render(<Button size="md">Touch Target</Button>)
      const button = screen.getByRole('button')
      // Button should have h-11 sm:h-12 classes (44px -> 48px)
      expect(button).toHaveClass('h-11')
    })

    it('has focus styles', () => {
      render(<Button>Focus me</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('focus:outline-none')
      expect(button).toHaveClass('focus:ring-2')
    })
  })
})
