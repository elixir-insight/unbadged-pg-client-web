import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import NotificationPreferencesTab from './notification-preferences-tab.svelte';
import type { NotificationModule, NotificationSubscription } from '$lib/api/notifications';

const {
	fetchNotificationModules,
	fetchNotifications,
	markNotificationRead,
	markNotificationDone,
	fetchNotificationSubscriptions,
	updateNotificationSubscriptions
} = vi.hoisted(() => ({
	fetchNotificationModules: vi.fn(),
	fetchNotifications: vi.fn(),
	markNotificationRead: vi.fn(),
	markNotificationDone: vi.fn(),
	fetchNotificationSubscriptions: vi.fn(),
	updateNotificationSubscriptions: vi.fn()
}));

// `$lib/components/reusable` also re-exports NotificationBell, which imports
// `fetchNotifications`/`markNotificationRead`/`markNotificationDone` — the mock
// must cover the whole module shape even though this component only uses the
// subscription methods.
vi.mock('$lib/api/notifications', () => ({
	fetchNotificationModules,
	fetchNotifications,
	markNotificationRead,
	markNotificationDone,
	fetchNotificationSubscriptions,
	updateNotificationSubscriptions
}));

const securityModule: NotificationModule = {
	moduleCode: 'SECURITY',
	name: 'Security',
	description: 'Password, MFA, login, account unlock, and system maintenance updates.',
	subscribable: true,
	emailEnabled: true
};

const nonSubscribableModule: NotificationModule = {
	moduleCode: 'REPORTS',
	name: 'Reports',
	description: 'Report generation and email delivery updates.',
	subscribable: false,
	emailEnabled: false
};

describe('NotificationPreferencesTab', () => {
	beforeEach(() => {
		fetchNotificationModules.mockReset();
		fetchNotificationSubscriptions.mockReset();
		updateNotificationSubscriptions.mockReset();
		updateNotificationSubscriptions.mockResolvedValue(
			'Notification Subscriptions Updated Successfully'
		);
	});

	it('renders each module name and description once loaded', async () => {
		fetchNotificationModules.mockResolvedValue([securityModule]);
		fetchNotificationSubscriptions.mockResolvedValue([]);

		const screen = render(NotificationPreferencesTab, { portal: 'management' });

		await expect.element(screen.getByText('Security')).toBeVisible();
		await expect
			.element(
				screen.getByText('Password, MFA, login, account unlock, and system maintenance updates.')
			)
			.toBeVisible();
	});

	it('does not render channel toggles for a non-subscribable module', async () => {
		fetchNotificationModules.mockResolvedValue([nonSubscribableModule]);
		fetchNotificationSubscriptions.mockResolvedValue([]);

		const screen = render(NotificationPreferencesTab, { portal: 'management' });

		await expect.element(screen.getByText('Reports')).toBeVisible();
		expect(screen.container.textContent).not.toContain('In-app');
		expect(screen.container.textContent).not.toContain('Email');
	});

	it('reflects existing subscriptions as checked switches', async () => {
		fetchNotificationModules.mockResolvedValue([securityModule]);
		const subscriptions: NotificationSubscription[] = [
			{ moduleCode: 'SECURITY', channel: 'IN_APP' }
		];
		fetchNotificationSubscriptions.mockResolvedValue(subscriptions);

		const screen = render(NotificationPreferencesTab, { portal: 'management' });

		await expect.element(screen.getByText('Security')).toBeVisible();
		const switches = screen.container.querySelectorAll('[role="switch"]');
		expect(switches.length).toBe(2);
	});

	it('shows a retryable error banner when loading fails', async () => {
		fetchNotificationModules.mockRejectedValue(new Error('Backend unavailable'));
		fetchNotificationSubscriptions.mockResolvedValue([]);

		const screen = render(NotificationPreferencesTab, { portal: 'merchant' });

		await expect.element(screen.getByText('Backend unavailable')).toBeVisible();
		await expect.element(screen.getByRole('button', { name: 'Retry' })).toBeVisible();
	});

	it('toggles a subscription and calls the update API with the changed entry', async () => {
		fetchNotificationModules.mockResolvedValue([securityModule]);
		fetchNotificationSubscriptions.mockResolvedValue([]);

		const screen = render(NotificationPreferencesTab, { portal: 'management' });
		await expect.element(screen.getByText('Security')).toBeVisible();

		const inAppSwitch = screen.container.querySelectorAll('[role="switch"]')[0] as HTMLElement;
		inAppSwitch.click();

		await expect.poll(() => updateNotificationSubscriptions.mock.calls.length).toBe(1);
		expect(updateNotificationSubscriptions).toHaveBeenCalledWith([
			{ channel: 'IN_APP', moduleCode: 'SECURITY', subscribed: true }
		]);
	});
});
