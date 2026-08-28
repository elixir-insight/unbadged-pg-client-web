import { describe, expect, it } from 'vitest';
import type { NotificationItem, NotificationModule } from '$lib/api/notifications';
import { resolveNotificationModule } from './notification-module';

const modules: NotificationModule[] = [
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
	},
	{
		moduleCode: 'REPORTS',
		name: 'Reports',
		description: 'Report updates',
		subscribable: false,
		emailEnabled: false
	}
];

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

describe('resolveNotificationModule', () => {
	it('matches SECURITY for MFA-related notifications', () => {
		const module = resolveNotificationModule(makeNotification(), modules);
		expect(module?.moduleCode).toBe('SECURITY');
	});

	it('matches module code from metadata first', () => {
		const module = resolveNotificationModule(
			makeNotification({ metadata: { moduleCode: 'SETTLEMENT' }, eventCode: 'UNKNOWN' }),
			modules
		);
		expect(module?.moduleCode).toBe('SETTLEMENT');
	});

	it('returns undefined when no subscribable module matches', () => {
		const module = resolveNotificationModule(
			makeNotification({ title: 'Hello', body: 'World', eventCode: 'UNKNOWN_EVENT' }),
			modules
		);
		expect(module).toBeUndefined();
	});
});
