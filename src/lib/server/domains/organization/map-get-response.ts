import {
	fixedRequiredDocuments,
	type AccountType,
	type BankAccountStatus,
	type Organization,
	type OrganizationAddress,
	type OrganizationBankAccount,
	type OrganizationBusinessType,
	type OrganizationCategory,
	type OrganizationDocument,
	type OrganizationKyb,
	type OrganizationPrimaryContact,
	type OrganizationStatus,
	type OrganizationServiceType
} from '$lib/data/mockData';
import type { GetOrganizationResponse } from './schema';

function asRecord(value: unknown): Record<string, unknown> | null {
	if (value && typeof value === 'object' && !Array.isArray(value)) {
		return value as Record<string, unknown>;
	}
	return null;
}

function asString(value: unknown, fallback = ''): string {
	if (typeof value === 'string') return value.trim();
	if (typeof value === 'number' && Number.isFinite(value)) return String(value);
	return fallback;
}

function asNumberOrNull(value: unknown): number | null {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value === 'string' && value.trim()) {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : null;
	}
	return null;
}

function emptyAddress(): OrganizationAddress {
	return { line1: '', line2: '', city: '', state: '', pincode: '', country: '' };
}

function emptyPrimaryContact(email = '', phone = ''): OrganizationPrimaryContact {
	return {
		name: '',
		role: '',
		email,
		phone,
		timezone: 'Asia/Kolkata'
	};
}

function emptyPayoutConfiguration(): Organization['payoutConfiguration'] {
	return {
		securityDeposit: '',
		dailyTxnLimit: '',
		txnAmountMin: '100',
		txnAmountMax: '',
		dailyDepositLimit: '',
		bankPipeline: '',
		allowedTransactionTypes: [],
		virtualAccountsEnabled: false
	};
}

function pendingDocuments(): OrganizationDocument[] {
	return [
		...fixedRequiredDocuments.map((documentType) => ({
			id: documentType.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
			documentType,
			fileName: '',
			status: 'Pending' as const
		})),
		{
			id: 'organization-logo',
			documentType: 'Organization logo',
			fileName: '',
			status: 'Pending',
			optional: true
		}
	];
}

function unwrapData(response: GetOrganizationResponse): Record<string, unknown> | null {
	const data = response.data;
	if (Array.isArray(data)) {
		return asRecord(data[0]);
	}
	return asRecord(data);
}

function mapBusinessType(value: string): OrganizationBusinessType {
	const normalized = value.trim().toUpperCase().replace(/\s+/g, '_');
	if (normalized === 'SOLE_PROPRIETORSHIP') return 'SOLE_PROPRIETORSHIP';
	if (normalized === 'PARTNERSHIP') return 'PARTNERSHIP';
	if (
		normalized === 'LLP' ||
		normalized === 'LIMITED_LIABILITY_PARTNERSHIP' ||
		normalized === 'LIMITED LIABILITY PARTNERSHIP'
	) {
		return 'LLP';
	}
	if (normalized === 'PRIVATE_LIMITED' || normalized === 'PRIVATE LIMITED') {
		return 'PRIVATE_LIMITED';
	}
	return 'PRIVATE_LIMITED';
}

function mapBusinessTypeLabel(type: OrganizationBusinessType): OrganizationKyb['businessType'] {
	const labels: Record<OrganizationBusinessType, OrganizationKyb['businessType']> = {
		SOLE_PROPRIETORSHIP: 'Sole Proprietorship',
		PARTNERSHIP: 'Partnership',
		LLP: 'LLP',
		PRIVATE_LIMITED: 'Private Limited'
	};
	return labels[type];
}

function mapCategory(value: string): OrganizationCategory {
	const normalized = value.trim().toUpperCase();
	return normalized === 'PARTNER' ? 'PARTNER' : 'MERCHANT';
}

function mapStatus(value: string): OrganizationStatus {
	const normalized = value.trim().toUpperCase().replace(/\s+/g, '_');
	if (
		normalized === 'IN_PROGRESS' ||
		normalized === 'APPROVED' ||
		normalized === 'ACTIVE' ||
		normalized === 'ON_HOLD' ||
		normalized === 'REJECTED'
	) {
		return normalized;
	}
	return 'IN_PROGRESS';
}

