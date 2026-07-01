import { getContext, setContext } from 'svelte';
import { SvelteDate } from 'svelte/reactivity';
import {
	getMerchantById,
	getMerchantsByPartnerId,
	getMostRecentActionableRecord,
	getPartnerById,
	getRecordsByMerchantId,
	type Merchant,
	type Partner,
	type SettlementRecord,
	type SettlementStatus
} from '$lib/data/partnerSettlementsDummyData';
import { RECORDS_PAGE_SIZE } from './settlements-shared';

const SETTLEMENTS_CONTEXT_KEY = Symbol('settlements');

export type SettlementsViewMode = 'quick' | 'full';
export type DrawerMode = 'add' | 'settle' | 'edit';

export class SettlementsStore {
	selectedPartnerId = $state<string | null>(null);
	selectedMerchantId = $state<string | null>(null);
	viewMode = $state<SettlementsViewMode>('quick');
	statusFilter = $state<SettlementStatus | 'all'>('all');
	fromDate = $state('');
	toDate = $state('');
	pageNumber = $state(1);
	drawerOpen = $state(false);
	drawerMode = $state<DrawerMode>('add');
	drawerRecordId = $state<string | null>(null);
	entriesRevision = $state(0);

	notifyEntriesChanged() {
		this.entriesRevision += 1;
	}

	readonly selectedPartner = $derived.by((): Partner | null => {
		if (!this.selectedPartnerId) return null;
		return getPartnerById(this.selectedPartnerId) ?? null;
	});

	readonly partnerMerchants = $derived.by((): Merchant[] => {
		if (!this.selectedPartnerId) return [];
		return getMerchantsByPartnerId(this.selectedPartnerId);
	});

	readonly selectedMerchant = $derived.by((): Merchant | null => {
		if (!this.selectedMerchantId) return null;
		return getMerchantById(this.selectedMerchantId) ?? null;
	});

	readonly recentRecords = $derived.by((): SettlementRecord[] => {
		void this.entriesRevision;
		if (!this.selectedMerchantId) return [];
		return getRecordsByMerchantId(this.selectedMerchantId).slice(0, 5);
	});

	readonly filteredRecords = $derived.by((): SettlementRecord[] => {
		void this.entriesRevision;
		if (!this.selectedMerchantId) return [];

		return getRecordsByMerchantId(this.selectedMerchantId).filter((record) => {
			if (this.statusFilter !== 'all' && record.status !== this.statusFilter) return false;

			const recordTime = new SvelteDate(record.date).getTime();
			if (this.fromDate) {
				const from = new SvelteDate(this.fromDate).getTime();
				if (recordTime < from) return false;
			}
			if (this.toDate) {
				const to = new SvelteDate(this.toDate).getTime();
				if (recordTime > to) return false;
			}

			return true;
		});
	});

	readonly totalPages = $derived(
		Math.max(1, Math.ceil(this.filteredRecords.length / RECORDS_PAGE_SIZE))
	);

	readonly paginatedRecords = $derived.by((): SettlementRecord[] => {
		const start = (this.pageNumber - 1) * RECORDS_PAGE_SIZE;
		return this.filteredRecords.slice(start, start + RECORDS_PAGE_SIZE);
	});

	readonly actionableRecord = $derived.by((): SettlementRecord | undefined => {
		void this.entriesRevision;
		if (!this.selectedMerchantId) return undefined;
		return getMostRecentActionableRecord(this.selectedMerchantId);
	});

	selectPartner(partnerId: string | null) {
		this.selectedPartnerId = partnerId;
		this.viewMode = 'quick';
		this.resetFilters();

		if (!partnerId) {
			this.selectedMerchantId = null;
			return;
		}

		const merchants = getMerchantsByPartnerId(partnerId);
		this.selectedMerchantId = merchants[0]?.id ?? null;
	}

	selectMerchant(merchantId: string | null) {
		this.selectedMerchantId = merchantId;
		this.viewMode = 'quick';
		this.resetFilters();
	}

	showFullHistory() {
		this.viewMode = 'full';
		this.pageNumber = 1;
	}

	showQuickView() {
		this.viewMode = 'quick';
	}

	setStatusFilter(filter: SettlementStatus | 'all') {
		this.statusFilter = filter;
		this.pageNumber = 1;
	}

	setFromDate(value: string) {
		this.fromDate = value;
		this.pageNumber = 1;
	}

	setToDate(value: string) {
		this.toDate = value;
		this.pageNumber = 1;
	}

	setPage(page: number) {
		this.pageNumber = page;
	}

	openAddEntryDrawer() {
		const record = this.actionableRecord;
		if (!record) return;
		this.drawerMode = 'add';
		this.drawerRecordId = record.id;
		this.drawerOpen = true;
	}

	openRecordDrawer(record: SettlementRecord, mode: DrawerMode) {
		this.drawerMode = mode;
		this.drawerRecordId = record.id;
		this.drawerOpen = true;
	}

	closeDrawer() {
		this.drawerOpen = false;
	}

	private resetFilters() {
		this.statusFilter = 'all';
		this.fromDate = '';
		this.toDate = '';
		this.pageNumber = 1;
	}
}

export function createSettlementsStore(): SettlementsStore {
	return new SettlementsStore();
}

export function setSettlementsStore(store: SettlementsStore) {
	setContext(SETTLEMENTS_CONTEXT_KEY, store);
}

export function getSettlementsStore(): SettlementsStore {
	return getContext<SettlementsStore>(SETTLEMENTS_CONTEXT_KEY);
}
