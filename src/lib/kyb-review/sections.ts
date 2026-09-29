import type {
	DocumentType,
	Organization,
	OrganizationAddress,
	OrganizationDocument
} from '$lib/data/mockData';
import {
	addressField,
	bankField,
	directorDoc,
	directorField,
	docField,
	ORGANIZATION_FIELD_MAP,
	type OrganizationDocumentName
} from '$lib/onboarding/verificationFields';
import { flattenCommunicationAddress, joinStreetAddress } from '$lib/validation/organization-kyb';
import type { ReviewField, ReviewSection } from './types';

type DocumentDef = {
	label: string;
	name: OrganizationDocumentName;
	documentType: DocumentType;
};

/** Every org document the verification API tracks (see ORGANIZATION_DOCUMENTS). */
const BUSINESS_DOCUMENTS: DocumentDef[] = [
	{ label: 'GST certificate', name: 'gstCertificate', documentType: 'GST certificate' },
	{ label: 'Business PAN', name: 'businessPan', documentType: 'Business PAN card' },
	{ label: 'Business TAN', name: 'businessTan', documentType: 'Business TAN' },
	{
		label: 'Incorporation certificate',
		name: 'incorpCertificate',
		documentType: 'Incorporation certificate'
	},
	{ label: 'MOA', name: 'moa', documentType: 'Memorandum of Association (MOA)' },
	{ label: 'AOA', name: 'aoa', documentType: 'Article of Association (AOA)' },
	{ label: 'UBO declaration', name: 'uboDeclaration', documentType: 'UBO Declaration' },
	{
		label: 'Board resolution',
		name: 'brDocument',
		documentType: 'Board Resolution for Authorized Signatory'
	},
	{ label: 'Voided cheque', name: 'voidedCheque', documentType: 'Cancelled cheque' },
	{ label: 'Electricity bill', name: 'electricityBill', documentType: 'Electricity bill' }
];

function shown(value: string | number | null | undefined): string {
	if (value == null) return '—';
	const text = String(value).trim();
	return text || '—';
}

function titled(value: string): string {
	const text = value.trim();
	if (!text) return '—';
	return text
		.toLowerCase()
		.split('_')
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');
}

function phoneValue(value: string): string {
	const trimmed = value.trim();
	if (!trimmed) return '—';
	const national = trimmed.replace(/^\+91[\s-]*/, '').replace(/^91[\s-]+/, '');
	return national || '—';
}

function field(
	fieldName: string,
	label: string,
	value: string,
	extras?: Partial<Pick<ReviewField, 'kind' | 'prefix' | 'href' | 'fileType'>>
): ReviewField {
	return {
		fieldName,
		label,
		value,
		kind: extras?.kind ?? 'field',
		...(extras?.prefix ? { prefix: extras.prefix } : {}),
		...(extras?.href ? { href: extras.href } : {}),
		...(extras?.fileType ? { fileType: extras.fileType } : {})
	};
}

function uploadedField(
	fieldName: string,
	label: string,
	document: Pick<OrganizationDocument, 'fileName' | 'previewUrl' | 'fileType'> | undefined
): ReviewField {
	const href = document?.previewUrl?.trim();
	const fileName = document?.fileName?.trim();
	return field(fieldName, label, fileName || 'Not uploaded', {
		kind: 'document',
		...(href ? { href } : {}),
		...(document?.fileType ? { fileType: document.fileType } : {})
	});
}

function documentField(documents: OrganizationDocument[], def: DocumentDef): ReviewField {
	const match = documents.find((document) => document.documentType === def.documentType);
	return uploadedField(docField(def.name), def.label, match);
}

function registeredStreet(address: OrganizationAddress): string {
	return shown(joinStreetAddress(address.line1, address.line2));
}

