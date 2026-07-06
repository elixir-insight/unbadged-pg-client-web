import type { ReviewSection } from '$lib/types/review';
import type { Organization } from '$lib/data/mockData';

export function getReviewSections(org: Organization): ReviewSection[] {
	return [
		{
			id: 'overview',
			label: 'Overview',
			subLabel: 'Snapshot',
			icon: 'clipboard-check',
			status: 'IN_REVIEW',
			systemFlags: [
				{
					field: 'legalName',
					checkName: 'Registry Check',
					message: `Legal name doesn't match business registry. Registry record shows '${org.name} Ltd.'`,
					severity: 'error'
				},
				{
					field: 'country',
					checkName: 'Sanctions Screening',
					message: 'Sanctions screening pending for this region. Manual verification required.',
					severity: 'warning'
				},
				{
					field: 'email',
					checkName: 'Domain Age Check',
					message:
						'Domain registered less than 30 days ago. May indicate a recently created entity.',
					severity: 'warning'
				}
			],
			unresolvedCount: 3,
			fields: [
				{
					key: 'legalName',
					label: 'Legal Name',
					value: org.name,
					systemFlag: {
						field: 'legalName',
						checkName: 'Registry Check',
						message: `Name doesn't match business registry. Registry shows '${org.name} Ltd.'`,
						severity: 'error'
					},
					reviewerNote: {
						field: 'legalName',
						reviewerName: org.assignedAdmin,
						reviewerInitials: org.assignedAdmin
							.split(' ')
							.map((w) => w[0])
							.join(''),
						timestamp: `${org.createdAt} · 10:42 AM`,
						note: 'Confirmed with applicant — they operate under a trading name. Registered entity name differs. Acceptable per onboarding policy §3.2.'
					}
				},
				{
					key: 'profileType',
					label: 'Profile Type',
					value: org.profileType
				},
				{
					key: 'businessType',
					label: 'Business Type',
					value: org.businessType
				},
				{
					key: 'country',
					label: 'Country',
					value: 'United States',
					systemFlag: {
						field: 'country',
						checkName: 'Sanctions Screening',
						message: 'Sanctions screening pending for this region. Manual verification required.',
						severity: 'warning'
					}
				},
				{
					key: 'email',
					label: 'Email',
					value: `ops@${org.name.toLowerCase().replace(/\s+/g, '')}.com`,
					systemFlag: {
						field: 'email',
						checkName: 'Domain Age Check',
						message:
							'Domain registered less than 30 days ago. May indicate a recently created entity.',
						severity: 'warning'
					}
				},
				{
					key: 'phone',
					label: 'Phone',
					value: '+1 415 555 0101'
				},
				{
					key: 'submittedOn',
					label: 'Submitted On',
					value: org.createdAt
				},
				{
					key: 'assignedReviewer',
					label: 'Assigned Reviewer',
					value: org.assignedAdmin
				}
			]
		},
		{
			id: 'kyb',
			label: 'KYB',
			subLabel: 'Business verification',
			icon: 'shield-check',
			status: 'IN_REVIEW',
			systemFlags: [
				{
					field: 'regNumber',
					checkName: 'CIN Validation',
					message: 'Registration number could not be validated against MCA records.',
					severity: 'error'
				}
			],
			unresolvedCount: 1,
			fields: [
				{
					key: 'regNumber',
					label: 'Company Reg. Number',
					value: 'CIN-2024-080142',
					systemFlag: {
						field: 'regNumber',
						checkName: 'CIN Validation',
						message: 'Registration number could not be validated against MCA records.',
						severity: 'error'
					}
				},
				{
					key: 'gst',
					label: 'GST / VAT Number',
					value: '29ABCDE1234F1Z5'
				},
				{
					key: 'director',
					label: 'Director Name',
					value: 'James Crawford'
				},
				{
					key: 'pan',
					label: 'Director PAN',
					value: 'ABCDE1234F'
				},
				{
					key: 'incorporation',
					label: 'Date of Incorporation',
					value: '2019-08-15'
				},
				{
					key: 'address',
					label: 'Registered Address',
					value: '412 Commerce Blvd, San Francisco, CA 94105'
				}
			]
		},
		{
			id: 'bank',
			label: 'Bank Account',
			subLabel: 'Banking details',
			icon: 'credit-card',
			status: 'APPROVED',
			systemFlags: [],
			unresolvedCount: 0,
			fields: [
				{
					key: 'accountHolder',
					label: 'Account Holder',
					value: `${org.name} Inc.`
				},
				{
					key: 'bankName',
					label: 'Bank Name',
					value: 'Wells Fargo'
				},
				{
					key: 'accountNumber',
					label: 'Account Number',
					value: '****4521'
				},
				{
					key: 'swift',
					label: 'SWIFT / IFSC',
					value: 'WFBIUS6S'
				},
				{
					key: 'accountType',
					label: 'Account Type',
					value: 'Current'
				}
			]
		},
		{
			id: 'documents',
			label: 'Documents',
			subLabel: 'Uploaded files',
			icon: 'file-text',
			status: 'IN_REVIEW',
			systemFlags: [],
			unresolvedCount: 1,
			fields: [
				{
					key: 'coi',
					label: 'Certificate of Incorporation',
					value: 'cert-of-incorporation.pdf'
				},
				{
					key: 'gstCert',
					label: 'GST Certificate',
					value: 'gst-certificate.pdf'
				},
				{
					key: 'directorId',
					label: 'Director ID',
					value: 'Not uploaded'
				},
				{
					key: 'bankStatement',
					label: 'Bank Statement',
					value: 'bank-statement-q1.pdf'
				}
			]
		},
		{
			id: 'integration',
			label: 'Integration',
			subLabel: 'API & webhooks',
			icon: 'plug',
			status: 'IN_REVIEW',
			systemFlags: [],
			unresolvedCount: 0,
			fields: [
				{
					key: 'callbackUrl',
					label: 'Callback URL',
					value: `https://api.${org.name.toLowerCase().replace(/\s+/g, '')}.com/payments/callback`
				},
				{
					key: 'ipWhitelist',
					label: 'IP Whitelist',
					value: '203.0.113.42, 198.51.100.7'
				}
			]
		}
	];
}
