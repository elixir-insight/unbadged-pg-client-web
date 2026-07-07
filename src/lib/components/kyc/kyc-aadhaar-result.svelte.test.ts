import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import KycAadhaarResult from './kyc-aadhaar-result.svelte';
import { mockAadhaarResult } from './mock';

describe('KycAadhaarResult', () => {
	it('renders verified Aadhaar fields and ref ID', async () => {
		const result = mockAadhaarResult('123456789012');
		const screen = render(KycAadhaarResult, { result, refId: 'KYC-2026-123456' });

		await expect.element(screen.getByText('KYC-2026-123456')).toBeVisible();
		await expect.element(screen.getByText(result.full_name)).toBeVisible();
		await expect.element(screen.getByText(result.aadhaar_number)).toBeVisible();
		await expect.element(screen.getByText('Mobile linked')).toBeVisible();
	});
});
