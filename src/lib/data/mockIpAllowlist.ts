import type { WhitelistedIp } from '$lib/api/ip-allowlist';

/** Seeded mock allowlist entries used when the backend API is unavailable. */
export const MOCK_IP_ALLOWLIST: WhitelistedIp[] = [
	{
		id: 1001,
		ipAddress: '203.0.113.10',
		createdAt: '2026-01-15T09:30:00.000Z'
	},
	{
		id: 1002,
		ipAddress: '203.0.113.25',
		createdAt: '2026-02-03T14:15:00.000Z'
	},
	{
		id: 1003,
		ipAddress: '203.0.113.42',
		createdAt: '2026-03-20T11:00:00.000Z'
	}
];

/**
 * Resolves fallback IP allowlist data when the backend is unavailable.
 * Tier 2: seeded mock entries (copy).
 * Tier 3: empty shell when the seed list is empty.
 */
export function resolveIpAllowlistFallback(): WhitelistedIp[] {
	if (MOCK_IP_ALLOWLIST.length === 0) {
		return [];
	}
	return MOCK_IP_ALLOWLIST.map((entry) => ({ ...entry }));
}
