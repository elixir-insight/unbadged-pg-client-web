<script lang="ts">
	import { LockIcon, ShieldCheck, Landmark } from '$lib/assets/icons';
	import { cn } from '$lib/utils';

	let { class: className }: { class?: string } = $props();

	const items = [
		{ icon: LockIcon, title: '256-bit SSL', subtitle: 'Encryption' },
		{ icon: ShieldCheck, title: 'PCI DSS', subtitle: 'Certified' },
		{ icon: Landmark, title: 'RBI Guidelines', subtitle: 'Followed' }
	] as const;
</script>

<div
	class={cn(
		'security-trust-banner dark flex w-full max-w-xl items-stretch rounded-full shadow-lg backdrop-blur-xl backdrop-saturate-150',
		className
	)}
	role="group"
	aria-label="Security and compliance"
>
	{#each items as item, index (item.title)}
		{#if index > 0}
			<div
				class="security-trust-banner__divider w-px shrink-0 self-stretch"
				aria-hidden="true"
			></div>
		{/if}
		<div
			class="flex min-w-0 flex-1 items-center justify-center gap-2.5 px-3 py-3 sm:gap-3 sm:px-4 sm:py-3.5"
		>
			<item.icon class="size-5 shrink-0 text-card-foreground sm:size-6" aria-hidden="true" />
			<div class="min-w-0 text-left leading-tight">
				<p class="truncate text-xs font-semibold text-card-foreground sm:text-sm">{item.title}</p>
				<p class="truncate text-h5 text-card-foreground/80 sm:text-xs">{item.subtitle}</p>
			</div>
		</div>
	{/each}
</div>

<style>
	/*
	  Token opacity via Tailwind (bg-card/30) does not resolve against our CSS vars.
	  color-mix gives a real translucent frost while staying on design tokens.
	*/
	.security-trust-banner {
		background-color: color-mix(in oklch, var(--card-foreground) 14%, transparent);
		border: 1px solid color-mix(in oklch, var(--card-foreground) 30%, transparent);
		box-shadow:
			0 0.5rem 2rem color-mix(in oklch, var(--card) 40%, transparent),
			inset 0 1px 0 color-mix(in oklch, var(--card-foreground) 40%, transparent);
	}

	.security-trust-banner__divider {
		background-color: color-mix(in oklch, var(--card-foreground) 28%, transparent);
	}
</style>
