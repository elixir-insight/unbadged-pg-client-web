import { untrack } from 'svelte';
import {
	resolveOnboardingStatus,
	STEPS,
	type OnboardingStatus,
	type StepId
} from '$lib/components/self-onboarding/steps';
import {
	ENTITY_TYPE_COMPANY_TYPES,
	ENTITY_TYPE_LABELS,
	parseEntityType,
	DOCUMENT_KEYS,
	isDocumentRequired,
	type Address,
	type BankDetails,
	type BusinessDetails,
	type Director,
	type DocumentKey,
	type Documents,
	type DocumentSlot,
	type EntityType,
	type GstinItem,
	type OnboardingFormData,
	type OnboardingMode
} from '$lib/types/onboarding';

const STORAGE_KEY = 'pg-self-onboarding-v4';

function emptyAddress(): Address {
	return { line1: '', line2: '', city: '', state: '', pincode: '' };
}

function emptyBankAccount(): BankDetails {
	return {
		accountHolderName: '',
		accountNumber: '',
		confirmAccountNumber: '',
		ifscCode: '',
		bankName: '',
		branchName: '',
		accountType: ''
	};
}

function isEmptyBankAccount(bank: BankDetails): boolean {
	return (
		bank.accountId === undefined &&
		bank.accountHolderName === '' &&
		bank.accountNumber === '' &&
		bank.ifscCode === '' &&
		bank.bankName === '' &&
		bank.branchName === '' &&
		bank.accountType === ''
	);
}

function emptyDocument(required: boolean): DocumentSlot {
	return { uploaded: false, required, file: null, fileName: '' };
}

/** Builds a value for every document slot — keeps the slot list in one place (DOCUMENT_KEYS). */
function mapDocumentKeys<T>(build: (key: DocumentKey) => T): Record<DocumentKey, T> {
	return Object.fromEntries(DOCUMENT_KEYS.map((key) => [key, build(key)])) as Record<
		DocumentKey,
		T
	>;
}

function emptyDocuments(entityType: EntityType | null): Documents {
	return mapDocumentKeys((key) => emptyDocument(isDocumentRequired(key, entityType)));
}

function applyEntityDocumentRequirements(
	docs: Documents,
	entityType: EntityType | null
): Documents {
	return mapDocumentKeys((key) => ({
		...docs[key],
		required: isDocumentRequired(key, entityType)
	}));
}

function emptyForm(): OnboardingFormData {
	return {
		businessPan: '',
		entityType: null,
		entityName: '',
		gstin: '',
		gstinList: [],
		businessDetails: {
			companyType: '',
			cin: '',
			address: emptyAddress(),
			phone: '',
			website: '',
			brandName: '',
			tan: '',
			industry: '',
			registeredYear: null,
			communicationAddress: ''
		},
		bankAccounts: [emptyBankAccount()],
		directors: [],
		documents: emptyDocuments(null)
	};
}

type PersistedDocuments = Partial<Record<DocumentKey, Omit<DocumentSlot, 'file'>>>;

interface PersistedState {
	formData: Omit<OnboardingFormData, 'documents'> & { documents: PersistedDocuments };
	mode: OnboardingMode;
	completedSteps: number[];
	verifications?: Record<string, string>;
	focusField?: string;
}

function omitFile(slot: DocumentSlot): Omit<DocumentSlot, 'file'> {
	return {
		uploaded: slot.uploaded,
		required: slot.required,
		fileName: slot.fileName
	};
}

function stripFiles(data: OnboardingFormData): PersistedState['formData'] {
	const documents: PersistedDocuments = mapDocumentKeys((key) => omitFile(data.documents[key]));

	return { ...data, documents };
}

function restoreForm(persisted: PersistedState['formData']): OnboardingFormData {
	// Slots missing from older persisted state (the document set has changed over time) start empty.
	const restoreSlot = (slot: Omit<DocumentSlot, 'file'> | undefined): DocumentSlot => ({
		uploaded: slot?.uploaded ?? false,
		required: slot?.required ?? false,
		fileName: slot?.fileName ?? '',
		file: null
	});
	const entityType = parseEntityType(persisted.entityType);

	return {
		...persisted,
		entityType,
		businessDetails: {
			...emptyForm().businessDetails,
			...persisted.businessDetails,
			address: { ...emptyAddress(), ...persisted.businessDetails.address }
		},
		bankAccounts:
			persisted.bankAccounts && persisted.bankAccounts.length > 0
				? persisted.bankAccounts.map((bank) => ({ ...emptyBankAccount(), ...bank }))
				: [emptyBankAccount()],
		documents: applyEntityDocumentRequirements(
			mapDocumentKeys((key) => restoreSlot(persisted.documents?.[key])),
			entityType
		)
	};
}

