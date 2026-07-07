import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import KycVerificationHistory from './kyc-verification-history.svelte';
import type { VerificationHistoryEntry } from './types';

const sampleHistory: VerificationHistoryEntry[] = [
	{
		id: 'entry-1',
		timestamp: new Date('2026-07-07T10:30:00'),
		method: 'Aadhaar',
		identifier: 'XXXX XXXX 9012',
		initiatedBy: 'Arjun Mehta',
		status: 'Verified'
	},
	{
		id: 'entry-2',
		timestamp: new Date('2026-07-07T11:00:00'),
		method: 'PAN',
		identifier: 'ABCDE1234F',
		initiatedBy: 'Arjun Mehta',
		status: 'Failed'
	}
];

describe('KycVerificationHistory', () => {
	it('renders table headers', async () => {
		const screen = render(KycVerificationHistory, { history: sampleHistory });

		await expect.element(screen.getByText('Verification history')).toBeVisible();
		await expect.element(screen.getByText('Timestamp')).toBeVisible();
		await expect.element(screen.getByText('Method')).toBeVisible();
		await expect.element(screen.getByText('Identifier')).toBeVisible();
		await expect.element(screen.getByText('Initiated by')).toBeVisible();
		await expect.element(screen.getByText('Status')).toBeVisible();
	});

	it('renders each history entry', async () => {
		const screen = render(KycVerificationHistory, { history: sampleHistory });

		await expect.element(screen.getByText('Aadhaar')).toBeVisible();
		await expect.element(screen.getByText('XXXX XXXX 9012')).toBeVisible();
		await expect.element(screen.getByText('PAN')).toBeVisible();
		await expect.element(screen.getByText('ABCDE1234F')).toBeVisible();
	});
});
