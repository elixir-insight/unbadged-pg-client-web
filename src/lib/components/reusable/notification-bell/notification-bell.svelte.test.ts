import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import NotificationBell from './notification-bell.svelte';

describe('NotificationBell', () => {
	it('renders a notifications link when viewAllHref is provided', async () => {
		const screen = render(NotificationBell, { viewAllHref: '/management/notifications' });

		const link = screen.getByRole('link', { name: 'Notifications' });
		await expect.element(link).toBeVisible();
		await expect.element(link).toHaveAttribute('href', '/management/notifications');
	});

	it('shows a primary alert badge by default', async () => {
		const screen = render(NotificationBell, { viewAllHref: '/management/notifications' });

		const badge = screen.container.querySelector('.bg-primary.rounded-full');
		expect(badge).not.toBeNull();
	});

	it('does not render a link when viewAllHref is missing', async () => {
		const screen = render(NotificationBell);

		expect(screen.container.querySelector('a')).toBeNull();
	});
});