export function buildSections(organization: Organization): ReviewSection[] {
	const { kyb, addressDetails, directors, bankAccounts, documents } = organization;

	const legal: ReviewSection = {
		id: 'legal',
		title: 'Business Registration',
		subtitle: 'Review legal registration and business details.',
		fields: [
			field(ORGANIZATION_FIELD_MAP.brandName, 'Brand name', shown(kyb.brandName)),
			field(ORGANIZATION_FIELD_MAP.gstNumber, 'GSTIN', shown(kyb.gstin)),
			field(ORGANIZATION_FIELD_MAP.orgPan, 'Business PAN', shown(kyb.businessPan)),
			field(ORGANIZATION_FIELD_MAP.businessPhone, 'Business phone', phoneValue(kyb.businessPhone), {
				prefix: '+91'
			}),
			field(ORGANIZATION_FIELD_MAP.industry, 'Industry', shown(kyb.industry)),
			field(
				ORGANIZATION_FIELD_MAP.organizationWebsite,
				'Organization website',
				shown(kyb.organizationWebsite)
			),
			field(ORGANIZATION_FIELD_MAP.registeredYear, 'Registered year', shown(kyb.registeredYear)),
			field(ORGANIZATION_FIELD_MAP.cin, 'CIN (optional)', shown(kyb.cin)),
			field(ORGANIZATION_FIELD_MAP.orgTan, 'TAN (optional)', shown(kyb.tan))
		]
	};

	const address: ReviewSection = {
		id: 'address',
		title: 'Registered Address',
		subtitle: 'Review the registered and communication addresses.',
		fields: [
			field(addressField('address'), 'Address', registeredStreet(addressDetails)),
			field(addressField('city'), 'City', shown(addressDetails.city)),
			field(addressField('state'), 'State', shown(addressDetails.state)),
			field(addressField('country'), 'Country', shown(addressDetails.country)),
			field(addressField('pinCode'), 'PIN code', shown(addressDetails.pincode)),
			field(
				ORGANIZATION_FIELD_MAP.communicationAddress,
				'Communication address',
				shown(flattenCommunicationAddress(kyb.communicationAddress))
			)
		]
	};

	// Keyed by director.id, never the array index.
	const directorFields: ReviewField[] = directors.flatMap((director, index) => {
		const labelPrefix = `Director ${index + 1}`;
		const id = director.id;
		return [
			field(directorField(id, 'name'), `${labelPrefix} Name`, shown(director.name)),
			field(directorField(id, 'email'), `${labelPrefix} Email`, shown(director.email)),
			field(directorField(id, 'phoneNumber'), `${labelPrefix} Phone`, phoneValue(director.phone), {
				prefix: '+91'
			}),
			field(directorField(id, 'pan'), `${labelPrefix} PAN`, shown(director.pan)),
			field(directorField(id, 'aadhar'), `${labelPrefix} Aadhaar`, shown(director.aadhar)),
			uploadedField(directorDoc(id, 'pan'), `${labelPrefix} PAN document`, director.panDocument),
			uploadedField(
				directorDoc(id, 'aadhar'),
				`${labelPrefix} Aadhaar document`,
				director.aadharDocument
			)
		];
	});

	const bankFields: ReviewField[] = bankAccounts.flatMap((account, index) => {
		const labelPrefix = `Account ${index + 1}`;
		const id = account.id;
		return [
			field(
				bankField(id, 'holderName'),
				`${labelPrefix} Account holder`,
				shown(account.accountHolderName)
			),
			field(bankField(id, 'bankName'), `${labelPrefix} Bank name`, shown(account.bankName)),
			field(bankField(id, 'branchName'), `${labelPrefix} Branch`, shown(account.branch)),
			field(
				bankField(id, 'accountNumber'),
				`${labelPrefix} Account number`,
				shown(account.accountNumber)
			),
			field(
				bankField(id, 'accountType'),
				`${labelPrefix} Account type`,
				titled(account.accountType)
			),
			field(bankField(id, 'ifscCode'), `${labelPrefix} IFSC`, shown(account.ifscCode))
		];
	});

	// TODO: Photo attestation has no backend fieldName yet, so it is omitted from this section.
	const documentFields = BUSINESS_DOCUMENTS.map((def) => documentField(documents, def));

	return [
		legal,
		address,
		{
			id: 'directors',
			title: 'Directors',
			subtitle: 'Review each director.',
			fields: directorFields
		},
		{
			id: 'bank',
			title: 'Bank Account',
			subtitle: 'Review each bank account.',
			fields: bankFields
		},
		{
			id: 'documents',
			title: 'Business Documents',
			subtitle: 'Review uploaded business documents.',
			fields: documentFields
		}
	];
}
