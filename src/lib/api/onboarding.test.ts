import { afterEach, describe, expect, it, vi } from 'vitest';
import type { OnboardingFormData } from '$lib/types/onboarding';
import {
	createBankAccount,
	saveOrganization,
	submitOnboarding,
	toKybPayload,
	updateBankAccount,
	isOrgDocumentUploadSupported,
	uploadDirectorDocument,
	uploadOrgDocument
} from './onboarding';

function form(): OnboardingFormData {
	return {
		businessPan: 'ABCDE1234F',
		entityType: 'llp',
		entityName: 'LLP',
		gstin: '27ABCDE1234F1Z5',
		gstinList: [],
		businessDetails: {
			companyType: 'LLP',
			cin: '',
			tan: 'BLRA16345B',
			industry: 'Retail',
			registeredYear: 2018,
			communicationAddress: 'Somewhere',
			address: { line1: '12 Park', line2: 'Floor 2', city: 'Pune', state: 'MH', pincode: '411001' },
			phone: '9876543210',
			website: 'https://acme.test',
			brandName: 'Acme'
		},
		bankDetails: {
			accountHolderName: 'Acme',
			accountNumber: '123456789012',
			confirmAccountNumber: '123456789012',
			ifscCode: 'HDFC0000123',
			bankName: 'HDFC',
			branchName: 'Fort',
			accountType: 'CURRENT'
		},
		directors: [
			{
				name: 'Ada',
				pan: 'PQRST2345P',
				aadhaar: '234567890123',
				email: 'ada@x.test',
				phone: '9876543211'
			},
			{
				id: 5,
				name: 'Bo',
				pan: 'PQRST2345Q',
				aadhaar: '234567890124',
				email: 'bo@x.test',
				phone: '9876543212'
			}
		],
		documents: {
			gstCertificate: { uploaded: false, required: true },
			certificateOfIncorporation: { uploaded: false, required: true },
			shopActLicence: { uploaded: false, required: false },
			bankStatement: { uploaded: false, required: true },
			addressProof: { uploaded: false, required: true }
		}
	};
}

function mockFetch(body: unknown, init: { ok?: boolean; status?: number } = {}) {
	const fetchMock = vi.fn().mockResolvedValue({
		ok: init.ok ?? true,
		status: init.status ?? 200,
		json: () => Promise.resolve(body)
	});
	vi.stubGlobal('fetch', fetchMock);
	return fetchMock;
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('toKybPayload', () => {
	it('maps the form to the kyb / address / brand / directors payload', () => {
		const payload = toKybPayload(form());
		expect(payload.kyb).toEqual({
			businessPan: 'ABCDE1234F',
			gstNumber: '27ABCDE1234F1Z5',
			cin: '',
			tan: 'BLRA16345B',
			businessPhone: '9876543210',
			organizationWebsite: 'https://acme.test',
			industry: 'Retail',
			communicationAddress: 'Somewhere',
			registeredYear: 2018
		});
		expect(payload.addressDetails).toEqual({
			address: '12 Park, Floor 2',
			city: 'Pune',
			state: 'MH',
			country: 'India',
			pinCode: '411001'
		});
		expect(payload.brandName).toBe('Acme');
	});

	it('sends a director id only once it is known', () => {
		const { directors } = toKybPayload(form());
		expect(directors[0]).toEqual({
			name: 'Ada',
			aadhar: '234567890123',
			pan: 'PQRST2345P',
			email: 'ada@x.test',
			phoneNumber: '9876543211'
		});
		expect(directors[1]).toMatchObject({ id: 5, name: 'Bo' });
	});
});

describe('requests', () => {
	it('PUTs the organization through the same-origin proxy', async () => {
		const fetchMock = mockFetch({ data: [], message: 'ok', statusCode: 200 });
		await saveOrganization(form());
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/api/onboarding/organization');
		expect(init.method).toBe('PUT');
		expect(JSON.parse(init.body).kyb.businessPan).toBe('ABCDE1234F');
	});

	it('creates and updates the bank account with the holderName mapping', async () => {
		const fetchMock = mockFetch({ data: [{ accountId: 3, status: 'PENDING' }] });
		const created = await createBankAccount(form().bankDetails);
		expect(created.data[0].accountId).toBe(3);
		expect(fetchMock.mock.calls[0][0]).toBe('/api/onboarding/organization/bank');
		expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
			holderName: 'Acme',
			accountType: 'CURRENT'
		});

		await updateBankAccount(3, form().bankDetails);
		expect(fetchMock.mock.calls[1][0]).toBe('/api/onboarding/organization/bank/3');
		expect(fetchMock.mock.calls[1][1].method).toBe('PUT');
	});

	it('returns the application id on submit', async () => {
		mockFetch({ data: 'APP-123', message: 'ok', statusCode: 200 });
		expect(await submitOnboarding()).toEqual({ success: true, applicationId: 'APP-123' });
	});

	it('surfaces the server message, falling back to the status', async () => {
		mockFetch({ message: 'PAN already registered' }, { ok: false, status: 409 });
		await expect(saveOrganization(form())).rejects.toThrow('PAN already registered');

		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: false,
				status: 502,
				json: () => Promise.reject(new Error('not json'))
			})
		);
		await expect(saveOrganization(form())).rejects.toThrow('HTTP 502');
	});
});

