import { getContext, setContext } from 'svelte';
import type { BankingDetail, IntegrationDetail, OrgDetail, OrgDocument } from './types';
import { SvelteDate } from 'svelte/reactivity';

const ORGANIZATION_ORG_CTX = Symbol('organization-org');

const DEFAULT_BANKS: BankingDetail[] = [
	{
		id: 'bank-1',
		accountHolder: 'Northwind Capital',
		accountNumber: '•••• •••• 4421',
		bank: 'Pinnacle Trust',
		branch: 'San Francisco Downtown',
		routingIFSC: 'PINTUS33',
		status: 'ACTIVE',
		isPrimary: true
	},
	{
		id: 'bank-2',
		accountHolder: 'Northwind Capital LLC',
		accountNumber: '•••• •••• 8810',
		bank: 'Silicon Valley Bank',
		branch: 'Palo Alto',
		routingIFSC: 'SVBKUS6S',
		status: 'ON_HOLD',
		isPrimary: false
	}
];

export const ORG_DETAIL: OrgDetail = {
	email: 'ops@northwindcapital.com',
	phone: '+1 415 555 0100',
	country: 'United States',
	lastUpdated: '2026-04-30',
	kyb: {
		companyName: 'Cochran Riddle Plc',
		country: 'India',
		state: 'Maharashtra',
		city: 'Mumbai',
		pincode: '400021',
		companyGstNumber: '27AADFC7890K1ZM',
		cinNumber: 'U65990MH2012PTC234567',
		tanNumber: 'MUMR45678B',
		companyPhoneNumber: '9823456701',
		companyUrl: 'https://www.cochranriddle.com',
		businessPan: 'AADFC7890K',
		registeredYear: '2012',
		industry: 'Legal & Consulting Services',
		companyLogo: null,
		address: '15, Nariman Point, Tower B',
		directors: [
			{
				name: 'Priya Cochran',
				aadhaar: '345678901234',
				pan: 'DRTPC4567F',
				email: 'priya.cochran@cochranriddle.com',
				phone: '9823456702'
			}
		]
	},
	contact: {
		name: 'Sarah Chen',
		role: 'Compliance Admin',
		email: 'ops@northwindcapital.com',
		phone: '+1 415 555 0100',
		timezone: 'America/Los_Angeles (UTC-7)'
	},
	banks: DEFAULT_BANKS,
	onboarding: [
		{ label: 'KYB completed', done: true },
		{ label: 'Banking verified', done: true },
		{ label: 'Documents uploaded', done: true },
		{ label: 'Compliance reviewed', done: false }
	],
	documents: [
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
	]
};

export class OrganizationOrgState {
	banks = $state<BankingDetail[]>([...DEFAULT_BANKS]);
	documents = $state<OrgDocument[]>([...ORG_DETAIL.documents]);
	integration = $state<IntegrationDetail>({
		callbackUrl: 'https://api.northwindcapital.com/webhooks/payments',
		ipAddress: '203.0.113.10'
	});
	orgStatusOverride = $state<string | null>(null);
	baseStatus = $state('');
	agreementFile = $state<File | null>(null);
	showStatusConfirmModal = $state(false);
	pendingStatusChange = $state<string | null>(null);
	statusChangeSelection = $state<string | undefined>(undefined);

	readonly detail = ORG_DETAIL;

	readonly effectiveStatus = $derived(this.orgStatusOverride ?? this.baseStatus);

	readonly agreementUploaded = $derived(this.agreementFile !== null);

	syncAgreementDocument(file: File | null) {
		this.agreementFile = file;

		const withoutAgreement = this.documents.filter((doc) => doc.type !== 'Agreement');
		if (!file) {
			this.documents = withoutAgreement;
			return;
		}

		const agreementDoc: OrgDocument = {
			name: file.name,
			type: 'Agreement',
			uploadedDate: new SvelteDate().toLocaleDateString('en-GB', {
				day: 'numeric',
				month: 'short',
				year: 'numeric'
			}),
			status: 'In Review'
		};

		this.documents = [...withoutAgreement, agreementDoc];
	}

	addBank(bank: Omit<BankingDetail, 'id'>) {
		this.banks.push({ id: `bank-${Date.now()}`, ...bank });
	}

	editBank(bank: BankingDetail) {
		const index = this.banks.findIndex((b) => b.id === bank.id);
		if (index !== -1) this.banks[index] = bank;
	}

	async confirmActivate(): Promise<void> {
		await new Promise<void>((res) => setTimeout(res, 800));
		this.orgStatusOverride = 'ACTIVE';
	}

	requestStatusChange(status: string) {
		this.pendingStatusChange = status;
		this.showStatusConfirmModal = true;
	}

	confirmStatusChange() {
		if (!this.pendingStatusChange) return;
		this.orgStatusOverride = this.pendingStatusChange;
		this.showStatusConfirmModal = false;
	}

	cancelStatusChange() {
		this.showStatusConfirmModal = false;
	}

	resetStatusModal() {
		this.statusChangeSelection = undefined;
		this.pendingStatusChange = null;
	}
}

export function setOrganizationOrgContext(state: OrganizationOrgState) {
	setContext(ORGANIZATION_ORG_CTX, state);
}

export function getOrganizationOrgContext(): OrganizationOrgState {
	return getContext<OrganizationOrgState>(ORGANIZATION_ORG_CTX);
}
