import { describe, expect, it } from 'vitest';
import { createRawSnippet } from 'svelte';
import { render } from 'vitest-browser-svelte';
import Card from './card.svelte';

const children = createRawSnippet(() => ({
	render: () => '<p data-testid="card-body">Card content</p>'
}));

const footer = createRawSnippet(() => ({
	render: () => '<p data-testid="card-footer">Footer content</p>'
}));

describe('Card', () => {
	it('renders title and description', async () => {
		const screen = render(Card, {
			title: 'Card Title',
			description: 'Card description',
			children
		});

		await expect.element(screen.getByText('Card Title')).toBeVisible();
		await expect.element(screen.getByText('Card description')).toBeVisible();
	});

	it('renders children content', async () => {
		const screen = render(Card, { title: 'Card Title', children });

		await expect.element(screen.getByTestId('card-body')).toBeVisible();
	});

	it('renders footer snippet when provided', async () => {
		const screen = render(Card, { title: 'Card Title', children, footer });

		await expect.element(screen.getByTestId('card-footer')).toBeVisible();
	});

	it('applies tint classes when tint prop is set', async () => {
		const screen = render(Card, { title: 'Tinted Card', tint: 'primary', children });
		const card = screen.container.querySelector('[data-slot="card"]');

		expect(card?.className).toContain('from-primary/10');
	});
});
