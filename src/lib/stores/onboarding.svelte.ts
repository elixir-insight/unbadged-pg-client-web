import { untrack } from 'svelte';
import {
	resolveOnboardingStatus,
	type OnboardingStatus
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
	type OnboardingPrefill,
	type OnboardingMode
} from '$lib/types/onboarding';
import type { OrganizationSection } from '$lib/api/onboarding';
import {
	communicationFromSaved,
	emptyAddress,
	isAddressEmpty
} from '$lib/utils/onboarding-address';

const STORAGE_KEY = 'pg-self-onboarding-v4';

/**
 * The saves the wizard makes: one per step that saves PUT /organization (identity, address,
 * directors — see toSectionPayload), and `bankAccounts` for the bank create/update.
 */
export type SaveKey = OrganizationSection | 'bankAccounts';

/**
 * What the backend last confirmed per save, serialized — the layout seeds it from the server
 * data on every load (see seedClean), and each successful save updates it. Plain
 * (non-reactive): nothing renders from it.
 */
const savedSnapshots: Partial<Record<SaveKey, string>> = {};

/**
 * `saved` cut down to the keys `server` has, in `server`'s key order. GET returns PAN/Aadhaar
 * masked, and the save payload leaves masked values out (see toKybPayload) — so the server's
 * copy lacks exactly those keys, and this is the last saved payload as the server would show it.
 */
function projectOnto(saved: unknown, server: unknown): unknown {
	if (Array.isArray(saved) && Array.isArray(server)) {
		return saved.length === server.length
			? saved.map((item, i) => projectOnto(item, server[i]))
			: saved;
	}
	if (saved && server && typeof saved === 'object' && typeof server === 'object') {
		const source = saved as Record<string, unknown>;
		const target = server as Record<string, unknown>;
		return Object.fromEntries(
			Object.keys(target).map((key) => [key, projectOnto(source[key], target[key])])
		);
	}
	return saved;
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
			communicationAddress: emptyAddress(),
			sameAsCommunication: true
		},
		bankAccounts: [emptyBankAccount()],
		directors: [],
		documents: emptyDocuments(null)
	};
}

type PersistedDocuments = Partial<Record<DocumentKey, Omit<DocumentSlot, 'file'>>>;

/** Sessions persisted before the communication address was structured hold it as a string. */
type PersistedBusinessDetails = Omit<
	BusinessDetails,
	'communicationAddress' | 'sameAsCommunication'
> & {
	communicationAddress: Address | string;
	sameAsCommunication?: boolean;
};

interface PersistedState {
	formData: Omit<OnboardingFormData, 'documents' | 'businessDetails'> & {
		businessDetails: PersistedBusinessDetails;
		documents: PersistedDocuments;
	};
	mode: OnboardingMode;
	verifications?: Record<string, string>;
	focusField?: string;
	/** Payloads this tab last saved successfully — only ever written by markClean. */
	lastSaved?: Partial<Record<SaveKey, string>>;
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
	const address = { ...emptyAddress(), ...persisted.businessDetails.address };
	const communication = persisted.businessDetails.communicationAddress;

	return {
		...persisted,
		entityType,
		businessDetails: {
			...emptyForm().businessDetails,
			...persisted.businessDetails,
			address,
			...(typeof communication === 'string'
				? communicationFromSaved(communication, address)
				: {
						communicationAddress: { ...emptyAddress(), ...communication },
						sameAsCommunication: persisted.businessDetails.sameAsCommunication ?? true
					})
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
let verifications = $state<Record<string, string>>(persisted?.verifications ?? {});
let focusField = $state(persisted?.focusField ?? '');
// Plain, like savedSnapshots — persisted so a reload can tell "unmasked value I saved" from
// "unmasked value I typed but never saved" (see seedClean).
const lastSaved: Partial<Record<SaveKey, string>> = { ...persisted?.lastSaved };
// Save/submit errors pinned to fields (keyed like `verifications`, e.g. `kyb.gstNumber`) — each
// shown under its field until that field is edited; never persisted.
let fieldSaveErrors = $state<Record<string, string>>({});
// The org's real profileStatus, fetched once per layout mount (see +layout.server.ts) — never
// persisted, always refetched, so a status change server-side is never shown stale.
let profileStatus = $state('');

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
			verifications,
			focusField,
			lastSaved
		};
		sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
	});
}

