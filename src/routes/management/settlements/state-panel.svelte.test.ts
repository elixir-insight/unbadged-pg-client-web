import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import StatePanel from './state-panel.svelte';

describe('StatePanel', () => {
	it('renders the title', async () => {
		const screen = render(StatePanel, { title: 'No settlements for 8 Jul 2026' });

		await expect.element(screen.getByText('No settlements for 8 Jul 2026')).toBeVisible();
	});

	it('renders an optional description', async () => {
		const screen = render(StatePanel, {
			title: "Couldn't load settlements",
			description: 'Network error, please retry.'
		});

		await expect.element(screen.getByText('Network error, please retry.')).toBeVisible();
	});

	it('omits the description when none is given', async () => {
		const screen = render(StatePanel, { title: 'No transactions found' });

		expect(screen.container.querySelector('.text-xs.text-muted-foreground')).toBeNull();
	});

	it('does not render an action button when actionLabel/onAction are omitted', async () => {
		const screen = render(StatePanel, { title: 'No transactions found' });

		expect(screen.container.querySelector('button')).toBeNull();
	});

	it('does not render an action button when only actionLabel is given', async () => {
		const screen = render(StatePanel, { title: 'No transactions found', actionLabel: 'Retry' });

		expect(screen.container.querySelector('button')).toBeNull();
	});

	it('renders an action button and fires onAction when clicked', async () => {
		const onAction = vi.fn();
		const screen = render(StatePanel, { title: 'Error', actionLabel: 'Retry', onAction });

		const button = screen.getByRole('button', { name: 'Retry' });
		await expect.element(button).toBeVisible();
		await button.click();

		expect(onAction).toHaveBeenCalledOnce();
	});
});
