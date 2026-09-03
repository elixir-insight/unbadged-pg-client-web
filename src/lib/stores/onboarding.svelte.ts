import type { ProfileStatus } from '$lib/components/self-onboarding/stage-status';
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

const STORAGE_KEY = 'pg-self-onboarding-v2';

function emptyAddress(): Address {
	return { line1: '', line2: '', city: '', state: '', pincode: '' };
}

function emptyDocument(required: boolean): DocumentSlot {
	return { uploaded: false, required, file: null, fileName: '' };
}

function emptyDocuments(entityType: EntityType | null): Documents {
	return {
		gstCertificate: emptyDocument(true),
		panCardCopy: emptyDocument(true),
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
			companyName: '',
			companyType: '',
			cin: '',
			address: emptyAddress(),
			currentAddress: emptyAddress(),
			currentAddressSameAsContact: false,
			phone: '',
			email: '',
			website: '',
			brandName: ''
		},
		bankDetails: {
			accountHolderName: '',
			accountNumber: '',
			confirmAccountNumber: '',
			ifscCode: '',
			bankName: '',
			branchName: ''
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
	profileStatus?: ProfileStatus | null;
	verifications?: Record<string, string>;
	businessSection?: 'company' | 'address';
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
		panCardCopy: omitFile(data.documents.panCardCopy),
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
			address: { ...emptyAddress(), ...persisted.businessDetails.address },
			currentAddress: { ...emptyAddress(), ...persisted.businessDetails.currentAddress },
			currentAddressSameAsContact: persisted.businessDetails.currentAddressSameAsContact ?? false
		},
		documents: applyEntityDocumentRequirements(
			{
				gstCertificate: restoreSlot(persisted.documents.gstCertificate),
				panCardCopy: restoreSlot(persisted.documents.panCardCopy),
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
let profileStatus = $state<ProfileStatus | null>(persisted?.profileStatus ?? null);
let verifications = $state<Record<string, string>>(persisted?.verifications ?? {});
let businessSection = $state<'company' | 'address'>(persisted?.businessSection ?? 'company');
let focusField = $state(persisted?.focusField ?? '');

const progressPercent = $derived(Math.round((completedSteps.length / 7) * 100));

function persist() {
	if (typeof sessionStorage === 'undefined') return;
	const payload: PersistedState = {
		formData: stripFiles(formData),
		mode,
		completedSteps,
		profileStatus,
		verifications,
		businessSection,
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
	get profileStatus() {
		return profileStatus;
	},
	get verifications() {
		return verifications;
	},
	get businessSection() {
		return businessSection;
	},
	get focusField() {
		return focusField;
	},
	get progressPercent() {
		return progressPercent;
	},

	persist,

	setProfileStatus(status: ProfileStatus | null) {
		profileStatus = status;
		persist();
	},

	setVerifications(next: Record<string, string>) {
		verifications = next;
		persist();
	},

	setBusinessSection(section: 'company' | 'address') {
		businessSection = section;
		persist();
	},

	setFocusField(field: string) {
		focusField = field;
		persist();
	},

	clearVerification(key: string) {
		if (!(key in verifications)) return;
		const next = { ...verifications };
		delete next[key];
		verifications = next;
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

	setBusinessDetails(details: Partial<BusinessDetails>, cin?: string) {
		formData.businessDetails = {
			...formData.businessDetails,
			...details,
			address: details.address
				? { ...formData.businessDetails.address, ...details.address }
				: formData.businessDetails.address,
			currentAddress: details.currentAddress
				? { ...formData.businessDetails.currentAddress, ...details.currentAddress }
				: formData.businessDetails.currentAddress
		};
		if (cin !== undefined) {
			formData.businessDetails.cin = cin;
		}
		persist();
	},

	updateBusinessDetails(patch: Partial<BusinessDetails>) {
		formData.businessDetails = {
			...formData.businessDetails,
			...patch,
			address: formData.businessDetails.address,
			currentAddress: formData.businessDetails.currentAddress
		};
		persist();
	},

	updateBusinessAddress(patch: Partial<Address>) {
		formData.businessDetails.address = patchAddress(formData.businessDetails.address, patch);
		persist();
	},

	updateCurrentAddress(patch: Partial<Address>) {
		formData.businessDetails.currentAddress = patchAddress(
			formData.businessDetails.currentAddress,
			patch
		);
		persist();
	},

	setCurrentAddressSameAsContact(same: boolean) {
		formData.businessDetails.currentAddressSameAsContact = same;
		persist();
	},

	commitCurrentAddressFromContact() {
		if (!formData.businessDetails.currentAddressSameAsContact) return;
		formData.businessDetails.currentAddress = { ...formData.businessDetails.address };
		persist();
	},

	setDirectors(directors: Director[]) {
		formData.directors = directors;
		persist();
	},

	addDirector() {
		formData.directors = [
			...formData.directors,
			{ name: '', pan: '', din: '', email: '', phone: '', status: 'pending' }
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

	completeStep(step: number) {
		if (!completedSteps.includes(step)) {
			completedSteps = [...completedSteps, step];
			persist();
		}
	}
};