/**
 * Brings local director ids in line with the directors actually saved upstream. An id the
 * backend no longer has (the director was deleted or re-created by a save) is dropped along with
 * its document flags — using it fails with "Director not found" — and any director without an id
 * takes the id of its saved match, by email then name. PAN can't be matched on: the saved one
 * comes back masked. Without an id, delete only drops a director locally and its documents can't
 * be fetched or uploaded.
 */
function reconcileDirectorIds(local: Director[], saved: Director[]): Director[] {
	const savedIds = saved.map((director) => director.id).filter((id) => id !== undefined);
	const current = local.map((director) =>
		director.id === undefined || savedIds.includes(director.id)
			? director
			: { ...director, id: undefined, aadhaarDocument: '', panDocument: '' }
	);

	const key = (value: string) => value.trim().toLowerCase();
	const taken: (number | undefined)[] = current.map((director) => director.id);
	const findBy = (field: 'email' | 'name', value: string) =>
		value === ''
			? undefined
			: saved.find((s) => s.id !== undefined && !taken.includes(s.id) && key(s[field]) === value);
	return current.map((director) => {
		if (director.id !== undefined) return director;
		const match = findBy('email', key(director.email)) ?? findBy('name', key(director.name));
		if (match?.id === undefined) return director;
		taken.push(match.id);
		return { ...director, id: match.id };
	});
}

function sameDirectorIds(a: Director[], b: Director[]): boolean {
	return a.every((director, i) => director.id === b[i]?.id);
}