function mapServiceTypes(value: unknown): OrganizationServiceType[] {
	if (!Array.isArray(value)) return ['Payouts'];
	const result: OrganizationServiceType[] = [];
	for (const item of value) {
		const code =
			typeof item === 'string'
				? item
				: asString(asRecord(item)?.serviceType ?? asRecord(item)?.service_type);
		const normalized = code.toUpperCase();
		if (normalized === 'PAYIN' || normalized === 'PAY-INS' || normalized === 'PAY_INS') {
			if (!result.includes('Pay-Ins')) result.push('Pay-Ins');
		}
		if (normalized === 'PAYOUT' || normalized === 'PAYOUTS' || normalized === 'PAY_OUTS') {
			if (!result.includes('Payouts')) result.push('Payouts');
		}
	}
	return result.length > 0 ? result : ['Payouts'];
}

function mapAddressDetails(value: unknown): OrganizationAddress {
	const record = asRecord(value);
	if (!record) return emptyAddress();

	const nestedRegistered =
		asRecord(record.registeredAddress) ?? asRecord(record.registered_address);
	if (nestedRegistered) {
		return {
			line1: asString(nestedRegistered.line1 ?? nestedRegistered.address),
			line2: asString(nestedRegistered.line2),
			city: asString(nestedRegistered.city),
			state: asString(nestedRegistered.state),
			pincode: asString(nestedRegistered.pincode ?? nestedRegistered.pinCode),
			country: asString(nestedRegistered.country, 'India')
		};
	}

	const street = asString(record.address);
	const [line1 = '', line2 = ''] = street.split(',').map((part) => part.trim());

	return {
		line1: line1 || street,
		line2,
		city: asString(record.city),
		state: asString(record.state),
		pincode: asString(record.pinCode ?? record.pincode),
		country: asString(record.country, 'India')
	};
}

function mapCommunicationAddress(
	value: unknown,
	fallback: OrganizationAddress
): OrganizationAddress {
	if (typeof value === 'string' && value.trim()) {
		const parts = value
			.split(',')
			.map((part) => part.trim())
			.filter(Boolean);
		return {
			line1: parts[0] ?? '',
			line2: parts[1] ?? '',
			city: parts[2] ?? '',
			state: parts[3] ?? '',
			pincode: parts[4] ?? '',
			country: parts[5] ?? 'India'
		};
	}
	const record = asRecord(value);
	if (!record) return { ...fallback };
	return {
		line1: asString(record.line1 ?? record.address),
		line2: asString(record.line2),
		city: asString(record.city),
		state: asString(record.state),
		pincode: asString(record.pincode ?? record.pinCode),
		country: asString(record.country, 'India')
	};
}

function mapBankStatus(value: string): BankAccountStatus {
	const normalized = value.trim().toUpperCase().replace(/\s+/g, '_');
	if (
		normalized === 'ACTIVE' ||
		normalized === 'ON_HOLD' ||
		normalized === 'INACTIVE' ||
		normalized === 'BLOCKED' ||
		normalized === 'CLOSED'
	) {
		return normalized;
	}
	if (normalized === 'ACTIVE' || normalized === 'INACTIVE') return normalized;
	return 'ACTIVE';
}

function mapAccountType(value: string): AccountType {
	const normalized = value.trim().toUpperCase().replace(/\s+/g, '_');
	if (
		normalized === 'SAVINGS' ||
		normalized === 'CURRENT' ||
		normalized === 'NODAL' ||
		normalized === 'ESCROW' ||
		normalized === 'FOREIGN_CURRENCY'
	) {
		return normalized;
	}
	if (normalized === 'CURRENT' || normalized === 'CURRENT_ACCOUNT') return 'CURRENT';
	return 'CURRENT';
}

