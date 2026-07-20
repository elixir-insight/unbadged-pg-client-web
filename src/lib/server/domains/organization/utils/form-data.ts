import * as v from 'valibot';
import {
	CreateOrganizationFormBodySchema,
	type CreateOrganizationFormBody
} from '../mappers/to-api/create-organization';
import { UpdateOrganizationSectionFormBodySchema } from '../mappers/to-api/update-kyb';
import { AddBankFormBodySchema, type AddBankFormBody } from '../mappers/to-api/bank-account';

function readString(formData: FormData, key: string): string {
	return String(formData.get(key) ?? '');
}

function readStringArray(formData: FormData, key: string): string[] {
	return formData.getAll(key).map((value) => String(value));
}

function readJsonRecord(formData: FormData, key: string): Record<string, string> {
	const raw = readString(formData, key);
	if (!raw.trim()) return {};

	try {
		const parsed: unknown = JSON.parse(raw);
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
			return {};
		}
		return Object.fromEntries(
			Object.entries(parsed).map(([field, value]) => [field, String(value ?? '')])
		);
	} catch {
		return {};
	}
}

export function parseCreateOrganizationFormData(
	formData: FormData
): v.SafeParseResult<typeof CreateOrganizationFormBodySchema> {
	const body: CreateOrganizationFormBody = {
		selectedCategory: readString(
			formData,
			'selectedCategory'
		) as CreateOrganizationFormBody['selectedCategory'],
		orgName: readString(formData, 'orgName'),
		orgPhone: readString(formData, 'orgPhone'),
		orgEmail: readString(formData, 'orgEmail'),
		orgBusinessType: readString(formData, 'orgBusinessType'),
		affiliateId: readString(formData, 'affiliateId'),
		selectedServiceTypes: readStringArray(formData, 'selectedServiceTypes'),
		servicePipelines: readJsonRecord(formData, 'servicePipelines')
	};

	return v.safeParse(CreateOrganizationFormBodySchema, body);
}

export function parseUpdateKybSectionFormData(
	formData: FormData
): v.SafeParseResult<typeof UpdateOrganizationSectionFormBodySchema> {
	const section = readString(formData, 'section');
	const payloadRaw = readString(formData, 'payload');

	let payload: unknown;
	try {
		payload = JSON.parse(payloadRaw);
	} catch {
		return v.safeParse(UpdateOrganizationSectionFormBodySchema, {
			section: 'invalid-json',
			payload: payloadRaw
		});
	}

	if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
		return v.safeParse(UpdateOrganizationSectionFormBodySchema, {
			section,
			payload
		});
	}

	const body = {
		section,
		...(payload as Record<string, unknown>)
	};

	return v.safeParse(UpdateOrganizationSectionFormBodySchema, body);
}

export function parseBankAccountFormData(
	formData: FormData
): v.SafeParseResult<typeof AddBankFormBodySchema> {
	const body: AddBankFormBody = {
		accountHolderName: readString(formData, 'accountHolderName'),
		accountNumber: readString(formData, 'accountNumber'),
		ifscCode: readString(formData, 'ifscCode'),
		bankName: readString(formData, 'bankName'),
		branch: readString(formData, 'branch'),
		accountType: readString(formData, 'accountType') as AddBankFormBody['accountType'],
		status: readString(formData, 'status') as AddBankFormBody['status']
	};

	return v.safeParse(AddBankFormBodySchema, body);
}

export function buildOrgDocumentUploadFormData(fieldName: string, file: File): FormData {
	const formData = new FormData();
	formData.append(fieldName, file, file.name);
	return formData;
}

export function buildDirectorDocumentUploadFormData(
	fieldName: 'aadhar' | 'pan',
	file: File
): FormData {
	const formData = new FormData();
	formData.append(fieldName, file, file.name);
	return formData;
}
