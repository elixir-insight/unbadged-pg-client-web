import { flushSync } from 'svelte';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
	toBankSaveSnapshot,
	toKybPayload,
	toSectionSnapshot,
	type KybSource,
	type OrganizationSection
} from '$lib/api/onboarding';
import type { BankDetails, OnboardingPrefill } from '$lib/types/onboarding';
import type { onboarding as OnboardingStore } from './onboarding.svelte';

// Every client test file shares one browser and module graph — import a fresh store so another
// file's in-memory state doesn't leak in.
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
		communicationAddress: {
			line1: 'no 234 main street',
			line2: '',
			city: '',
			state: '',
			pincode: ''
		},
		sameAsCommunication: false,
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

const SECTIONS = ['identity', 'address', 'directors'] as const;

/** What Continue on one step compares: that step's part of the organization save. */
function snap(section: OrganizationSection, source: KybSource) {
	return toSectionSnapshot(section, toKybPayload(source));
}

function seedSections(store: typeof OnboardingStore, source: KybSource) {
	for (const section of SECTIONS) store.seedClean(section, snap(section, source));
}

function hydrateLikeLayout() {
	const cleanup = $effect.root(() => {
		$effect(() => {
			onboarding.hydrateFromOrganization(prefill);
			seedSections(onboarding, prefill);
			onboarding.hydrateBankAccounts([bank]);
			onboarding.seedClean('bankAccounts', toBankSaveSnapshot([bank]));
		});
	});
	flushSync();
	cleanup();
}

describe('dirty tracking after resume', () => {
	it('treats an untouched resumed form as clean — Continue skips every save', () => {
		hydrateLikeLayout();
		for (const section of SECTIONS) {
			expect(onboarding.isDirty(section, snap(section, onboarding.formData))).toBe(false);
		}
		expect(
			onboarding.isDirty('bankAccounts', toBankSaveSnapshot(onboarding.formData.bankAccounts))
		).toBe(false);
	});

	it('flags an edit only on the step that owns the field', () => {
		onboarding.updateBusinessAddress({ city: 'madurai' });
		onboarding.setSameAsCommunication(false);
		expect(onboarding.isDirty('address', snap('address', onboarding.formData))).toBe(true);
		expect(onboarding.isDirty('identity', snap('identity', onboarding.formData))).toBe(false);
		onboarding.markClean('address', snap('address', onboarding.formData));
		expect(onboarding.isDirty('address', snap('address', onboarding.formData))).toBe(false);

		// A tax & registration edit is the identity step's save, not the address step's.
		onboarding.updateBusinessDetails({ industry: 'Retail' });
		expect(onboarding.isDirty('identity', snap('identity', onboarding.formData))).toBe(true);
		expect(onboarding.isDirty('address', snap('address', onboarding.formData))).toBe(false);
	});

	it('flags a bank edit', () => {
		onboarding.updateBankAccount(0, { branchName: 'Andheri' });
		expect(
			onboarding.isDirty('bankAccounts', toBankSaveSnapshot(onboarding.formData.bankAccounts))
		).toBe(true);
	});

	it('counts a save with no baseline yet as dirty', () => {
		expect(onboarding.isDirty('directors', undefined)).toBe(true);
	});
});

describe('change and revert', () => {
	it('is clean again once an edited value is typed back to the saved one', () => {
		onboarding.markClean('identity', snap('identity', onboarding.formData));
		const original = onboarding.formData.businessDetails.industry;
		onboarding.updateBusinessDetails({ industry: 'XYZ' });
		expect(onboarding.isDirty('identity', snap('identity', onboarding.formData))).toBe(true);
		onboarding.updateBusinessDetails({ industry: original });
		expect(onboarding.isDirty('identity', snap('identity', onboarding.formData))).toBe(false);
	});

	it('does the same for a director field', () => {
		const original = onboarding.formData.directors[0].name;
		onboarding.updateDirector(0, { name: 'Grace' });
		expect(onboarding.isDirty('directors', snap('directors', onboarding.formData))).toBe(true);
		onboarding.updateDirector(0, { name: original });
		expect(onboarding.isDirty('directors', snap('directors', onboarding.formData))).toBe(false);
	});
});

// Nothing survives a reload or a new visit: the wizard starts empty and is filled from the API
// alone, so a previous session (or a previous user on this tab) can never leak into the form.
describe('a reload or new visit starts from the API only', () => {
	// A fresh module instance per call — what a page reload does. (vi.resetModules alone doesn't
	// re-evaluate an already-imported module in browser mode.)
	let reloads = 0;
	async function reloadStore(): Promise<typeof OnboardingStore> {
		reloads += 1;
		const url = `./onboarding.svelte.ts?reload=${reloads}`;
		return (await import(/* @vite-ignore */ url)).onboarding;
	}

	function seedFromServer(store: typeof OnboardingStore, source: OnboardingPrefill = prefill) {
		const cleanup = $effect.root(() => {
			$effect(() => {
				store.hydrateFromOrganization(source);
				seedSections(store, source);
			});
		});
		flushSync();
		cleanup();
	}

	it('does not bring back values typed before a reload', async () => {
		const first = await reloadStore();
		first.setBusinessPan('ABCDE1234F');
		first.selectGstin('29ABCPE1234F1ZB');

		const reloaded = await reloadStore();
		expect(reloaded.formData.businessPan).toBe('');
		expect(reloaded.formData.gstin).toBe('');
	});

	it('shows exactly what the API returned after a reload, and treats it as saved', async () => {
		const first = await reloadStore();
		first.selectGstin('29ABCPE1234F1ZB');

		const reloaded = await reloadStore();
		seedFromServer(reloaded);
		expect(reloaded.formData.gstin).toBe(prefill.gstin);
		expect(reloaded.formData.businessPan).toBe(prefill.businessPan);
		expect(reloaded.isDirty('identity', snap('identity', reloaded.formData))).toBe(false);
	});

	it('clears legacy sessionStorage state left by older builds', async () => {
		sessionStorage.setItem(
			'pg-self-onboarding-v4',
			JSON.stringify({ formData: { businessPan: 'OLDPN1234X' } })
		);
		const reloaded = await reloadStore();
		expect(sessionStorage.getItem('pg-self-onboarding-v4')).toBeNull();
		expect(reloaded.formData.businessPan).toBe('');
	});

	it('reset() empties a store already in memory (layout mount / next sign-in)', async () => {
		const store = await reloadStore();
		seedFromServer(store);
		store.setBusinessPan('ABCDE1234F');

		store.reset();
		expect(store.formData.businessPan).toBe('');
		expect(store.formData.gstin).toBe('');
		expect(store.formData.directors).toEqual([]);
	});
});
