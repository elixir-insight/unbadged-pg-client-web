<script module lang="ts">
	export interface RecentPayment {
		name: string;
		amount: string;
		status: 'success' | 'pending' | 'failed';
	}
</script>

<script lang="ts">
	import { resolve } from '$app/paths';
	import Chip from '../reusable/chip/chip.svelte';
	import { ArrowRight } from '$lib/assets/icons';
	import { cn } from '$lib/utils';
	import type { BadgeVariant } from '$lib/components/ui/badge/badge.svelte';

	interface Props {
		payments: RecentPayment[];
		class?: string;
	}

	let { payments, class: className }: Props = $props();

	const statusVariant: Record<RecentPayment['status'], BadgeVariant> = {
		success: 'success',
		pending: 'warning',
		failed: 'error'
	};

	const statusLabel: Record<RecentPayment['status'], string> = {
		success: 'Success',
		pending: 'Pending',
		failed: 'Failed'
	};

	function initials(name: string) {
		return name
			.split(' ')
			.map((part) => part[0])
			.join('')
			.slice(0, 2)
			.toUpperCase();
	}
</script>

<div
	class={cn(
		'flex h-full flex-col rounded-lg border border-border bg-background p-4 shadow-xs',
		className
	)}
>
	<div class="flex items-center justify-between">
		<p class="text-sm font-semibold">Recent transactions</p>
		<a
			href={resolve('/merchant/transactions')}
			class="flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
		>
			View all
			<ArrowRight class="size-3" />
		</a>
	</div>

	<div class="flex flex-1 flex-col justify-between">
		{#each payments as payment (payment.name)}
			<div class="flex items-center gap-2.5 py-1">
				<span
					class="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold"
				>
					{initials(payment.name)}
				</span>
				<span class="min-w-0 flex-1 truncate text-sm font-medium">{payment.name}</span>
				<span class="shrink-0 text-sm font-semibold">{payment.amount}</span>
				<Chip variant={statusVariant[payment.status]} class="shrink-0">
					{statusLabel[payment.status]}
				</Chip>
			</div>
		{/each}
	</div>
</div>
