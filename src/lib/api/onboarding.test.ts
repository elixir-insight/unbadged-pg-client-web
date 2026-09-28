import { describe, expect, it } from 'vitest';
import type { OnboardingFormData } from '$lib/types/onboarding';
import {
	getDocumentKeyForFieldName,
	documentFieldOptions,
	isDocumentFieldName,
	toBankPayload,
	toKybPayload,
	toSectionPayload
} from './onboarding';

function form(): OnboardingFormData {
	return {
		businessPan: 'ABCDE1234F',
		entityType: 'llp',
		entityName: 'LLP',
		gstin: '27ABCPE1234F1ZB',
		gstinList: [],
		businessDetails: {
			companyType: 'LLP',
			cin: '',
			tan: 'BLRA16345B',
			industry: 'Retail',
			registeredYear: 2018,
			communicationAddress: {
				line1: 'no 234 a.v kovil street',
				line2: '',
				city: 'chennai',
				state: 'tamil nadu',
				pincode: '600090'
			},
			sameAsCommunication: false,
			address: { line1: '12 Park', line2: 'Floor 2', city: 'Pune', state: 'MH', pincode: '411001' },
			phone: '9876543210',
			website: 'https://acme.test',
			brandName: 'Acme'
		},
		bankAccounts: [
			{
				accountHolderName: 'Acme',
				accountNumber: '123456789012',
				confirmAccountNumber: '123456789012',
				ifscCode: 'HDFC0000123',
				bankName: 'HDFC',
				branchName: 'Fort',
				accountType: 'CURRENT'
			}
		],
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
			businessPanCard: { uploaded: false, required: true },
			uboDeclaration: { uploaded: false, required: true },
			boardResolution: { uploaded: false, required: true },
			businessCertificate: { uploaded: false, required: true },
			proofOfFunds: { uploaded: false, required: true },
			addressProof: { uploaded: false, required: true },
			businessTan: { uploaded: false, required: false },
			aoa: { uploaded: false, required: false },
			moa: { uploaded: false, required: false }
		}
	};
}

describe('toKybPayload', () => {
	it('maps the form to the kyb / address / brand / directors payload', () => {
		const payload = toKybPayload(form());
		expect(payload.kyb).toEqual({
			businessPan: 'ABCDE1234F',
			gstNumber: '27ABCPE1234F1ZB',
			cin: '',
			tan: 'BLRA16345B',
			businessPhone: '+919876543210',
			organizationWebsite: 'https://acme.test',
			industry: 'Retail',
			communicationAddress: 'no 234 a.v kovil street, chennai, tamil nadu - 600090',
			registeredYear: 2018
		});
		expect(payload.addressDetails).toEqual({
			address: '12 Park',
			address2: 'Floor 2',
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
			phoneNumber: '+919876543211'
		});
		expect(directors[1]).toMatchObject({ id: 5, name: 'Bo' });
	});
});

describe('toKybPayload addresses', () => {
	it('sends the communication address as registered while "Same as" is ticked', () => {
		const data = form();
		data.businessDetails.sameAsCommunication = true;
		expect(toKybPayload(data).addressDetails).toEqual({
			address: 'no 234 a.v kovil street',
			address2: '',
			city: 'chennai',
			state: 'tamil nadu',
			country: 'India',
			pinCode: '600090'
		});
	});

	it('trims every address value', () => {
		const data = form();
		data.businessDetails.communicationAddress.line1 = '  12 Park  ';
		data.businessDetails.address.city = ' Pune ';
		const payload = toKybPayload(data);
		expect(payload.kyb.communicationAddress).toBe('12 Park, chennai, tamil nadu - 600090');
		expect(payload.addressDetails.city).toBe('Pune');
	});
});

describe('toKybPayload phone numbers', () => {
	// Backend: "Phone numbers must contain country code and be in E.164 format".
	it('sends business and director phones as +91 E.164, whatever form they were typed in', () => {
		const data = form();
		data.businessDetails.phone = '+91 98765 43210';
		data.directors[0].phone = '09876543211';
		const payload = toKybPayload(data);
		expect(payload.kyb.businessPhone).toBe('+919876543210');
		expect(payload.directors[0].phoneNumber).toBe('+919876543211');
	});
});

describe('toKybPayload with masked values', () => {
	it('leaves out a masked business PAN so the saved one is not overwritten', () => {
		const data = form();
		data.businessPan = '**********';
		expect(toKybPayload(data).kyb).not.toHaveProperty('businessPan');
	});

	it('leaves out masked director PAN / Aadhaar but keeps the rest', () => {
		const data = form();
		data.directors[1].pan = '**********';
		data.directors[1].aadhaar = '************';
		const director = toKybPayload(data).directors[1];
		expect(director).not.toHaveProperty('pan');
		expect(director).not.toHaveProperty('aadhar');
		expect(director).toMatchObject({ id: 5, name: 'Bo', email: 'bo@x.test' });
	});
});