function readPersisted(): PersistedState | null {
	if (typeof sessionStorage === 'undefined') return null;
	try {
		const raw = sessionStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		return JSON.parse(raw) as PersistedState;
	} catch {
		return null;
	}
}

const persisted = readPersisted();

const formData = $state<OnboardingFormData>(
	persisted ? restoreForm(persisted.formData) : emptyForm()
);
let mode = $state<OnboardingMode>(persisted?.mode ?? 'manual');
let completedSteps = $state<number[]>(persisted?.completedSteps ?? []);
let verifications = $state<Record<string, string>>(persisted?.verifications ?? {});
let focusField = $state(persisted?.focusField ?? '');
// A save/submit error routed to a different step (see saveErrorRouting.ts) — a one-shot handoff
// across navigation, so it is never persisted to sessionStorage.
let saveError = $state('');
// The org's real profileStatus, fetched once per layout mount (see +layout.server.ts) — never
// persisted, always refetched, so a status change server-side is never shown stale.
let profileStatus = $state('');

const progressPercent = $derived(Math.round((completedSteps.length / STEPS.length) * 100));

/**
 * Untracked so a store mutator called from inside an `$effect` (e.g. the layout's
 * setVerifications/hydrate* calls) never subscribes that effect to the whole store — otherwise
 * the write re-triggers the effect and it loops forever (effect_update_depth_exceeded).
 */
function persist() {
	if (typeof sessionStorage === 'undefined') return;
	untrack(() => {
		const payload: PersistedState = {
			formData: stripFiles(formData),
			mode,
			completedSteps,
			verifications,
			focusField
		};
		sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
	});
}

function patchAddress(target: Address, patch: Partial<Address>): Address {
	return { ...target, ...patch };
}