/** Writes reconciled ids back only when something changed, so it never churns the store. */
function reconcileDirectors(saved: Director[]) {
	const next = reconcileDirectorIds(formData.directors, saved);
	if (!sameDirectorIds(formData.directors, next)) formData.directors = next;
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
	get verifications() {
		return verifications;
	},
	get focusField() {
		return focusField;
	},
	get fieldSaveErrors() {
		return fieldSaveErrors;
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

	/** Replaces every pinned save error with `message` under each of `keys`. */
	setFieldSaveErrors(keys: readonly string[], message: string) {
		fieldSaveErrors = Object.fromEntries(keys.map((key) => [key, message]));
	},

	/** Drops one field's save error (it was edited), or all of them. */
	clearFieldSaveError(key?: string) {
		if (key === undefined) {
			fieldSaveErrors = {};
			return;
		}
		if (!(key in fieldSaveErrors)) return;
		const next = { ...fieldSaveErrors };
		delete next[key];
		fieldSaveErrors = next;
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
		// Untracked, like every hydrate*: called from an $effect, and reads what it writes.
		untrack(() => {
			if (formData.entityType !== null) return;
			formData.entityType = entityType;
			formData.entityName = ENTITY_TYPE_LABELS[entityType];
			formData.businessDetails.companyType = ENTITY_TYPE_COMPANY_TYPES[entityType];
			formData.documents = applyEntityDocumentRequirements(formData.documents, entityType);
			persist();
		});
	},

	/**
	 * Fills in details already saved upstream (see +layout.server.ts) — the wizard otherwise only
	 * knows what this browser session typed. Only fills fields that are still empty, and directors
	 * only when none exist locally, so it never overwrites what the user is editing and is safe to
	 * run on every load.
	 */
	hydrateFromOrganization(prefill: OnboardingPrefill) {
		// Untracked: this runs inside the layout's $effect and both reads and writes formData —
		// tracked, each write would re-run that effect forever (effect_update_depth_exceeded),
		// which halts rendering and leaves the step content blank.
		untrack(() => {
			const fillText = (current: string, saved: string) => (current.trim() ? current : saved);

			formData.businessPan = fillText(formData.businessPan, prefill.businessPan);
			formData.gstin = fillText(formData.gstin, prefill.gstin);

			const details = formData.businessDetails;
			const saved = prefill.businessDetails;
			formData.businessDetails = {
				...details,
				cin: fillText(details.cin, saved.cin),
				tan: fillText(details.tan, saved.tan),
				brandName: fillText(details.brandName, saved.brandName),
				phone: fillText(details.phone, saved.phone),
				website: fillText(details.website, saved.website),
				industry: fillText(details.industry, saved.industry),
				registeredYear: details.registeredYear ?? saved.registeredYear,
				// The communication address is only ever taken whole: a local draft wins, and only an
				// untouched one takes the saved parts and checkbox state.
				...(isAddressEmpty(details.communicationAddress)
					? {
							communicationAddress: saved.communicationAddress,
							sameAsCommunication: saved.sameAsCommunication
						}
					: {}),
				address: {
					line1: fillText(details.address.line1, saved.address.line1),
					line2: fillText(details.address.line2, saved.address.line2),
					city: fillText(details.address.city, saved.address.city),
					state: fillText(details.address.state, saved.address.state),
					pincode: fillText(details.address.pincode, saved.address.pincode),
					country: details.address.country ?? saved.address.country
				}
			};

			if (formData.directors.length === 0 && prefill.directors.length > 0) {
				formData.directors = prefill.directors;
			} else {
				reconcileDirectors(prefill.directors);
			}
			persist();
		});
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
			address: formData.businessDetails.address,
			communicationAddress: formData.businessDetails.communicationAddress
		};
		persist();
	},

	updateBusinessAddress(patch: Partial<Address>) {
		formData.businessDetails.address = patchAddress(formData.businessDetails.address, patch);
		persist();
	},

	updateCommunicationAddress(patch: Partial<Address>) {
		formData.businessDetails.communicationAddress = patchAddress(
			formData.businessDetails.communicationAddress,
			patch
		);
		persist();
	},

	/** Only flips the flag — the registered address typed earlier is kept for when it's unticked. */
	setSameAsCommunication(same: boolean) {
		formData.businessDetails.sameAsCommunication = same;
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

	/**
	 * Re-syncs director ids with the directors saved upstream, fetched fresh each time the
	 * directors step loads (see directors/+page.server.ts) — ids go stale when a save elsewhere
	 * re-creates them. Untracked: called from an $effect and reads what it writes.
	 */
	syncDirectorIds(saved: Director[]) {
		untrack(() => {
			reconcileDirectors(saved);
			persist();
		});
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
		// Untracked: called from the bank page's $effect and reads what it writes. Accounts that
		// map to nothing (unrecognised upstream shape) are dropped — hydrating those would leave the
		// list "empty" and, tracked, re-run the effect forever (effect_update_depth_exceeded).
		untrack(() => {
			const saved = accounts.filter((account) => !isEmptyBankAccount(account));
			if (saved.length === 0) return;
			if (!formData.bankAccounts.every(isEmptyBankAccount)) return;
			formData.bankAccounts = saved;
			persist();
		});
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
		untrack(() => {
			if (formData.documents[key].uploaded) return;
			formData.documents[key] = { ...formData.documents[key], uploaded: true };
			persist();
		});
	},

	/**
	 * Whether `payload` differs from what the backend last confirmed for this save — Continue
	 * skips the network call when it doesn't. Unknown baseline (nothing saved yet) counts as dirty.
	 */
	isDirty(key: SaveKey, payload: unknown): boolean {
		return savedSnapshots[key] !== JSON.stringify(payload);
	},

	/** Records `payload` as what the backend now holds, right after a successful save. */
	markClean(key: SaveKey, payload: unknown) {
		const serialized = JSON.stringify(payload);
		savedSnapshots[key] = serialized;
		lastSaved[key] = serialized;
		persist();
	},

	/**
	 * Sets the baseline from the server's copy on load. The server masks PAN/Aadhaar, but this tab
	 * still holds the unmasked values it saved (sessionStorage) — compared against the masked copy
	 * those would always read as changed and re-save on every Continue. So when this tab's last
	 * save matches the server on every field the server shows, that save is the baseline instead;
	 * anything else (edited elsewhere, never saved here) falls back to the server's copy.
	 */
	seedClean(key: SaveKey, serverPayload: unknown) {
		const server = JSON.stringify(serverPayload);
		const saved = lastSaved[key];
		const matches =
			saved !== undefined &&
			JSON.stringify(projectOnto(JSON.parse(saved), serverPayload)) === server;
		savedSnapshots[key] = matches ? saved : server;
	}
};
