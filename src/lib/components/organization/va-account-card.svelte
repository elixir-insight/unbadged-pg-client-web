<script lang="ts">
	import { Chip } from '$lib/components/reusable';
	import { Landmark, Hash, PencilIcon } from '$lib/assets/icons';
	import type { VirtualAccount } from './types';
	import { cn } from '$lib/utils';
	import type { BadgeVariant } from '$lib/components/ui/badge';

	interface Props {
		account: VirtualAccount;
		colorIndex?: number;
		onedit?: () => void;
	}

	const { account, colorIndex = 0, onedit }: Props = $props();

	const ICON_STYLES = [
		{ bg: 'bg-primary/10', text: 'text-primary', ring: 'ring-primary/15' },
		{ bg: 'bg-accent', text: 'text-accent-foreground', ring: 'ring-border/50' },
		{ bg: 'bg-chart-1/10', text: 'text-chart-1', ring: 'ring-chart-1/20' },
		{ bg: 'bg-chart-2/10', text: 'text-chart-2', ring: 'ring-chart-2/20' },
		{ bg: 'bg-chart-3/10', text: 'text-chart-3', ring: 'ring-chart-3/20' }
	] as const;

	const iconStyle = $derived(ICON_STYLES[colorIndex % ICON_STYLES.length]);
	const statusVariant = $derived<BadgeVariant>(account.active ? 'success' : 'disabled');
	const statusLabel = $derived(account.active ? 'Active' : 'Inactive');
</script>

<div
	class="group/card flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md"
>
	<div class="relative border-b border-border/40 p-3 sm:p-4">
		<div class="absolute top-3 right-3 flex items-center gap-0.5 sm:top-4 sm:right-4">
			<Chip variant={statusVariant} class="hidden sm:inline-flex">{statusLabel}</Chip>
			<button
				type="button"
				aria-label="Edit {account.alias}"
				onclick={() => onedit?.()}
				class="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground/50
				       transition-colors hover:bg-muted hover:text-foreground
				       focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none
				       sm:size-auto sm:p-1.5"
			>
				<PencilIcon class="size-4 sm:size-3.5" />
			</button>
		</div>

		<div class="flex items-start gap-2.5 pr-10 sm:gap-3 sm:pr-28">
			<div
				class={cn(
					'flex size-9 shrink-0 items-center justify-center rounded-lg ring-1 sm:size-10',
					iconStyle.bg,
					iconStyle.text,
					iconStyle.ring
				)}
			>
				<Landmark class="size-4 sm:size-5" />
			</div>

			<div class="min-w-0 flex-1">
				<p class="line-clamp-2 text-sm leading-snug font-semibold text-foreground sm:truncate">
					{account.alias}
				</p>

				<div class="mt-1 flex items-center gap-1 text-muted-foreground">
					<Hash class="size-3 shrink-0 text-primary/70" />
					<span class="truncate font-mono text-xs font-medium text-primary/80">{account.id}</span>
				</div>

				<p class="mt-1 truncate font-mono text-xs tracking-wide text-muted-foreground/70">
					{account.accountNumber}
				</p>

				<Chip variant={statusVariant} class="mt-2 sm:hidden">{statusLabel}</Chip>
			</div>
		</div>
	</div>

	<div class="flex items-center px-3 py-2.5 sm:px-4 sm:py-3">
		<span
			class="max-w-full truncate rounded-full border border-border bg-muted/30 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
		>
			{account.bankingPipeline}
		</span>
	</div>
</div>
