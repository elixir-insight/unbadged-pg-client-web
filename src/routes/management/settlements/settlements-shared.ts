import type { SettlementStatus } from '$lib/data/partnerSettlementsDummyData';

export const RECORDS_PAGE_SIZE = 8;

export type RecordRowAction = 'settle' | 'edit' | 'view';

export function getRecordRowAction(status: SettlementStatus): RecordRowAction {
	if (status === 'unsettled' || status === 'partial') return 'settle';
	if (status === 'adjusted') return 'edit';
	return 'view';
}

export function getRecordActionLabel(action: RecordRowAction): string {
	switch (action) {
		case 'settle':
			return 'Settle';
		case 'edit':
			return 'Edit';
		case 'view':
			return 'View history';
	}
}
