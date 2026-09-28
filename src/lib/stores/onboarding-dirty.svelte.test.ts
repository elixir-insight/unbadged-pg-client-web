import { flushSync } from 'svelte';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { toBankSaveSnapshot, toKybPayload } from '$lib/api/onboarding';
import type { BankDetails, OnboardingPrefill } from '$lib/types/onboarding';
import type { onboarding as OnboardingStore } from './onboarding.svelte';

// The store restores from sessionStorage when its module loads, and every client test file
// shares one browser — so clear it and import a fresh store, or another file's state leaks in.
let onboarding: typeof OnboardingStore;
beforeAll(async () => {
	sessionStorage.clear();
	vi.resetModules();
	({ onboarding } = await import('./onboarding.svelte'));
});

// Mirrors the layout: hydrate from what the server returned, record that as the saved baseline,
// then check Continue's decision — an untouched resumed form must not re-save; any edit must.

const prefill: OnboardingPrefill = {
	businessPan: '**********',
	gstin: '27ABCPE1234F1ZB',
	businessDetails: {
		cin: 'U12345MH2018PTC123455',
		tan: 'ABCD12345A',
		brandName: '',
		phone: '9176251739',
		website: 'https://acme.test',
		industry: 'Fintech',
		registeredYear: 2020,
		communicationAddress: 'no 234 main street',
		address: {
			line1: 'besant nagar',
			line2: '',
			city: 'chennai',
			state: 'tamil nadu',
			pincode: '600090',
			country: 'India'
		}
	},
	directors: [
		{
			id: 7,
			name: 'Ada',
			pan: '**********',
			aadhaar: '************',
			email: 'ada@x.test',
			phone: '9876543210'
		}
	]
};

const bank: BankDetails = {
	accountId: 3,
	accountHolderName: 'Acme',
	accountNumber: '123456789012',
	confirmAccountNumber: '123456789012',
	ifscCode: 'HDFC0000123',
	bankName: 'HDFC',
	branchName: 'Fort',
	accountType: 'CURRENT'
};

function hydrateLikeLayout() {
	const cleanup = $effect.root(() => {
		$effect(() => {
			onboarding.hydrateFromOrganization(prefill);
			onboarding.seedClean('organization', toKybPayload(prefill));
			onboarding.hydrateBankAccounts([bank]);
			onboarding.seedClean('bankAccounts', toBankSaveSnapshot([bank]));
		});
	});
	flushSync();
	cleanup();
}

describe('dirty tracking after resume', () => {
	it('treats an untouched resumed form as clean — Continue skips both saves', () => {
		hydrateLikeLayout();
		expect(onboarding.isDirty('organization', toKybPayload(onboarding.formData))).toBe(false);
		expect(
			onboarding.isDirty('bankAccounts', toBankSaveSnapshot(onboarding.formData.bankAccounts))
		).toBe(false);
	});

	it('flags an edit on any step the organization save carries', () => {
		onboarding.updateBusinessAddress({ city: 'madurai' });
		expect(onboarding.isDirty('organization', toKybPayload(onboarding.formData))).toBe(true);
		onboarding.markClean('organization', toKybPayload(onboarding.formData));
		expect(onboarding.isDirty('organization', toKybPayload(onboarding.formData))).toBe(false);

		// A tax & registration edit must still dirty the save the address step sends.
		onboarding.updateBusinessDetails({ industry: 'Retail' });
		expect(onboarding.isDirty('organization', toKybPayload(onboarding.formData))).toBe(true);
	});

	it('flags a bank edit', () => {
		onboarding.updateBankAccount(0, { branchName: 'Andheri' });
		expect(
			onboarding.isDirty('bankAccounts', toBankSaveSnapshot(onboarding.formData.bankAccounts))
		).toBe(true);
	});

	it('counts a save with no baseline yet as dirty', () => {
		expect(onboarding.isDirty('organization', undefined)).toBe(true);
	});
});

describe('change and revert', () => {
	it('is clean again once an edited value is typed back to the saved one', () => {
		onboarding.markClean('organization', toKybPayload(onboarding.formData));
		const original = onboarding.formData.businessDetails.industry;
		onboarding.updateBusinessDetails({ industry: 'XYZ' });
		expect(onboarding.isDirty('organization', toKybPayload(onboarding.formData))).toBe(true);
		onboarding.updateBusinessDetails({ industry: original });
		expect(onboarding.isDirty('organization', toKybPayload(onboarding.formData))).toBe(false);
	});

	it('does the same for a director field', () => {
		const original = onboarding.formData.directors[0].name;
		onboarding.updateDirector(0, { name: 'Grace' });
		expect(onboarding.isDirty('organization', toKybPayload(onboarding.formData))).toBe(true);
		onboarding.updateDirector(0, { name: original });
		expect(onboarding.isDirty('organization', toKybPayload(onboarding.formData))).toBe(false);
	});
});

// GET masks PAN/Aadhaar, but this tab's sessionStorage still holds the unmasked values it
// saved — a reload must not read those as changes and re-save on every Continue.
describe('dirty tracking after a reload in the same tab', () => {
	// A fresh module instance per call — what a page reload does. (vi.resetModules alone doesn't
	// re-evaluate an already-imported module in browser mode.)
	let reloads = 0;
	async function reloadStore(): Promise<typeof OnboardingStore> {
		reloads += 1;
		const url = `./onboarding.svelte.ts?reload=${reloads}`;
		return (await import(/* @vite-ignore */ url)).onboarding;
	}

	function seedFromServer(store: typeof OnboardingStore) {
		const cleanup = $effect.root(() => {
			$effect(() => {
				store.hydrateFromOrganization(prefill);
				store.seedClean('organization', toKybPayload(prefill));
			});
		});
		flushSync();
		cleanup();
	}

	/** The form as this tab typed and saved it: same data as `prefill`, but unmasked. */
	function saveUnmasked(store: typeof OnboardingStore) {
		store.setBusinessPan('ABCDE1234F');
		store.setDirectors([{ ...prefill.directors[0], pan: 'ABCDE1234G', aadhaar: '234567890123' }]);
		store.markClean('organization', toKybPayload(store.formData));
	}

	it('keeps an unchanged form clean although the server copy is masked', async () => {
		sessionStorage.clear();
		const first = await reloadStore();
		seedFromServer(first);
		saveUnmasked(first);

		const reloaded = await reloadStore();
		seedFromServer(reloaded);
		expect(reloaded.formData.businessPan).toBe('ABCDE1234F');
		expect(reloaded.isDirty('organization', toKybPayload(reloaded.formData))).toBe(false);
	});

	it('still flags an unmasked value edited after that save', async () => {
		const store = await reloadStore();
		store.setBusinessPan('ABCDE9999F');
		const reloaded = await reloadStore();
		seedFromServer(reloaded);
		expect(reloaded.isDirty('organization', toKybPayload(reloaded.formData))).toBe(true);
	});

	it('falls back to the server copy when it changed elsewhere since this tab saved', async () => {
		sessionStorage.clear();
		const first = await reloadStore();
		seedFromServer(first);
		saveUnmasked(first);

		const reloaded = await reloadStore();
		const changed = { ...prefill, gstin: '29ABCPE1234F1ZB' };
		const cleanup = $effect.root(() => {
			$effect(() => {
				reloaded.hydrateFromOrganization(changed);
				reloaded.seedClean('organization', toKybPayload(changed));
			});
		});
		flushSync();
		cleanup();
		// Local form still holds this tab's GSTIN — it differs from the server, so it would save.
		expect(reloaded.isDirty('organization', toKybPayload(reloaded.formData))).toBe(true);
	});
});
