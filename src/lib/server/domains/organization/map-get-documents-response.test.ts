import { describe, expect, it } from 'vitest';
import { createOrganizationShell } from '$lib/data/mockData';
import { mapGetDocumentsResponse } from './map-get-documents-response';
import type { OrganizationDocumentRecord } from './schema';

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
				designation: 'Director',
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
				designation: 'Director',
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
