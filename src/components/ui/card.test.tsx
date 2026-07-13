
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from './card';

describe('Card Components', () => {
  it('should render the Card component correctly', () => {
    render(<Card>Test Card Content</Card>);
    const cardElement = screen.getByText('Test Card Content');
    expect(cardElement).toBeInTheDocument();
    expect(cardElement).toHaveClass('rounded-xl border bg-card text-card-foreground shadow'); // Check default classes
  });

  it('should apply custom class names to Card', () => {
    render(<Card className="custom-card-class">Custom Card</Card>);
    const cardElement = screen.getByText('Custom Card');
    expect(cardElement).toBeInTheDocument();
    expect(cardElement).toHaveClass('custom-card-class');
  });

  it('should render CardHeader with its content', () => {
    render(<CardHeader>Card Header Text</CardHeader>);
    const headerElement = screen.getByText('Card Header Text');
    expect(headerElement).toBeInTheDocument();
    expect(headerElement).toHaveClass('flex flex-col space-y-1.5 p-6');
  });

  it('should apply custom class names to CardHeader', () => {
    render(<CardHeader className="custom-header-class">Custom Header</CardHeader>);
    const headerElement = screen.getByText('Custom Header');
    expect(headerElement).toBeInTheDocument();
    expect(headerElement).toHaveClass('custom-header-class');
  });

  it('should render CardTitle with its content', () => {
    render(<CardTitle>Card Title Text</CardTitle>);
    const titleElement = screen.getByText('Card Title Text');
    expect(titleElement).toBeInTheDocument();
    expect(titleElement.tagName).toBe('H3'); // Default tag is h3
    expect(titleElement).toHaveClass('font-semibold leading-none tracking-tight');
  });

  it('should apply custom class names to CardTitle', () => {
    render(<CardTitle className="custom-title-class">Custom Title</CardTitle>);
    const titleElement = screen.getByText('Custom Title');
    expect(titleElement).toBeInTheDocument();
    expect(titleElement).toHaveClass('custom-title-class');
  });

  it('should render CardDescription with its content', () => {
    render(<CardDescription>Card Description Text</CardDescription>);
    const descriptionElement = screen.getByText('Card Description Text');
    expect(descriptionElement).toBeInTheDocument();
    expect(descriptionElement.tagName).toBe('P'); // Default tag is p
    expect(descriptionElement).toHaveClass('text-sm text-muted-foreground');
  });

  it('should apply custom class names to CardDescription', () => {
    render(<CardDescription className="custom-desc-class">Custom Description</CardDescription>);
    const descriptionElement = screen.getByText('Custom Description');
    expect(descriptionElement).toBeInTheDocument();
    expect(descriptionElement).toHaveClass('custom-desc-class');
  });

  it('should render CardContent with its content', () => {
    render(<CardContent>Card Content Section</CardContent>);
    const contentElement = screen.getByText('Card Content Section');
    expect(contentElement).toBeInTheDocument();
    expect(contentElement).toHaveClass('p-6 pt-0');
  });

  it('should apply custom class names to CardContent', () => {
    render(<CardContent className="custom-content-class">Custom Content</CardContent>);
    const contentElement = screen.getByText('Custom Content');
    expect(contentElement).toBeInTheDocument();
    expect(contentElement).toHaveClass('custom-content-class');
  });

  it('should render CardFooter with its content', () => {
    render(<CardFooter>Card Footer Text</CardFooter>);
    const footerElement = screen.getByText('Card Footer Text');
    expect(footerElement).toBeInTheDocument();
    expect(footerElement).toHaveClass('flex items-center p-6 pt-0');
  });

  it('should apply custom class names to CardFooter', () => {
    render(<CardFooter className="custom-footer-class">Custom Footer</CardFooter>);
    const footerElement = screen.getByText('Custom Footer');
    expect(footerElement).toBeInTheDocument();
    expect(footerElement).toHaveClass('custom-footer-class');
  });

  it('should render a complete Card structure', () => {
    render(
      <Card data-testid="complete-card">
        <CardHeader>
          <CardTitle>Complete Card Title</CardTitle>
          <CardDescription>Complete Card Description</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This is the main content of the card.</p>
        </CardContent>
        <CardFooter>
          <span>Complete Card Footer</span>
        </CardFooter>
      </Card>
    );

    const completeCard = screen.getByTestId('complete-card');
    expect(completeCard).toBeInTheDocument();
    expect(screen.getByText('Complete Card Title')).toBeInTheDocument();
    expect(screen.getByText('Complete Card Description')).toBeInTheDocument();
    expect(screen.getByText('This is the main content of the card.')).toBeInTheDocument();
    expect(screen.getByText('Complete Card Footer')).toBeInTheDocument();

    // Check nesting and proper element types
    expect(screen.getByText('Complete Card Title').tagName).toBe('H3');
    expect(screen.getByText('Complete Card Description').tagName).toBe('P');
    expect(completeCard).toContainElement(screen.getByText('Complete Card Title'));
    expect(completeCard).toContainElement(screen.getByText('Complete Card Description'));
    expect(completeCard).toContainElement(screen.getByText('This is the main content of the card.'));
    expect(completeCard).toContainElement(screen.getByText('Complete Card Footer'));
  });
});
