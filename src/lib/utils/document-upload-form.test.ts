import { describe, expect, it } from 'vitest';
import { buildDocumentFormState, fileFromDocumentName } from './document-upload-form';

describe('document-upload-form', () => {
	it('creates files from saved document names', () => {
		const file = fileFromDocumentName('Certificate of Incorporation.pdf', 1024);
		expect(file.name).toBe('Certificate of Incorporation.pdf');
		expect(file.type).toBe('application/pdf');
	});

	it('binds saved organization documents into edit form state', () => {
		const state = buildDocumentFormState(
			[
				{
					name: 'Certificate of Incorporation.pdf',
					type: 'Incorporation',
					uploadedDate: '12 May 2026',
					status: 'Approved'
				},
				{
					name: 'Tax Registration.pdf',
					type: 'Tax',
					uploadedDate: '12 May 2026',
					status: 'Approved'
				},
				{
					name: 'Director ID.png',
					type: 'ID Proof',
					uploadedDate: '13 May 2026',
					status: 'In Review'
				},
				{
					name: 'Bank Statement.pdf',
					type: 'Bank Proof',
					uploadedDate: '14 May 2026',
					status: 'Approved'
				}
			],
			[{ id: 1, name: 'Priya Cochran' }]
		);

		expect(state.docFiles.bizCert?.name).toBe('Certificate of Incorporation.pdf');
		expect(state.docFiles.gstCert?.name).toBe('Tax Registration.pdf');
		expect(state.docFiles.proofOfFunds?.name).toBe('Bank Statement.pdf');
		expect(state.directorDocFiles[1]?.aadhaar?.name).toBe('Director ID.png');
		expect(state.bizCertType).toBe('incorporation_certificate');
		expect(state.proofOfFundsType).toBe('last_3_months_bank_statements');
	});
});
