export interface VirtualAccount {
	vanId: string;
	vanNumber: string;
	orgId: string;
	merchantName: string;
	status: 'active' | 'inactive';
}

export interface MerchantWithVans {
	orgId: string;
	merchantName: string;
	vans: VirtualAccount[];
}

export interface TransactionScope {
	orgId: string;
	vanId: string;
}
