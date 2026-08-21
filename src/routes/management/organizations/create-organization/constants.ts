import { ArrowDownToLine, ArrowUpFromLine } from '$lib/assets/icons';

export type Mode = 'manual' | 'surepass';
export type ClientType = 'Merchant' | 'Partner' | 'Platform';

export const modeOrder: Record<Mode, number> = { manual: 0, surepass: 1 };

export const modes = {
	manual: {
		icon: '📋',
		title: 'Manual Onboarding',
		description:
			'Fill in organization and compliance details step by step. Suitable for assisted or offline onboarding.',
		cta: 'Start Manual Onboarding',
		gradient: 'from-chart-2/30 via-chart-4/15 to-transparent',
		gradientDark: 'dark:from-chart-2/25 dark:via-chart-4/12 dark:to-transparent',
		border: 'border-chart-2/30 dark:border-chart-2/20',
		ctaClass: 'bg-chart-2 text-white hover:opacity-90 shadow-lg shadow-chart-2/25',
		iconBg: 'bg-chart-2/10 dark:bg-chart-2/20',
		accentText: 'text-chart-2 dark:text-chart-2',
		features: [
			'Step-by-step guided flow',
			'8 compliance stages',
			'Offline-friendly',
			'Assisted onboarding'
		]
	},
	surepass: {
		icon: '⚡',
		title: 'One Stop KYC Onboarding',
		description:
			'Enter your Business PAN and let us auto-fetch and verify your organization data instantly via third-party APIs.',
		cta: 'Start Surepass Onboarding',
		gradient: 'from-primary/30 via-primary/15 to-transparent',
		gradientDark: 'dark:from-primary/25 dark:via-primary/12 dark:to-transparent',
		border: 'border-primary/30 dark:border-primary/20',
		ctaClass: 'bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/25',
		iconBg: 'bg-primary/10 dark:bg-primary/20',
		accentText: 'text-primary',
		features: [
			'Auto-fetch via PAN',
			'Instant KYB/KYC',
			'API-powered verification',
			'Minutes, not days'
		]
	}
} as const;

export const businessTypes = ['Sole Proprietorship', 'Partnership', 'LLP', 'Private Limited'];

export const availableServiceTypes = [
	{
		value: 'Pay-Ins',
		label: 'Collections',
		icon: ArrowDownToLine,
		desc: 'Accept incoming payments'
	},
	{
		value: 'Payouts',
		label: 'Disbursements',
		icon: ArrowUpFromLine,
		desc: 'Disburse outgoing payments'
	}
];

export const availableBankPipelines = [
	{ value: 'HDFC Bank', logo: '🏦' },
	{ value: 'ICICI Bank', logo: '🏛️' },
	{ value: 'SBI', logo: '🏦' },
	{ value: 'Axis Bank', logo: '🏛️' },
	{ value: 'Yes Bank', logo: '🏦' },
	{ value: 'Kotak Mahindra', logo: '🏛️' }
];

export const affiliatesByPipeline: Record<string, { value: string; label: string }[]> = {
	'HDFC Bank': [
		{ value: 'AFF-HD01', label: 'AFF-HD01 – HDFC Merchant Services' },
		{ value: 'AFF-HD02', label: 'AFF-HD02 – HDFC Digital Partner' }
	],
	'ICICI Bank': [
		{ value: 'AFF-IC01', label: 'AFF-IC01 – ICICI eCollect' },
		{ value: 'AFF-IC02', label: 'AFF-IC02 – ICICI MerchantPay' }
	],
	SBI: [
		{ value: 'AFF-SB01', label: 'AFF-SB01 – SBI ePay' },
		{ value: 'AFF-SB02', label: 'AFF-SB02 – SBI NetCollect' }
	],
	'Axis Bank': [
		{ value: 'AFF-AX01', label: 'AFF-AX01 – Axis PG Solutions' },
		{ value: 'AFF-AX02', label: 'AFF-AX02 – Axis Digital Merchant' }
	],
	'Yes Bank': [
		{ value: 'AFF-YB01', label: 'AFF-YB01 – Yes Bank Collect' },
		{ value: 'AFF-YB02', label: 'AFF-YB02 – Yes Business Pay' }
	],
	'Kotak Mahindra': [
		{ value: 'AFF-KM01', label: 'AFF-KM01 – Kotak ePay' },
		{ value: 'AFF-KM02', label: 'AFF-KM02 – Kotak MerchantHub' }
	]
};
