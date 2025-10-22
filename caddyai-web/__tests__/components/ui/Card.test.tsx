import { render, screen } from '@testing-library/react'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card'

describe('Card Component', () => {
  it('renders children correctly', () => {
    render(<Card>Card Content</Card>)
    expect(screen.getByText('Card Content')).toBeInTheDocument()
  })

  it('applies default variant', () => {
    const { container } = render(<Card>Default</Card>)
    const card = container.firstChild
    expect(card).toHaveClass('bg-secondary')
    expect(card).toHaveClass('border')
  })

  it('applies bordered variant', () => {
    const { container } = render(<Card variant="bordered">Bordered</Card>)
    const card = container.firstChild
    expect(card).toHaveClass('border-2')
    expect(card).toHaveClass('border-primary')
  })

  it('applies elevated variant', () => {
    const { container } = render(<Card variant="elevated">Elevated</Card>)
    const card = container.firstChild
    expect(card).toHaveClass('shadow-card')
  })

  it('applies different padding sizes', () => {
    const { container, rerender } = render(<Card padding="none">No Padding</Card>)
    let card = container.firstChild
    expect(card).not.toHaveClass('p-4')

    rerender(<Card padding="sm">Small</Card>)
    card = container.firstChild
    expect(card).toHaveClass('p-4')

    rerender(<Card padding="md">Medium</Card>)
    card = container.firstChild
    expect(card).toHaveClass('p-6')

    rerender(<Card padding="lg">Large</Card>)
    card = container.firstChild
    expect(card).toHaveClass('p-8')
  })

  it('applies custom className', () => {
    const { container } = render(<Card className="custom-class">Custom</Card>)
    const card = container.firstChild
    expect(card).toHaveClass('custom-class')
  })

  it('forwards additional props', () => {
    render(<Card data-testid="test-card">Test</Card>)
    expect(screen.getByTestId('test-card')).toBeInTheDocument()
  })
})

describe('CardHeader Component', () => {
  it('renders title and description', () => {
    render(
      <CardHeader title="Test Title" description="Test Description" />
    )
    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
  })

  it('renders children when provided', () => {
    render(
      <CardHeader>
        <div>Custom Header</div>
      </CardHeader>
    )
    expect(screen.getByText('Custom Header')).toBeInTheDocument()
  })

  it('renders only title without description', () => {
    render(<CardHeader title="Only Title" />)
    expect(screen.getByText('Only Title')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <CardHeader className="custom-header" title="Test" />
    )
    const header = container.firstChild
    expect(header).toHaveClass('custom-header')
  })

  it('has proper heading structure', () => {
    render(<CardHeader title="Heading Test" />)
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toHaveTextContent('Heading Test')
  })
})

describe('CardContent Component', () => {
  it('renders children correctly', () => {
    render(
      <CardContent>
        <p>Content here</p>
      </CardContent>
    )
    expect(screen.getByText('Content here')).toBeInTheDocument()
  })

  it('applies spacing classes', () => {
    const { container } = render(<CardContent>Content</CardContent>)
    const content = container.firstChild
    expect(content).toHaveClass('space-y-4')
  })

  it('applies custom className', () => {
    const { container } = render(
      <CardContent className="custom-content">Content</CardContent>
    )
    const content = container.firstChild
    expect(content).toHaveClass('custom-content')
  })
})

describe('CardFooter Component', () => {
  it('renders children correctly', () => {
    render(
      <CardFooter>
        <button>Action</button>
      </CardFooter>
    )
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument()
  })

  it('applies flex layout', () => {
    const { container } = render(<CardFooter>Footer</CardFooter>)
    const footer = container.firstChild
    expect(footer).toHaveClass('flex')
    expect(footer).toHaveClass('items-center')
    expect(footer).toHaveClass('gap-4')
  })

  it('applies custom className', () => {
    const { container } = render(
      <CardFooter className="custom-footer">Footer</CardFooter>
    )
    const footer = container.firstChild
    expect(footer).toHaveClass('custom-footer')
  })
})

describe('Card Integration', () => {
  it('renders complete card structure', () => {
    render(
      <Card>
        <CardHeader
          title="Complete Card"
          description="This is a complete card example"
        />
        <CardContent>
          <p>Card body content</p>
        </CardContent>
        <CardFooter>
          <button>Action 1</button>
          <button>Action 2</button>
        </CardFooter>
      </Card>
    )

    expect(screen.getByText('Complete Card')).toBeInTheDocument()
    expect(screen.getByText('This is a complete card example')).toBeInTheDocument()
    expect(screen.getByText('Card body content')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Action 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Action 2' })).toBeInTheDocument()
  })
})
