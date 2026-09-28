import type {
	DocumentType,
	Organization,
	OrganizationAddress,
	OrganizationDocument
} from '$lib/data/mockData';
import { flattenCommunicationAddress, joinStreetAddress } from '$lib/validation/organization-kyb';
import type { ReviewField, ReviewSection } from './types';

type DocumentDef = {
	label: string;
	fieldName: string;
	documentType: DocumentType;
};

const BUSINESS_DOCUMENTS: DocumentDef[] = [
	{
		label: 'GST certificate',
		fieldName: 'documents.gstCertificate',
		documentType: 'GST certificate'
	},
	{
		label: 'Business PAN',
		fieldName: 'documents.businessPan',
		documentType: 'Business PAN card'
	},
	{ label: 'Business TAN', fieldName: 'documents.businessTan', documentType: 'Business TAN' },
	{
		label: 'Incorporation certificate',
		fieldName: 'documents.incorpCertificate',
		documentType: 'Incorporation certificate'
	},
	{
		label: 'MOA',
		fieldName: 'documents.moa',
		documentType: 'Memorandum of Association (MOA)'
	},
	{ label: 'AOA', fieldName: 'documents.aoa', documentType: 'Article of Association (AOA)' },
	{
		label: 'MSME certificate',
		fieldName: 'documents.msmeCertificate',
		documentType: 'MSME certificate'
	},
	{
		label: 'Udyam certificate',
		fieldName: 'documents.udyamCertificate',
		documentType: 'Udyam certificate'
	},
	{
		label: 'Bank statement',
		fieldName: 'documents.bankStatement',
		documentType: 'Bank statement (last 3 months)'
	},
	{
		label: 'Voided cheque',
		fieldName: 'documents.voidedCheque',
		documentType: 'Cancelled cheque'
	},
	{
		label: 'Electricity bill',
		fieldName: 'documents.electricityBill',
		documentType: 'Electricity bill'
	},
	{
		label: 'Rental agreement',
		fieldName: 'documents.rentalAgreement',
		documentType: 'Rental agreement'
	}
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
	return uploadedField(def.fieldName, def.label, match);
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
			field('kyb.gstNumber', 'GSTIN', shown(kyb.gstin)),
			field('kyb.businessPan', 'Business PAN', shown(kyb.businessPan)),
			field('kyb.businessPhone', 'Business phone', phoneValue(kyb.businessPhone), {
				prefix: '+91'
			}),
			field('kyb.industry', 'Industry', shown(kyb.industry)),
			field('kyb.organizationWebsite', 'Organization website', shown(kyb.organizationWebsite)),
			field('kyb.registeredYear', 'Registered year', shown(kyb.registeredYear)),
			field('kyb.cin', 'CIN (optional)', shown(kyb.cin)),
			field('kyb.tan', 'TAN (optional)', shown(kyb.tan))
		]
	};

	const address: ReviewSection = {
		id: 'address',
		title: 'Registered Address',
		subtitle: 'Review the registered and communication addresses.',
		fields: [
			field('addressDetails.address', 'Address', registeredStreet(addressDetails)),
			field('addressDetails.city', 'City', shown(addressDetails.city)),
			field('addressDetails.state', 'State', shown(addressDetails.state)),
			field('addressDetails.country', 'Country', shown(addressDetails.country)),
			field('addressDetails.pinCode', 'PIN code', shown(addressDetails.pincode)),
			field(
				'kyb.communicationAddress',
				'Communication address',
				shown(flattenCommunicationAddress(kyb.communicationAddress))
			)
		]
	};

	// Keys follow the backend's `directors[<index>].<field>` vocabulary (see remarkRouting.ts).
	const directorFields: ReviewField[] = directors.flatMap((director, index) => {
		const labelPrefix = `Director ${index + 1}`;
		const key = (name: string) => `directors[${index}].${name}`;
		return [
			field(key('name'), `${labelPrefix} Name`, shown(director.name)),
			field(key('email'), `${labelPrefix} Email`, shown(director.email)),
			field(key('phoneNumber'), `${labelPrefix} Phone`, phoneValue(director.phone), {
				prefix: '+91'
			}),
			field(key('pan'), `${labelPrefix} PAN`, shown(director.pan)),
			field(key('aadhar'), `${labelPrefix} Aadhaar`, shown(director.aadhar)),
			uploadedField(key('panDocument'), `${labelPrefix} PAN document`, director.panDocument),
			uploadedField(
				key('aadharDocument'),
				`${labelPrefix} Aadhaar document`,
				director.aadharDocument
			)
		];
	});

	// The backend keys bank verifications as `bankDetails.<field>` with no account index, so only
	// the settlement (first) account can be reviewed.
	const settlement = bankAccounts[0];
	const bankFields: ReviewField[] = settlement
		? [
				field(
					'bankDetails.accountHolderName',
					'Account holder',
					shown(settlement.accountHolderName)
				),
				field('bankDetails.bankName', 'Bank name', shown(settlement.bankName)),
				field('bankDetails.branchName', 'Branch', shown(settlement.branch)),
				field('bankDetails.accountNumber', 'Account number', shown(settlement.accountNumber)),
				field('bankDetails.accountType', 'Account type', titled(settlement.accountType)),
				field('bankDetails.ifscCode', 'IFSC', shown(settlement.ifscCode))
			]
		: [];

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
			subtitle: 'Review the settlement account.',
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
