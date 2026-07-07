import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import KycPanResult from './kyc-pan-result.svelte';
import { mockPanResult } from './mock';

describe('KycPanResult', () => {
	it('renders verified PAN fields and ref ID', async () => {
		const result = mockPanResult('ABCDE1234F');
		const screen = render(KycPanResult, { result, refId: 'KYC-2026-654321' });

		await expect.element(screen.getByText('KYC-2026-654321')).toBeVisible();
		await expect.element(screen.getByText(result.pan_number)).toBeVisible();
		await expect.element(screen.getByText(result.pan_details.father_name)).toBeVisible();
		await expect.element(screen.getByText("Father's name")).toBeVisible();
	});
});
