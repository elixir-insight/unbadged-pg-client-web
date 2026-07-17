<script module lang="ts">
	export interface RecentPayment {
		name: string;
		method: string;
		time: string;
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
		'flex h-full min-h-0 flex-col rounded-lg border border-border bg-background p-4 shadow-xs',
		className
	)}
>
	<div class="mb-3 flex shrink-0 items-center justify-between">
		<p class="text-sm font-semibold">Recent transactions</p>
		<a
			href={resolve('/merchant/transactions')}
			class="flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
		>
			View all
			<ArrowRight class="size-3" />
		</a>
	</div>

	<div class="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
		{#each payments.slice(0, 6) as payment, i (payment.name)}
			<div
				class={cn(
					'flex shrink-0 items-center gap-2.5 py-1',
					i < Math.min(payments.length, 6) - 1 && 'border-b border-border/60'
				)}
			>
				<span
					class="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground"
				>
					{initials(payment.name)}
				</span>
				<div class="min-w-0 flex-1">
					<p class="truncate text-sm leading-tight font-semibold">{payment.name}</p>
					<p class="truncate text-xs leading-tight text-muted-foreground">
						{payment.method} · {payment.time}
					</p>
				</div>
				<div class="flex shrink-0 flex-col items-end gap-0.5">
					<span class="text-sm font-semibold tabular-nums">{payment.amount}</span>
					<Chip variant={statusVariant[payment.status]}>
						{statusLabel[payment.status]}
					</Chip>
				</div>
			</div>
		{/each}
	</div>
</div>
