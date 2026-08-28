import { describe, expect, it } from 'vitest';
import { isValidExpiryTime, toExpiryUtcIso } from './payment-link-expiry';

describe('isValidExpiryTime', () => {
	it('accepts 24-hour HH:mm values', () => {
		expect(isValidExpiryTime('00:00')).toBe(true);
		expect(isValidExpiryTime('23:59')).toBe(true);
		expect(isValidExpiryTime('9:00')).toBe(false);
		expect(isValidExpiryTime('24:00')).toBe(false);
	});
});

describe('toExpiryUtcIso', () => {
	it('converts local date and time to a UTC ISO string', () => {
		const iso = toExpiryUtcIso('2030-01-15', '14:30');
		expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

		const date = new Date(iso);
		expect(date.getFullYear()).toBe(2030);
		expect(date.getMonth()).toBe(0);
		expect(date.getDate()).toBe(15);
		expect(date.getHours()).toBe(14);
		expect(date.getMinutes()).toBe(30);
		expect(iso.endsWith('Z')).toBe(true);
	});
});
