import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import NotificationsCard, { type NotificationItem } from './notifications-card.svelte';

const items: NotificationItem[] = [
	{ label: 'Settlement completed', timestamp: '2m ago', tone: 'success' },
	{ label: 'KYC document expiring', timestamp: '1h ago', tone: 'warning' },
	{ label: 'New payout policy', timestamp: '3h ago', tone: 'info' },
	{ label: 'Payment gateway down', timestamp: '5h ago', tone: 'critical' }
];

describe('NotificationsCard', () => {
	it('renders the section heading', async () => {
		const screen = render(NotificationsCard, { items });

		await expect.element(screen.getByText('Notifications')).toBeVisible();
	});

	it('renders every notification label and timestamp', async () => {
		const screen = render(NotificationsCard, { items });

		for (const item of items) {
			await expect.element(screen.getByText(item.label)).toBeVisible();
			await expect.element(screen.getByText(item.timestamp)).toBeVisible();
		}
	});

	it('renders one row per notification', async () => {
		const screen = render(NotificationsCard, { items });
		const rows = screen.container.querySelectorAll('.divide-y > div');

		expect(rows.length).toBe(items.length);
	});

	it('applies tone-specific styling to the icon wrapper', async () => {
		const screen = render(NotificationsCard, { items });
		const iconWrappers = screen.container.querySelectorAll('.divide-y > div > span:first-child');

		expect(iconWrappers[0].className).toContain('text-success');
		expect(iconWrappers[1].className).toContain('text-warning');
		expect(iconWrappers[2].className).toContain('text-primary');
		expect(iconWrappers[3].className).toContain('text-destructive');
	});

	it('renders no rows when there are no notifications', async () => {
		const screen = render(NotificationsCard, { items: [] });
		const rows = screen.container.querySelectorAll('.divide-y > div');

		expect(rows.length).toBe(0);
	});
});