function mapBankAccounts(value: unknown): OrganizationBankAccount[] {
	if (!Array.isArray(value)) return [];
	return value
		.map((item, index) => {
			const record = asRecord(item);
			if (!record) return null;
			const id = asString(
				record.accountId ?? record.bankAccountId ?? record.id,
				`bank-${index + 1}`
			);
			return {
				id,
				accountHolderName: asString(record.holderName ?? record.accountHolderName),
				accountNumber: asString(record.accountNumber),
				ifscCode: asString(record.ifscCode).toUpperCase(),
				bankName: asString(record.bankName),
				branch: asString(record.branchName ?? record.branch),
				accountType: mapAccountType(asString(record.accountType, 'CURRENT')),
				status: mapBankStatus(asString(record.status, 'ACTIVE'))
			};
		})
		.filter((account): account is OrganizationBankAccount => account !== null);
}

function mapKyb(
	payload: Record<string, unknown>,
	registeredAddress: OrganizationAddress,
	name: string,
	businessType: OrganizationBusinessType,
	phone: string,
	email: string
): OrganizationKyb {
	const kyb = asRecord(payload.kyb) ?? {};
	const communication = mapCommunicationAddress(
		kyb.communicationAddress ?? payload.communicationAddress,
		registeredAddress
	);

	return {
		legalCompanyName: asString(payload.legalCompanyName ?? kyb.legalCompanyName, name),
		businessType: mapBusinessTypeLabel(businessType),
		cin: asString(kyb.cin ?? payload.cin),
		tan: asString(kyb.tan ?? payload.tan),
		gstin: asString(kyb.gstNumber ?? kyb.gstin ?? payload.gstNumber ?? payload.gstin),
		businessPan: asString(kyb.businessPan ?? payload.businessPan),
		businessPhone: asString(kyb.businessPhone ?? payload.businessPhone ?? phone),
		industry: asString(kyb.industry ?? payload.industry),
		organizationWebsite: asString(kyb.organizationWebsite ?? payload.organizationWebsite),
		registeredYear: asNumberOrNull(kyb.registeredYear ?? payload.registeredYear),
		registeredAddress,
		communicationAddress: communication,
		primaryContact: emptyPrimaryContact(email, phone),
		directors: [],
		verificationStatus: 'Not Started'
	};
}

export function mapGetOrganizationResponse(
	response: GetOrganizationResponse,
	fallbackOrgId: string
): Organization | null {
	const payload = unwrapData(response);
	if (!payload) return null;

	const orgId = asString(payload.orgId ?? payload.organizationId ?? payload.id, fallbackOrgId);
	if (!orgId) return null;

	const name = asString(payload.legalCompanyName ?? payload.name, orgId);
	const businessType = mapBusinessType(asString(payload.businessType));
	const category = mapCategory(asString(payload.profileType ?? payload.category, 'MERCHANT'));
	const status = mapStatus(asString(payload.status ?? payload.organizationStatus, 'IN_PROGRESS'));
	const phone = asString(payload.phoneNumber ?? payload.phone);
	const email = asString(payload.userEmail ?? payload.email);
	const registeredAddress = mapAddressDetails(payload.addressDetails ?? payload.registeredAddress);
	const serviceTypes = mapServiceTypes(payload.serviceTypes);
	const bankAccounts = mapBankAccounts(
		payload.bankAccounts ?? payload.banks ?? payload.bankAccountDetails
	);

	const kyb = mapKyb(payload, registeredAddress, name, businessType, phone, email);

	return {
		id: orgId,
		name,
		businessType,
		category,
		status,
		kybStatus: 'Not Started',
		createdAt:
			asString(payload.createdAt ?? payload.created_at).slice(0, 10) ||
			new Date().toISOString().slice(0, 10),
		assignedAdmin: asString(payload.assignedAdmin),
		serviceTypes,
		kyb,
		addressDetails: registeredAddress,
		directors: [],
		bankAccounts,
		documents: pendingDocuments(),
		integration: category === 'MERCHANT' ? { callbackUrl: '', whitelistedIp: '' } : null,
		payoutConfiguration: emptyPayoutConfiguration(),
		payinConfiguration: serviceTypes.includes('Pay-Ins') ? { configured: false } : null,
		commissionRules: []
	};
}
