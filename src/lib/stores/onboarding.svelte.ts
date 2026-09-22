import { STEPS, type StepId } from '$lib/components/self-onboarding/steps';
import {
	ENTITY_TYPE_COMPANY_TYPES,
	parseEntityType,
	requiresIncorporationCertificate,
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

const STORAGE_KEY = 'pg-self-onboarding-v3';

function emptyAddress(): Address {
	return { line1: '', line2: '', city: '', state: '', pincode: '' };
}

function emptyDocument(required: boolean): DocumentSlot {
	return { uploaded: false, required, file: null, fileName: '' };
}

function emptyDocuments(entityType: EntityType | null): Documents {
	return {
		gstCertificate: emptyDocument(true),
		certificateOfIncorporation: emptyDocument(requiresIncorporationCertificate(entityType)),
		shopActLicence: emptyDocument(entityType === 'proprietorship'),
		bankStatement: emptyDocument(true),
		addressProof: emptyDocument(true)
	};
}

function applyEntityDocumentRequirements(
	docs: Documents,
	entityType: EntityType | null
): Documents {
	return {
		...docs,
		certificateOfIncorporation: {
			...docs.certificateOfIncorporation,
			required: requiresIncorporationCertificate(entityType)
		},
		shopActLicence: {
			...docs.shopActLicence,
			required: entityType === 'proprietorship'
		}
	};
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
		bankDetails: {
			accountHolderName: '',
			accountNumber: '',
			confirmAccountNumber: '',
			ifscCode: '',
			bankName: '',
			branchName: '',
			accountType: ''
		},
		directors: [],
		documents: emptyDocuments(null)
	};
}

type PersistedDocuments = Record<DocumentKey, Omit<DocumentSlot, 'file'>>;

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
	const documents = {
		gstCertificate: omitFile(data.documents.gstCertificate),
		certificateOfIncorporation: omitFile(data.documents.certificateOfIncorporation),
		shopActLicence: omitFile(data.documents.shopActLicence),
		bankStatement: omitFile(data.documents.bankStatement),
		addressProof: omitFile(data.documents.addressProof)
	} satisfies PersistedDocuments;

	return { ...data, documents };
}

function restoreForm(persisted: PersistedState['formData']): OnboardingFormData {
	const restoreSlot = (slot: Omit<DocumentSlot, 'file'>): DocumentSlot => ({
		uploaded: slot.uploaded,
		required: slot.required,
		fileName: slot.fileName ?? '',
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
		bankDetails: { ...emptyForm().bankDetails, ...persisted.bankDetails },
		documents: applyEntityDocumentRequirements(
			{
				gstCertificate: restoreSlot(persisted.documents.gstCertificate),
				certificateOfIncorporation: restoreSlot(persisted.documents.certificateOfIncorporation),
				shopActLicence: restoreSlot(persisted.documents.shopActLicence),
				bankStatement: restoreSlot(persisted.documents.bankStatement),
				addressProof: restoreSlot(persisted.documents.addressProof)
			},
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

const progressPercent = $derived(Math.round((completedSteps.length / STEPS.length) * 100));

function persist() {
	if (typeof sessionStorage === 'undefined') return;
	const payload: PersistedState = {
		formData: stripFiles(formData),
		mode,
		completedSteps,
		verifications,
		focusField
	};
	sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
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

	persist,

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

	updateBankDetails(patch: Partial<BankDetails>) {
		formData.bankDetails = { ...formData.bankDetails, ...patch };
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

	completeStep(step: StepId) {
		if (!completedSteps.includes(step)) {
			completedSteps = [...completedSteps, step];
			persist();
		}
	}
};
