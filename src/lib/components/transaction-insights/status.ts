import type { BadgeVariant } from '$lib/components/ui/badge';
import type { InsightsMerchantStatus } from './types';

export const INSIGHTS_STATUS_LABEL: Record<InsightsMerchantStatus, string> = {
	active: 'Active',
	frozen: 'Frozen',
	hold: 'Hold'
};

export const INSIGHTS_STATUS_VARIANT: Record<InsightsMerchantStatus, BadgeVariant> = {
	active: 'success',
	frozen: 'destructive',
	hold: 'secondary'
};

export const INSIGHTS_STATUS_OPTIONS = [
	{ value: 'active', label: 'Active' },
	{ value: 'frozen', label: 'Frozen' },
	{ value: 'hold', label: 'Hold' }
] as const;
