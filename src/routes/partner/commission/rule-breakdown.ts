import type { RuleBreakdownRow } from './types';

type SlabDefinition = {
	upTo: number | null;
	ratePercent: number;
};

/** Per-merchant slab rates — TEMP until commission-rules API exists. */
const MERCHANT_SLAB_RULES: Record<string, SlabDefinition[]> = {
	'MRC-10021': [
		{ upTo: 1_000_000, ratePercent: 0.25 },
		{ upTo: 5_000_000, ratePercent: 0.4 },
		{ upTo: null, ratePercent: 0.55 }
	],
	'MRC-10034': [
		{ upTo: 750_000, ratePercent: 0.2 },
		{ upTo: 3_000_000, ratePercent: 0.35 },
		{ upTo: null, ratePercent: 0.48 }
	],
	'MRC-10052': [
		{ upTo: 2_000_000, ratePercent: 0.3 },
		{ upTo: 8_000_000, ratePercent: 0.45 },
		{ upTo: null, ratePercent: 0.6 }
	],
	'MRC-10089': [
		{ upTo: 500_000, ratePercent: 0.22 },
		{ upTo: 2_500_000, ratePercent: 0.38 },
		{ upTo: null, ratePercent: 0.5 }
	],
	'MRC-10102': [
		{ upTo: 1_500_000, ratePercent: 0.28 },
		{ upTo: 6_000_000, ratePercent: 0.42 },
		{ upTo: null, ratePercent: 0.58 }
	],
	'MRC-10115': [
		{ upTo: 900_000, ratePercent: 0.24 },
		{ upTo: 4_000_000, ratePercent: 0.39 },
		{ upTo: null, ratePercent: 0.52 }
	],
	'MRC-10139': [
		{ upTo: 1_200_000, ratePercent: 0.26 },
		{ upTo: 5_500_000, ratePercent: 0.41 },
		{ upTo: null, ratePercent: 0.54 }
	],
	'MRC-10235': [
		{ upTo: 800_000, ratePercent: 0.23 },
		{ upTo: 3_500_000, ratePercent: 0.37 },
		{ upTo: null, ratePercent: 0.49 }
	]
};

const DEFAULT_SLAB_RULES: SlabDefinition[] = [
	{ upTo: 500_000, ratePercent: 0.2 },
	{ upTo: 2_000_000, ratePercent: 0.35 },
	{ upTo: null, ratePercent: 0.5 }
];

const currency = new Intl.NumberFormat('en-IN', {
	style: 'currency',
	currency: 'INR',
	maximumFractionDigits: 0
});

function formatSlabLabel(from: number, to: number | null) {
	if (to === null) return `Above ${currency.format(from)}`;
	return `${currency.format(from + 1)} – ${currency.format(to)}`;
}

/** Splits volume across tiered slabs using hardcoded per-merchant rates. */
export function getRuleBreakdown(merchantId: string, volume: number): RuleBreakdownRow[] {
	if (volume <= 0) return [];

	const slabs = MERCHANT_SLAB_RULES[merchantId] ?? DEFAULT_SLAB_RULES;
	let remaining = volume;
	let previousCap = 0;
	const rows: RuleBreakdownRow[] = [];

	for (const slab of slabs) {
		const cap = slab.upTo ?? Number.POSITIVE_INFINITY;
		const slabCapacity = cap - previousCap;
		const volumeInSlab = Math.min(remaining, slabCapacity);

		if (volumeInSlab <= 0) break;

		rows.push({
			slabLabel: formatSlabLabel(previousCap, slab.upTo),
			ratePercent: slab.ratePercent,
			volume: volumeInSlab,
			commission: Math.round((volumeInSlab * slab.ratePercent) / 100)
		});

		remaining -= volumeInSlab;
		previousCap = cap;

		if (remaining <= 0) break;
	}

	return rows;
}
