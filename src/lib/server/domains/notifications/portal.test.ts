import { describe, expect, it } from 'vitest';
import { notificationsBasePath, parseNotificationsPortal } from './portal';

describe('notificationsBasePath', () => {
	it('builds the upstream base path for each portal', () => {
		expect(notificationsBasePath('management')).toBe('/api/v1/management');
		expect(notificationsBasePath('merchant')).toBe('/api/v1/merchant');
	});
});

describe('parseNotificationsPortal', () => {
	it('accepts known portal values', () => {
		expect(parseNotificationsPortal('management')).toBe('management');
		expect(parseNotificationsPortal('merchant')).toBe('merchant');
	});

	it('rejects unknown or missing values', () => {
		expect(parseNotificationsPortal('partner')).toBeNull();
		expect(parseNotificationsPortal(null)).toBeNull();
		expect(parseNotificationsPortal('')).toBeNull();
	});
});