export const onboarding = {
	get formData() {
		return formData;
	},
	get mode() {
		return mode;
	},
	get completedSteps() {
		return completedSteps;
	},
	get verifications() {
		return verifications;
	},
	get focusField() {
		return focusField;
	},
	get saveError() {
		return saveError;
	},
	get progressPercent() {
		return progressPercent;
	},
	get profileStatus() {
		return profileStatus;
	},
	get onboardingStatus(): OnboardingStatus {
		return resolveOnboardingStatus(profileStatus);
	},

	persist,

	setProfileStatus(next: string) {
		profileStatus = next;
	},

	setVerifications(next: Record<string, string>) {
		verifications = next;
		persist();
	},

	setFocusField(field: string) {
		focusField = field;
		persist();
	},

	setSaveError(message: string) {
		saveError = message;
	},

	/** Reads and clears the pending error in one step, so it is shown at most once. */
	consumeSaveError(): string {
		const message = saveError;
		saveError = '';
		return message;
	},

	clearVerification(key: string) {
		if (!(key in verifications)) return;
		const next = { ...verifications };
		delete next[key];
		verifications = next;
		persist();
	},

	setBusinessPan(pan: string) {
		formData.businessPan = pan;
		persist();
	},

	setPan(pan: string, entityType: EntityType, entityName: string) {
		formData.businessPan = pan;
		formData.entityType = entityType;
		formData.entityName = entityName;
		formData.businessDetails.companyType = ENTITY_TYPE_COMPANY_TYPES[entityType];
		formData.documents = applyEntityDocumentRequirements(formData.documents, entityType);
		persist();
	},

	/**
	 * Fills in the entity type captured at signup — the wizard has no control for it any more, so
	 * this is the only way it ever gets set. Never overwrites a value the wizard already has
	 * (either hydrated earlier or, on old persisted sessions, set via the removed selector).
	 */
	hydrateEntityType(entityType: EntityType) {
		if (formData.entityType !== null) return;
		formData.entityType = entityType;
		formData.entityName = ENTITY_TYPE_LABELS[entityType];
		formData.businessDetails.companyType = ENTITY_TYPE_COMPANY_TYPES[entityType];
		formData.documents = applyEntityDocumentRequirements(formData.documents, entityType);
		persist();
	},

	switchToManual() {
		mode = 'manual';
		persist();
	},

	setGstinList(list: GstinItem[]) {
		formData.gstinList = list;
		persist();
	},

	selectGstin(gstin: string) {
		formData.gstin = gstin;
		persist();
	},

	updateBusinessDetails(patch: Partial<BusinessDetails>) {
		formData.businessDetails = {
			...formData.businessDetails,
			...patch,
			address: formData.businessDetails.address
		};
		persist();
	},

	updateBusinessAddress(patch: Partial<Address>) {
		formData.businessDetails.address = patchAddress(formData.businessDetails.address, patch);
		persist();
	},

	setDirectors(directors: Director[]) {
		formData.directors = directors;
		persist();
	},

	addDirector() {
		formData.directors = [
			...formData.directors,
			{ name: '', pan: '', aadhaar: '', email: '', phone: '' }
		];
		persist();
	},

	updateDirector(index: number, patch: Partial<Director>) {
		const current = formData.directors[index];
		if (!current) return;
		formData.directors = formData.directors.map((director, i) =>
			i === index ? { ...director, ...patch } : director
		);
		persist();
	},

	removeDirector(index: number) {
		formData.directors = formData.directors.filter((_, i) => i !== index);
		persist();
	},

	/** Stores upstream ids returned after a save; `undefined` entries keep the existing id. */
	setDirectorIds(ids: (number | undefined)[]) {
		formData.directors = formData.directors.map((director, i) => ({
			...director,
			id: ids[i] ?? director.id
		}));
		persist();
	},

	addBankAccount() {
		formData.bankAccounts = [...formData.bankAccounts, emptyBankAccount()];
		persist();
	},

	/**
	 * Fills in accounts fetched from GET .../bank-accounts (see bank-details/+page.server.ts) — the
	 * wizard has no other way to learn about accounts saved outside this browser session. Never
	 * overwrites accounts the user has already started filling in or that were already hydrated.
	 */
	hydrateBankAccounts(accounts: BankDetails[]) {
		if (accounts.length === 0) return;
		if (!formData.bankAccounts.every(isEmptyBankAccount)) return;
		formData.bankAccounts = accounts;
		persist();
	},

	updateBankAccount(index: number, patch: Partial<BankDetails>) {
		const current = formData.bankAccounts[index];
		if (!current) return;
		formData.bankAccounts = formData.bankAccounts.map((bank, i) =>
			i === index ? { ...bank, ...patch } : bank
		);
		persist();
	},

	removeBankAccount(index: number) {
		formData.bankAccounts = formData.bankAccounts.filter((_, i) => i !== index);
		persist();
	},

	/** Stores upstream account ids returned after a save; `undefined` entries keep the existing id. */
	setBankAccountIds(ids: (number | undefined)[]) {
		formData.bankAccounts = formData.bankAccounts.map((bank, i) => ({
			...bank,
			accountId: ids[i] ?? bank.accountId
		}));
		persist();
	},

	updateDocument(key: DocumentKey, file: File) {
		formData.documents[key] = {
			...formData.documents[key],
			uploaded: true,
			file,
			fileName: file.name
		};
		persist();
	},

	clearDocument(key: DocumentKey) {
		formData.documents[key] = {
			...formData.documents[key],
			uploaded: false,
			file: null,
			fileName: ''
		};
		persist();
	},

	/** Marks a document uploaded from GET .../documents (see documents/+page.server.ts) — safe to
	 * call unconditionally: it only ever turns `uploaded` on, never off, so it can't lose local state. */
	hydrateDocumentUploaded(key: DocumentKey) {
		if (formData.documents[key].uploaded) return;
		formData.documents[key] = { ...formData.documents[key], uploaded: true };
		persist();
	},

	completeStep(step: StepId) {
		if (!completedSteps.includes(step)) {
			completedSteps = [...completedSteps, step];
			persist();
		}
	}
};