describe('uploadDirectorDocument (stub)', () => {
	it('stays disabled until the request body is confirmed', async () => {
		const fetchMock = mockFetch({});
		const file = new File(['x'], 'x.pdf');
		await expect(uploadDirectorDocument(1, file)).rejects.toThrow('awaiting API');
		expect(fetchMock).not.toHaveBeenCalled();
	});
});

describe('uploadOrgDocument', () => {
	it('posts the file under the mapped field name for its document type', async () => {
		const fetchMock = mockFetch({ data: [], message: 'ok', statusCode: 200 });
		const file = new File(['%PDF'], 'gst.pdf', { type: 'application/pdf' });
		await uploadOrgDocument('gstCertificate', file);

		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/api/onboarding/organization/documents');
		expect(init.method).toBe('POST');
		expect(init.headers).toBeUndefined(); // no Content-Type — the browser sets the multipart boundary
		const body = init.body as FormData;
		expect(body).toBeInstanceOf(FormData);
		// Node's FormData re-wraps the File on .get(), so compare by name rather than identity.
		expect((body.get('gstCertificate') as File).name).toBe(file.name);
	});

	it('maps every confirmed document type to its backend camelCase field name', async () => {
		const fetchMock = mockFetch({ data: [], message: 'ok', statusCode: 200 });
		const file = new File(['x'], 'x.pdf');
		const cases: [Parameters<typeof uploadOrgDocument>[0], string][] = [
			['certificateOfIncorporation', 'incorpCertificate'],
			['bankStatement', 'bankStatement']
		];
		for (const [documentType, fieldName] of cases) {
			await uploadOrgDocument(documentType, file);
			const body = fetchMock.mock.calls.at(-1)![1].body as FormData;
			expect((body.get(fieldName) as File)?.name).toBe(file.name);
		}
	});

	it('surfaces the server message on failure', async () => {
		mockFetch({ message: 'File type not supported' }, { ok: false, status: 415 });
		await expect(uploadOrgDocument('gstCertificate', new File(['x'], 'x.pdf'))).rejects.toThrow(
			'File type not supported'
		);
	});

	it('refuses document types with no confirmed backend field, without calling the API', async () => {
		const fetchMock = mockFetch({});
		expect(isOrgDocumentUploadSupported('shopActLicence')).toBe(false);
		expect(isOrgDocumentUploadSupported('addressProof')).toBe(false);
		await expect(uploadOrgDocument('shopActLicence', new File(['x'], 'x.pdf'))).rejects.toThrow(
			'no confirmed backend field'
		);
		expect(fetchMock).not.toHaveBeenCalled();
	});
});
