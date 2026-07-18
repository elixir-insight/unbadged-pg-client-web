export interface VirtualAccount {
	vanId: string;
	vanNumber: string;
	orgId: string;
	merchantName: string;
	status: 'active' | 'inactive';
}

export interface TransactionScope {
	orgId: string;
	vanId: string;
}
