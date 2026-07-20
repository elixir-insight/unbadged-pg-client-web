<script module lang="ts">
	export interface VirtualAccountSummary {
		label: string;
		accountNumber: string;
		balance: string;
		tone: 'primary' | 'info' | 'success';
	}
</script>

<script lang="ts">
	import { resolve } from '$app/paths';
	import { ArrowRight, TrendingUp } from '$lib/assets/icons';
	import { cn } from '$lib/utils';

	interface Props {
		accounts: VirtualAccountSummary[];
		activeAccounts: number;
		pendingKyc: number;
		totalBalance: string;
		balanceChangeLabel?: string;
		class?: string;
	}

	let {
		accounts,
		activeAccounts,
		pendingKyc,
		totalBalance,
		balanceChangeLabel = '+32.8%',
		class: className
	}: Props = $props();

	const toneClasses: Record<VirtualAccountSummary['tone'], string> = {
		primary: 'bg-chart-1 text-white',
		info: 'bg-chart-2 text-white',
		success: 'bg-chart-3 text-white'
	};
</script>

<div
	class={cn(
		'flex h-full flex-col rounded-lg border border-border bg-background p-4 shadow-xs',
		className
	)}
>
	<div class="flex shrink-0 items-center justify-between">
		<p class="text-sm font-semibold">Virtual accounts</p>
		<a
			href={resolve('/merchant/funds')}
			class="flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
		>
			View all
			<ArrowRight class="size-3" />
		</a>
	</div>

	<!-- Wallet: VA cards fan out and peek from behind the balance pocket, Apple-Wallet style. -->
	<div class="relative mt-3 flex min-h-0 flex-1 flex-col pb-3">
		{#each accounts as account, i (account.accountNumber)}
			<div
				class={cn(
					'relative flex flex-1 items-center justify-between rounded-t-xl px-3 shadow-[0_-4px_10px_rgba(0,0,0,0.08)]',
					toneClasses[account.tone]
				)}
				style="margin-top: {i === 0 ? '0px' : '-6px'}; z-index: {i + 1};"
			>
				<span class="truncate text-[11px] font-medium opacity-90">{account.label}</span>
				<span class="truncate text-xs font-semibold">{account.balance}</span>
			</div>
		{/each}

		<div
			class="relative flex min-h-0 flex-[2.5] flex-col justify-center gap-2 rounded-2xl border border-border bg-muted p-3 pb-4 shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
			style="margin-top: -14px; z-index: {accounts.length +
				1}; mask-image: radial-gradient(circle 10px at 50% 0, transparent 10px, black 10.5px); -webkit-mask-image: radial-gradient(circle 10px at 50% 0, transparent 10px, black 10.5px);"
		>
			<p class="truncate text-[10px] font-medium text-muted-foreground">
				{accounts.length} cards · {activeAccounts} active · {pendingKyc} pending KYC
			</p>

			<div>
				<p class="flex items-center gap-1 text-[11px] text-muted-foreground">
					Wallet balance
					<span
						class="flex items-center gap-0.5 font-medium text-emerald-500 dark:text-emerald-400"
					>
						<TrendingUp class="size-3" />
						{balanceChangeLabel}
					</span>
				</p>
				<p class="mt-1 truncate text-lg font-bold tracking-tight text-foreground">{totalBalance}</p>
			</div>
		</div>
	</div>
</div>
