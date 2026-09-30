import { flushSync } from 'svelte';
import { beforeAll, describe, expect, it, vi } from 'vitest';
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

// The layout and step pages call these hydrate* methods from inside $effects. Each one reads the
// state it writes, so any tracked read makes the effect re-run forever — Svelte then throws
// effect_update_depth_exceeded, which halts rendering (blank step, dead sidebar links).

const blankBank: BankDetails = {
	accountHolderName: '',
	accountNumber: '',
	confirmAccountNumber: '',
	ifscCode: '',
	bankName: '',
	branchName: '',
	accountType: ''
};

const prefill: OnboardingPrefill = {
	businessPan: '**********',
	gstin: '27ABCDE1234F1Z8',
	businessDetails: {
		cin: '',
		tan: '',
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
	directors: []
};

function runInEffect(fn: () => void) {
	const cleanup = $effect.root(() => {
		$effect(fn);
	});
	flushSync();
	cleanup();
}

describe('hydrate* inside effects', () => {
	it('ignores saved bank accounts that map to no data, without looping', () => {
		expect(() =>
			runInEffect(() => onboarding.hydrateBankAccounts([{ ...blankBank }]))
		).not.toThrow();
		expect(onboarding.formData.bankAccounts).toEqual([blankBank]);
	});

	it('fills bank accounts once', () => {
		const saved = {
			...blankBank,
			accountHolderName: 'Acme',
			accountNumber: '123456789012',
			accountId: 3
		};
		expect(() => runInEffect(() => onboarding.hydrateBankAccounts([saved]))).not.toThrow();
		expect(onboarding.formData.bankAccounts).toEqual([saved]);
	});

	it('fills the saved organization details without looping', () => {
		expect(() => runInEffect(() => onboarding.hydrateFromOrganization(prefill))).not.toThrow();
		expect(onboarding.formData.gstin).toBe('27ABCDE1234F1Z8');
		expect(onboarding.formData.businessDetails.address.city).toBe('chennai');
	});

	it('sets the entity type and uploaded documents without looping', () => {
		expect(() =>
			runInEffect(() => {
				onboarding.hydrateEntityType('proprietorship');
				onboarding.hydrateDocumentUploaded('gstCertificate');
			})
		).not.toThrow();
		expect(onboarding.formData.entityType).toBe('proprietorship');
		expect(onboarding.formData.documents.gstCertificate.uploaded).toBe(true);
	});

	it('adopts saved director ids for local directors that have none', () => {
		const local = { name: 'Ada', pan: '**********', aadhaar: '', email: 'ADA@x.test', phone: '' };
		onboarding.setDirectors([local, { ...local, name: 'Bo', email: '' }]);
		runInEffect(() =>
			onboarding.hydrateFromOrganization({
				...prefill,
				directors: [
					{ ...local, email: 'ada@x.test', id: 7 },
					{ ...local, name: 'Bo', email: 'other@x.test', id: 8 }
				]
			})
		);
		expect(onboarding.formData.directors.map((d) => d.id)).toEqual([7, 8]);
	});

	it('replaces a stale director id with the saved one and clears its document flags', () => {
		const base = { pan: '**********', aadhaar: '', phone: '' };
		onboarding.setDirectors([
			{
				...base,
				name: 'Ada',
				email: 'ada@x.test',
				id: 999,
				aadhaarDocument: 'a.pdf',
				panDocument: 'p.pdf'
			},
			{ ...base, name: 'Bo', email: 'bo@x.test', id: 8 }
		]);
		runInEffect(() =>
			onboarding.syncDirectorIds([
				{ ...base, name: 'Ada', email: 'ada@x.test', id: 21 },
				{ ...base, name: 'Bo', email: 'bo@x.test', id: 8 }
			])
		);
		const [ada, bo] = onboarding.formData.directors;
		expect(ada).toMatchObject({ id: 21, aadhaarDocument: '', panDocument: '' });
		expect(bo.id).toBe(8);
	});
});
