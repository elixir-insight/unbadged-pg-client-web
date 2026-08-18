import { describe, expect, it } from 'vitest';
import { createOrganizationShell } from '$lib/data/mockData';
import { mapDirectorDocumentsResponse, mapGetDocumentsResponse } from './get-documents';
import type { OrganizationDocumentRecord } from '../../schema';

function record(
	overrides: Partial<OrganizationDocumentRecord> & Pick<OrganizationDocumentRecord, 'fileName'>
): OrganizationDocumentRecord {
	return {
		id: 1,
		fileType: 'image/png',
		fileSize: 100,
		createdAt: '2026-07-16T01:38:17.609039+05:30',
		preSignedUrl: 'http://localhost:9000/test-bucket/10003/onboarding/203324328849309696.png',
		...overrides
	};
}

describe('mapGetDocumentsResponse', () => {
	it('maps organization documents by backend file name', () => {
		const organization = createOrganizationShell({ id: 'org_2bL' });
		const { documents } = mapGetDocumentsResponse(
			[record({ id: 10, fileName: 'gstCertificate' })],
			organization
		);

		const gst = documents.find((document) => document.documentType === 'GST certificate');
		expect(gst).toMatchObject({
			id: '10',
			status: 'Uploaded',
			uploadedDate: '2026-07-16',
			fileName: '203324328849309696.png',
			previewUrl: record({ fileName: 'gstCertificate' }).preSignedUrl,
			fileType: 'image/png'
		});
	});

	it('maps brand logo as a required organization document', () => {
		const organization = createOrganizationShell({ id: 'org_2bL', category: 'PARTNER' });
		const { documents } = mapGetDocumentsResponse(
			[record({ id: 12, fileName: 'brandLogo' })],
			organization
		);

		const brandLogo = documents.find((document) => document.documentType === 'Brand logo');
		expect(brandLogo).toMatchObject({
			id: '12',
			status: 'Uploaded'
		});
		expect(brandLogo?.optional).not.toBe(true);
	});

	it('marks organization logo as optional', () => {
		const organization = createOrganizationShell({ id: 'org_2bL' });
		const { documents } = mapGetDocumentsResponse(
			[record({ id: 11, fileName: 'orgLogo' })],
			organization
		);

		expect(
			documents.find((document) => document.documentType === 'Organization logo')?.optional
		).toBe(true);
	});

	it('maps director documents using the DIRECTOR prefix', () => {
		const organization = createOrganizationShell({ id: 'org_2bL' });
		organization.directors = [
			{
				id: 'director-1',
				name: 'Jane Doe',
				pan: 'ABCDE1234F',
				email: 'jane@example.com',
				phone: '9999999999',
				aadhar: '234567890123',
				aadharDocument: {
					id: 'aadhar-pending',
					fileName: '',
					status: 'Pending'
				},
				panDocument: {
					id: 'pan-pending',
					fileName: '',
					status: 'Pending'
				}
			}
		];

		const { directors } = mapGetDocumentsResponse(
			[
				record({ id: 20, fileName: 'DIRECTOR_DIRECTOR-1_aadharCard' }),
				record({ id: 21, fileName: 'DIRECTOR_DIRECTOR-1_panCard' })
			],
			organization
		);

		expect(directors[0]?.aadharDocument).toMatchObject({ id: '20', status: 'Uploaded' });
		expect(directors[0]?.panDocument).toMatchObject({ id: '21', status: 'Uploaded' });
	});

	it('assigns bare director file names to the first pending director slot', () => {
		const organization = createOrganizationShell({ id: 'org_2bL' });
		organization.directors = [
			{
				id: 'director-1',
				name: 'Jane Doe',
				pan: 'ABCDE1234F',
				email: 'jane@example.com',
				phone: '9999999999',
				aadhar: '234567890123',
				aadharDocument: {
					id: 'aadhar-pending',
					fileName: '',
					status: 'Pending'
				},
				panDocument: {
					id: 'pan-pending',
					fileName: '',
					status: 'Pending'
				}
			}
		];

		const { directors } = mapGetDocumentsResponse(
			[record({ id: 30, fileName: 'aadharCard' })],
			organization
		);

		expect(directors[0]?.aadharDocument).toMatchObject({ id: '30', status: 'Uploaded' });
	});
});

describe('mapDirectorDocumentsResponse', () => {
	const director = {
		id: '7',
		name: 'Priya Nair',
		pan: 'ABCDE1234F',
		email: 'priya@example.com',
		phone: '+919876543210',
		aadhar: '234567890123',
		aadharDocument: {
			id: 'aadhar-pending',
			fileName: '',
			status: 'Pending' as const
		},
		panDocument: {
			id: 'pan-pending',
			fileName: '',
			status: 'Pending' as const
		}
	};

	it('maps GET director documents using documentId and upload field names', () => {
		const mapped = mapDirectorDocumentsResponse(
			[
				{
					documentId: 101,
					fileName: 'aadhar',
					fileType: 'application/pdf',
					fileSize: 2048,
					createdAt: '2026-07-16T01:38:17.609039+05:30',
					preSignedUrl: 'http://localhost:9000/test-bucket/aadhar.pdf'
				},
				{
					documentId: 102,
					fileName: 'pan',
					fileType: 'image/png',
					fileSize: 1024,
					createdAt: '2026-07-16T02:10:00.000000+05:30',
					preSignedUrl: 'http://localhost:9000/test-bucket/pan.png'
				}
			],
			director
		);

		expect(mapped.aadharDocument).toMatchObject({
			id: '101',
			status: 'Uploaded',
			uploadedDate: '2026-07-16',
			fileType: 'application/pdf'
		});
		expect(mapped.panDocument).toMatchObject({
			id: '102',
			status: 'Uploaded',
			uploadedDate: '2026-07-16',
			fileType: 'image/png'
		});
	});

	it('ignores records without documentId or id', () => {
		const mapped = mapDirectorDocumentsResponse(
			[{ fileName: 'aadhar', fileType: 'application/pdf' }],
			director
		);

		expect(mapped.aadharDocument.status).toBe('Pending');
	});
});
