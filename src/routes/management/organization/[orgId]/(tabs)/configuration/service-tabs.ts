import { ArrowDownToLine, ArrowUpFromLine } from '$lib/assets/icons';
import type { Component } from 'svelte';

export type ConfigServiceTabKey = 'payin' | 'payout';

export interface ConfigServiceTab {
	key: ConfigServiceTabKey;
	label: string;
	icon: Component;
}

export const CONFIG_SERVICE_TABS: ConfigServiceTab[] = [
	{ key: 'payin', label: 'Payin', icon: ArrowDownToLine },
	{ key: 'payout', label: 'Payout', icon: ArrowUpFromLine }
];
