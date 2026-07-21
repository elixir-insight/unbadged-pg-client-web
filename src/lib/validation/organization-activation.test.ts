import { describe, expect, it } from 'vitest';
import { validateOrganizationActivation } from './organization-activation';
import { MAX_UPLOAD_FILE_SIZE_BYTES } from './file-upload';

function createFile(name: string, size: number): File {
	return new File([new Uint8Array(size)], name, { type: 'application/pdf' });
}

describe('organization activation validation', () => {
	it('accepts a valid activation payload', () => {
		const result = validateOrganizationActivation({
			apiKey: 'test-api-key',
			saltKey: 'test-salt-key',
			businessCertificateType: 'Incorporation certificate',
			file: createFile('certificate.pdf', 1024)
		});

		expect(result.valid).toBe(true);
		expect(result.errors).toEqual({});
	});

	it('rejects empty apiKey and saltKey', () => {
		const result = validateOrganizationActivation({
			apiKey: '   ',
			saltKey: '',
			businessCertificateType: 'Udyam certificate',
			file: createFile('certificate.pdf', 1024)
		});

		expect(result.valid).toBe(false);
		expect(result.errors.apiKey).toBeTruthy();
		expect(result.errors.saltKey).toBeTruthy();
	});

	it('rejects missing business certificate file', () => {
		const result = validateOrganizationActivation({
			apiKey: 'test-api-key',
			saltKey: 'test-salt-key',
			businessCertificateType: 'MSME certificate',
			file: null
		});

		expect(result.valid).toBe(false);
		expect(result.errors.businessCertificate).toBeTruthy();
	});

	it('rejects invalid business certificate type', () => {
		const result = validateOrganizationActivation({
			apiKey: 'test-api-key',
			saltKey: 'test-salt-key',
			businessCertificateType: 'Invalid certificate',
			file: createFile('certificate.pdf', 1024)
		});

		expect(result.valid).toBe(false);
		expect(result.errors.businessCertificateType).toBeTruthy();
	});

	it('rejects oversized business certificate file', () => {
		const result = validateOrganizationActivation({
			apiKey: 'test-api-key',
			saltKey: 'test-salt-key',
			businessCertificateType: 'Incorporation certificate',
			file: createFile('certificate.pdf', MAX_UPLOAD_FILE_SIZE_BYTES + 1)
		});

		expect(result.valid).toBe(false);
		expect(result.errors.businessCertificate).toContain('maximum size');
	});
});
