import { render, screen, fireEvent } from '@testing-library/react'
import { Input } from '@/components/ui/Input'
import { createRef } from 'react'

describe('Input Component', () => {
  it('renders input field', () => {
    render(<Input />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('renders with label', () => {
    render(<Input label="Email Address" />)
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument()
  })

  it('renders with placeholder', () => {
    render(<Input placeholder="Enter your email" />)
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument()
  })

  it('renders with helper text', () => {
    render(<Input helperText="This is a hint" />)
    expect(screen.getByText('This is a hint')).toBeInTheDocument()
  })

  it('renders with error message', () => {
    render(<Input error="This field is required" />)
    expect(screen.getByText('This field is required')).toBeInTheDocument()
  })

  it('hides helper text when error is present', () => {
    render(<Input helperText="Helper" error="Error message" />)
    expect(screen.getByText('Error message')).toBeInTheDocument()
    expect(screen.queryByText('Helper')).not.toBeInTheDocument()
  })

  it('applies error styling when error prop is provided', () => {
    render(<Input error="Error" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('border-error')
  })

  it('renders with icon', () => {
    const icon = <span data-testid="input-icon">🔍</span>
    render(<Input icon={icon} />)
    expect(screen.getByTestId('input-icon')).toBeInTheDocument()
  })

  it('applies padding for icon', () => {
    const icon = <span>🔍</span>
    render(<Input icon={icon} />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('pl-10')
  })

  it('renders as full width', () => {
    const { container } = render(<Input fullWidth />)
    const wrapper = container.firstChild
    expect(wrapper).toHaveClass('w-full')
  })

  it('handles value changes', () => {
    const handleChange = jest.fn()
    render(<Input onChange={handleChange} />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'test value' } })

    expect(handleChange).toHaveBeenCalled()
  })

  it('can be disabled', () => {
    render(<Input disabled />)
    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
  })

  it('applies disabled styling', () => {
    render(<Input disabled />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('disabled:opacity-50')
    expect(input).toHaveClass('disabled:cursor-not-allowed')
  })

  it('forwards ref correctly', () => {
    const ref = createRef<HTMLInputElement>()
    render(<Input ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it('uses name as id fallback', () => {
    render(<Input name="email" label="Email" />)
    const input = screen.getByLabelText('Email')
    expect(input).toHaveAttribute('id', 'email')
  })

  it('uses custom id when provided', () => {
    render(<Input id="custom-id" name="email" label="Email" />)
    const input = screen.getByLabelText('Email')
    expect(input).toHaveAttribute('id', 'custom-id')
  })

  it('applies custom className', () => {
    render(<Input className="custom-input" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('custom-input')
  })

  it('forwards additional HTML attributes', () => {
    render(<Input type="email" required autoComplete="email" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('type', 'email')
    expect(input).toHaveAttribute('required')
    expect(input).toHaveAttribute('autoComplete', 'email')
  })

  describe('Accessibility', () => {
    it('associates label with input', () => {
      render(<Input label="Username" name="username" />)
      const input = screen.getByLabelText('Username')
      expect(input).toHaveAttribute('id', 'username')
    })

    it('meets minimum font size (16px) to prevent iOS zoom', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('text-base')
    })

    it('meets touch target size requirements', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      // Should have h-11 sm:h-12 classes (44px -> 48px)
      expect(input).toHaveClass('h-11')
    })

    it('has visible focus indicator', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('focus:border-primary')
      expect(input).toHaveClass('focus:ring-2')
    })

    it('error message has appropriate styling for visibility', () => {
      render(<Input error="Required field" />)
      const error = screen.getByText('Required field')
      expect(error).toHaveClass('text-error')
    })
  })

  describe('Form Integration', () => {
    it('works in controlled mode', () => {
      const { rerender } = render(<Input value="initial" onChange={() => {}} />)
      let input = screen.getByRole('textbox') as HTMLInputElement
      expect(input.value).toBe('initial')

      rerender(<Input value="updated" onChange={() => {}} />)
      input = screen.getByRole('textbox') as HTMLInputElement
      expect(input.value).toBe('updated')
    })

    it('works in uncontrolled mode', () => {
      render(<Input defaultValue="default value" />)
      const input = screen.getByRole('textbox') as HTMLInputElement
      expect(input.value).toBe('default value')
    })
  })
})
