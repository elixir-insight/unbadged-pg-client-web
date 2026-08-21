import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import NotificationsInbox from './notifications-inbox.svelte';
import type { NotificationItem } from '$lib/api/notifications';

const goto = vi.hoisted(() => vi.fn());

const pageState = vi.hoisted(() => ({
	url: new URL('http://localhost/management/notifications')
}));

const {
	fetchNotifications,
	markNotificationRead,
	markNotificationDone,
	fetchNotificationModules,
	fetchNotificationSubscriptions,
	updateNotificationSubscriptions
} = vi.hoisted(() => ({
	fetchNotifications: vi.fn(),
	markNotificationRead: vi.fn(),
	markNotificationDone: vi.fn(),
	fetchNotificationModules: vi.fn(),
	fetchNotificationSubscriptions: vi.fn(),
	updateNotificationSubscriptions: vi.fn()
}));

vi.mock('$app/state', () => ({
	get page() {
		return pageState;
	}
}));

vi.mock('$app/navigation', () => ({
	goto
}));

vi.mock('$lib/api/notifications', () => ({
	fetchNotifications,
	markNotificationRead,
	markNotificationDone,
	fetchNotificationModules,
	fetchNotificationSubscriptions,
	updateNotificationSubscriptions
}));

function makeNotification(overrides: Partial<NotificationItem> = {}): NotificationItem {
	return {
		notificationId: 1,
		title: 'Multi-factor authentication disabled',
		body: 'Multi-factor authentication has been disabled for your account.',
		eventCode: 'MFA_DISABLED',
		read: false,
		createdAt: new Date().toISOString(),
		...overrides
	};
}

describe('NotificationsInbox', () => {
	beforeEach(() => {
		pageState.url = new URL('http://localhost/management/notifications');
		goto.mockReset();
		fetchNotifications.mockReset();
		markNotificationRead.mockReset();
		markNotificationDone.mockReset();
		fetchNotificationModules.mockReset();
		fetchNotificationSubscriptions.mockReset();
		updateNotificationSubscriptions.mockReset();
		markNotificationRead.mockResolvedValue('Notification updated successfully');
		markNotificationDone.mockResolvedValue('Notification updated successfully');
		fetchNotificationModules.mockResolvedValue([
			{
				moduleCode: 'SECURITY',
				name: 'Security',
				description: 'Password, MFA, login, account unlock, and system maintenance updates.',
				subscribable: true,
				emailEnabled: true
			},
			{
				moduleCode: 'SETTLEMENT',
				name: 'Settlements',
				description: 'Settlement updates',
				subscribable: true,
				emailEnabled: true
			}
		]);
		fetchNotificationSubscriptions.mockResolvedValue([]);
		updateNotificationSubscriptions.mockResolvedValue(
			'Notification Subscriptions Updated Successfully'
		);
		fetchNotifications.mockResolvedValue({
			items: [makeNotification()],
			pagination: { limit: 25, page: 1, total: 1 }
		});
	});

	it('loads notifications on mount', async () => {
		const screen = render(NotificationsInbox);

		await expect.element(screen.getByText('Multi-factor authentication disabled')).toBeVisible();
		expect(fetchNotifications).toHaveBeenCalledWith(1, 25, {});
	});

	it('requests unread notifications when the Unread tab is selected', async () => {
		pageState.url = new URL('http://localhost/management/notifications?status=unread');

		render(NotificationsInbox);

		await vi.waitFor(() => {
			expect(fetchNotifications).toHaveBeenCalledWith(1, 25, { read: false });
		});
	});

	it('filters notifications client-side when searching', async () => {
		pageState.url = new URL('http://localhost/management/notifications?search=multi-factor');
		fetchNotifications.mockResolvedValue({
			items: [
				makeNotification({ notificationId: 1 }),
				makeNotification({
					notificationId: 2,
					title: 'Payment received',
					body: 'A payment was received.',
					eventCode: 'PAYMENT_RECEIVED'
				})
			],
			pagination: { limit: 25, page: 1, total: 2 }
		});

		const screen = render(NotificationsInbox);

		await expect.element(screen.getByText('Multi-factor authentication disabled')).toBeVisible();
		expect(screen.container.textContent).not.toContain('Payment received');
	});

	it('marks a notification as done from the row action', async () => {
		const screen = render(NotificationsInbox);
		await expect.element(screen.getByText('Multi-factor authentication disabled')).toBeVisible();

		await screen.getByRole('button', { name: 'Mark as done' }).click();

		await expect.element(screen.getByText("You're all caught up.")).toBeVisible();
		expect(markNotificationDone).toHaveBeenCalledWith(1);
	});

	it('marks selected notifications as read in bulk', async () => {
		fetchNotifications.mockResolvedValue({
			items: [
				makeNotification({ notificationId: 1, read: false }),
				makeNotification({
					notificationId: 2,
					title: 'Payment received',
					body: 'A payment was received.',
					read: false
				})
			],
			pagination: { limit: 25, page: 1, total: 2 }
		});

		const screen = render(NotificationsInbox);
		await expect.element(screen.getByText('Multi-factor authentication disabled')).toBeVisible();

		await screen.getByRole('checkbox', { name: 'Select all notifications' }).click();
		await screen.getByRole('button', { name: 'Mark selected as read' }).click();

		expect(markNotificationRead).toHaveBeenCalledWith(1);
		expect(markNotificationRead).toHaveBeenCalledWith(2);
	});

	it('marks selected notifications as done in bulk', async () => {
		fetchNotifications.mockResolvedValue({
			items: [
				makeNotification({ notificationId: 1 }),
				makeNotification({
					notificationId: 2,
					title: 'Payment received',
					body: 'A payment was received.'
				})
			],
			pagination: { limit: 25, page: 1, total: 2 }
		});

		const screen = render(NotificationsInbox);
		await expect.element(screen.getByText('Multi-factor authentication disabled')).toBeVisible();

		await screen.getByRole('checkbox', { name: 'Select all notifications' }).click();
		await screen.getByRole('button', { name: 'Mark selected as done' }).click();

		expect(markNotificationDone).toHaveBeenCalledWith(1);
		expect(markNotificationDone).toHaveBeenCalledWith(2);
	});

	it('shows subscribe action for unsubscribed modules', async () => {
		const screen = render(NotificationsInbox);
		await expect.element(screen.getByText('Multi-factor authentication disabled')).toBeVisible();

		await expect.element(screen.getByRole('button', { name: 'Subscribe' })).toBeVisible();
	});

	it('subscribes to a notification module from the row action', async () => {
		const screen = render(NotificationsInbox);
		await expect.element(screen.getByText('Multi-factor authentication disabled')).toBeVisible();

		await screen.getByRole('button', { name: 'Subscribe' }).click();

		expect(updateNotificationSubscriptions).toHaveBeenCalledWith([
			{ channel: 'IN_APP', moduleCode: 'SECURITY', subscribed: true }
		]);
	});
});
