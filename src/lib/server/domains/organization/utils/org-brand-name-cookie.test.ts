import { describe, expect, it } from 'vitest';
import type { Cookies } from '@sveltejs/kit';
import { readRememberedOrgBrandName, rememberOrgBrandName } from './org-brand-name-cookie';

function createCookies(initial: Record<string, string> = {}) {
	const store = { ...initial };
	return {
		get(name: string) {
			return store[name];
		},
		set(name: string, value: string) {
			store[name] = value;
		},
		store
	};
}

describe('org brand name cookie', () => {
	it('remembers and reads a brand name for an org', () => {
		const cookies = createCookies();
		rememberOrgBrandName(cookies as unknown as Cookies, 'ORG_2bm', 'NexaPay');
		expect(readRememberedOrgBrandName(cookies as unknown as Cookies, 'ORG_2bm')).toBe('NexaPay');
	});

	it('returns empty string when nothing is stored', () => {
		const cookies = createCookies();
		expect(readRememberedOrgBrandName(cookies as unknown as Cookies, 'ORG_2bm')).toBe('');
	});
});
