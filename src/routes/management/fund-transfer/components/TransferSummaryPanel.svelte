<script lang="ts">
	import type { TransferSummary } from '../types';
	import { formatInr, maskAccountNumber } from '../types';
	import { getFeatureIcon } from '../utils/icons';
	import * as Card from '$lib/components/ui/card';
	import { Chip as Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar';
	import { cn } from '$lib/utils';

	let {
		summary,
		variant = 'default'
	}: {
		summary: TransferSummary;
		variant?: 'default' | 'primary';
	} = $props();

	const isPrimary = $derived(variant === 'primary');

	const statusVariant = $derived(
		summary.status === 'success'
			? 'default'
			: summary.status === 'failed'
				? 'destructive'
				: summary.status === 'processing'
					? 'secondary'
					: 'outline'
	);

	const statusLabel = $derived(
		summary.status === 'success'
			? 'Completed'
			: summary.status === 'failed'
				? 'Failed'
				: summary.status === 'processing'
					? 'Processing'
					: summary.status === 'pending'
						? 'Pending'
						: 'Draft'
	);

	const accountIcon = $derived(
		summary.fromAccount ? getFeatureIcon(summary.fromAccount.icon) : getFeatureIcon('wallet')
	);
</script>

<Card.Root class={cn(isPrimary && 'border-primary bg-primary text-primary-foreground')}>
	<Card.Header>
		<Card.Title class={cn(isPrimary && 'text-primary-foreground')}>Transfer summary</Card.Title>
		<Card.Description class={cn(isPrimary && 'text-primary-foreground/70')}>
			Overview of this payout
		</Card.Description>
	</Card.Header>
	<Card.Content class="space-y-4">
		<div class="flex items-center justify-between gap-3">
			<div>
				<p
					class={cn('text-xs', isPrimary ? 'text-primary-foreground/70' : 'text-muted-foreground')}
				>
					Amount
				</p>
				<p class="text-2xl font-semibold">{formatInr(summary.amount)}</p>
			</div>
			<Badge
				variant={isPrimary ? 'secondary' : statusVariant}
				class={cn(isPrimary && 'bg-primary-foreground/15 text-primary-foreground')}
			>
				{statusLabel}
			</Badge>
		</div>

		<Separator class={cn(isPrimary && 'bg-primary-foreground/20')} />

		<div class="grid gap-3 text-sm">
			<div class="flex items-start justify-between gap-3">
				<span class={cn(isPrimary ? 'text-primary-foreground/70' : 'text-muted-foreground')}
					>From</span
				>
				{#if summary.fromAccount}
					{@const Icon = accountIcon}
					<span class="flex items-center gap-2 text-right font-medium">
						<span
							class={cn(
								'flex size-7 items-center justify-center rounded-md',
								isPrimary
									? 'bg-primary-foreground/15 text-primary-foreground'
									: 'bg-accent text-accent-foreground'
							)}
						>
							<Icon class="size-3.5" />
						</span>
						<span>
							{summary.fromAccount.name}
							<span
								class={cn(
									'block text-xs font-normal',
									isPrimary ? 'text-primary-foreground/70' : 'text-muted-foreground'
								)}
							>
								{maskAccountNumber(summary.fromAccount.accountNumber)}
							</span>
						</span>
					</span>
				{:else}
					<span>—</span>
				{/if}
			</div>

			<div class="flex items-center justify-between gap-3">
				<span class={cn(isPrimary ? 'text-primary-foreground/70' : 'text-muted-foreground')}
					>Method</span
				>
				<span class="font-medium">{summary.method?.label ?? '—'}</span>
			</div>

			<div class="flex items-center justify-between gap-3">
				<span class={cn(isPrimary ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
					Beneficiary
				</span>
				<span class="text-right font-medium">
					{summary.beneficiary.name || '—'}
					{#if summary.method?.id === 'UPI'}
						<span
							class={cn(
								'block text-xs font-normal',
								isPrimary ? 'text-primary-foreground/70' : 'text-muted-foreground'
							)}
						>
							{summary.beneficiary.upiId || '—'}
						</span>
					{:else if summary.beneficiary.accountNumber}
						<span
							class={cn(
								'block text-xs font-normal',
								isPrimary ? 'text-primary-foreground/70' : 'text-muted-foreground'
							)}
						>
							{maskAccountNumber(summary.beneficiary.accountNumber)}
						</span>
					{/if}
				</span>
			</div>

			{#if summary.remarks}
				<div class="flex items-center justify-between gap-3">
					<span class={cn(isPrimary ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
						Reference
					</span>
					<span class="font-medium">{summary.remarks}</span>
				</div>
			{/if}

			{#if summary.reference}
				<div class="flex items-center justify-between gap-3">
					<span class={cn(isPrimary ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
						Txn ID
					</span>
					<span class="font-mono text-xs font-medium">{summary.reference}</span>
				</div>
			{/if}

			{#if summary.status === 'success' && summary.utr}
				<div class="flex items-center justify-between gap-3">
					<span class={cn(isPrimary ? 'text-primary-foreground/70' : 'text-muted-foreground')}
						>UTR</span
					>
					<span class="font-mono text-xs font-medium">{summary.utr}</span>
				</div>
			{/if}

			{#if summary.status === 'failed' && summary.errorCode}
				<div class="flex items-center justify-between gap-3">
					<span class={cn(isPrimary ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
						Error
					</span>
					<span class="font-mono text-xs font-medium opacity-90">{summary.errorCode}</span>
				</div>
			{/if}

			{#if summary.status === 'failed' && summary.failureReason}
				<div class="flex items-start justify-between gap-3">
					<span class={cn(isPrimary ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
						Reason
					</span>
					<span class="max-w-[60%] text-right text-xs font-medium opacity-90">
						{summary.failureReason}
					</span>
				</div>
			{/if}
		</div>

		<Separator class={cn(isPrimary && 'bg-primary-foreground/20')} />

		<div class="flex items-center gap-3">
			<Avatar class="size-9">
				<AvatarFallback
					class={cn(
						'text-xs',
						isPrimary ? 'bg-primary-foreground text-primary' : 'bg-primary text-primary-foreground'
					)}
				>
					{summary.userName
						.split(' ')
						.map((part) => part[0])
						.join('')
						.slice(0, 2)
						.toUpperCase()}
				</AvatarFallback>
			</Avatar>
			<div>
				<p class="text-sm font-medium">{summary.userName}</p>
				<p
					class={cn('text-xs', isPrimary ? 'text-primary-foreground/70' : 'text-muted-foreground')}
				>
					{summary.userRole}
				</p>
			</div>
		</div>
	</Card.Content>
</Card.Root>