describe('toBankPayload', () => {
	it('maps accountHolderName to holderName, passing the rest through', () => {
		expect(toBankPayload(form().bankAccounts[0])).toEqual({
			accountNumber: '123456789012',
			accountType: 'CURRENT',
			bankName: 'HDFC',
			branchName: 'Fort',
			holderName: 'Acme',
			ifscCode: 'HDFC0000123'
		});
	});
});

describe('org document fields', () => {
	it('uses the backend field names management onboarding uploads with', () => {
		expect(documentFieldOptions('gstCertificate')).toEqual([
			{ value: 'gstCertificate', label: 'GST certificate' }
		]);
		expect(documentFieldOptions('businessPanCard')[0].value).toBe('businessPan');
		expect(documentFieldOptions('boardResolution')[0].value).toBe('brDocument');
		expect(documentFieldOptions('businessTan')[0].value).toBe('businessTan');
	});

	it('offers a pick-one choice for the grouped documents', () => {
		const values = (key: Parameters<typeof documentFieldOptions>[0]) =>
			documentFieldOptions(key).map((option) => option.value);
		expect(values('businessCertificate')).toEqual([
			'incorpCertificate',
			'udyamCertificate',
			'msmeCertificate'
		]);
		expect(values('proofOfFunds')).toEqual(['voidedCheque', 'bankStatement']);
		expect(values('addressProof')).toEqual(['rentalAgreement', 'electricityBill']);
	});

	it("only accepts a field name from the slot's own list", () => {
		expect(isDocumentFieldName('addressProof', 'electricityBill')).toBe(true);
		expect(isDocumentFieldName('addressProof', 'gstCertificate')).toBe(false);
		expect(isDocumentFieldName('gstCertificate', 'shopActLicence')).toBe(false);
		expect(isDocumentFieldName('gstCertificate', 'toString')).toBe(false);
	});

	it('maps a GET .../documents field name back to its slot', () => {
		expect(getDocumentKeyForFieldName('gstCertificate')).toBe('gstCertificate');
		expect(getDocumentKeyForFieldName('udyamCertificate')).toBe('businessCertificate');
		expect(getDocumentKeyForFieldName('voidedCheque')).toBe('proofOfFunds');
		expect(getDocumentKeyForFieldName('electricityBill')).toBe('addressProof');
		expect(getDocumentKeyForFieldName('moa')).toBe('moa');
		expect(getDocumentKeyForFieldName('unknownField')).toBeUndefined();
	});
});

describe('toSectionPayload', () => {
	/** What GET returned: PAN masked, a different brand and GSTIN than the form now holds. */
	function saved() {
		const data = form();
		data.businessPan = '**********';
		data.gstin = '29ABCPE1234F1ZB';
		data.businessDetails.brandName = 'Saved brand';
		data.businessDetails.industry = 'Saved industry';
		data.directors = [{ ...data.directors[1], pan: '**********', aadhaar: '************' }];
		return data;
	}

	it('sends the whole object, with only the identity fields taken from the form', () => {
		const payload = toSectionPayload('identity', form(), saved());
		expect(payload.brandName).toBe('Acme');
		expect(payload.kyb).toMatchObject({
			businessPan: 'ABCDE1234F',
			gstNumber: '27ABCPE1234F1ZB',
			industry: 'Retail',
			// Not this step's — as saved.
			communicationAddress: toKybPayload(saved()).kyb.communicationAddress
		});
		expect(payload.addressDetails).toEqual(toKybPayload(saved()).addressDetails);
		expect(payload.directors).toEqual([
			{ id: 5, name: 'Bo', email: 'bo@x.test', phoneNumber: '+919876543212' }
		]);
	});

	it('never sends a masked PAN', () => {
		const data = form();
		data.businessPan = '**********';
		expect(toSectionPayload('identity', data, saved()).kyb).not.toHaveProperty('businessPan');
	});

	it('keeps the saved kyb on an address save, without the PAN', () => {
		const payload = toSectionPayload('address', form(), saved());
		expect(payload.kyb).not.toHaveProperty('businessPan');
		expect(payload.kyb).toMatchObject({
			gstNumber: '29ABCPE1234F1ZB',
			industry: 'Saved industry',
			communicationAddress: 'no 234 a.v kovil street, chennai, tamil nadu - 600090'
		});
		expect(payload.brandName).toBe('Saved brand');
		expect(payload.addressDetails.address2).toBe('Floor 2');
	});

	it('fills an address not saved yet with placeholders on an identity save', () => {
		const empty = saved();
		empty.businessDetails.address = { line1: '', line2: '', city: '', state: '', pincode: '' };
		empty.businessDetails.communicationAddress = { ...empty.businessDetails.address };
		const payload = toSectionPayload('identity', form(), empty);
		expect(payload.kyb.communicationAddress).toBe('-');
		expect(payload.addressDetails).toMatchObject({
			address: '-',
			city: '-',
			state: '-',
			pinCode: '-'
		});
	});

	it('takes only the directors from the form on a directors save', () => {
		const payload = toSectionPayload('directors', form(), saved());
		expect(payload.directors).toHaveLength(2);
		expect(payload.kyb.gstNumber).toBe('29ABCPE1234F1ZB');
		expect(payload.brandName).toBe('Saved brand');
	});
});
