<script lang="ts">
	import type { Snippet } from 'svelte';
	import { branding } from '$lib/branding';
	import { cn } from '$lib/utils';

	let {
		title,
		subtitle,
		scrollable = true,
		class: className,
		children
	}: {
		title?: string;
		subtitle?: string | Snippet;
		/** Allow the right panel to scroll when the form is tall (e.g. sign-up). */
		scrollable?: boolean;
		class?: string;
		children: Snippet;
	} = $props();
</script>

<main
	class={cn(
		'flex min-h-0 flex-1 flex-col px-5 sm:px-8 lg:px-10',
		scrollable ? 'overflow-y-auto' : 'overflow-hidden'
	)}
>
	<div class="min-h-0 flex-1" aria-hidden="true"></div>
	<div class={cn('mx-auto w-full max-w-md shrink-0 py-2 sm:py-4', className)}>
		<div class="flex w-full flex-col gap-6 sm:gap-8 [@media(max-height:700px)]:gap-4">
			<div class="text-4xl font-semibold text-brand-text sm:text-5xl">
				{branding.name}
			</div>

			<div class="flex flex-col gap-5 sm:gap-6 [@media(max-height:700px)]:gap-4">
				{#if title}
					<div class="flex flex-col gap-1.5 sm:gap-2">
						<h1 class="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
							{title}
						</h1>
						{#if subtitle}
							{#if typeof subtitle === 'string'}
								<p class="text-sm text-foreground sm:text-base">{subtitle}</p>
							{:else}
								<p class="text-sm text-foreground sm:text-base">{@render subtitle()}</p>
							{/if}
						{/if}
					</div>
				{/if}

				{@render children()}
			</div>
		</div>
	</div>
	<div class="min-h-0 flex-1" aria-hidden="true"></div>
</main>

<footer
	class="flex shrink-0 flex-col gap-4 bg-background px-5 py-4 text-center sm:gap-6 sm:px-8 lg:px-10"
>
	<p class="text-xs text-muted-foreground sm:text-sm">
		<a
			href={branding.urls.terms}
			target="_blank"
			rel="external noopener noreferrer"
			class="underline underline-offset-4 hover:text-foreground"
		>
			{branding.copy.termsLabel}
		</a>
		<span class="mx-3 text-border" aria-hidden="true">|</span>
		<a
			href={branding.urls.privacy}
			target="_blank"
			rel="external noopener noreferrer"
			class="underline underline-offset-4 hover:text-foreground"
		>
			{branding.copy.privacyLabel}
		</a>
	</p>
	<p class="text-xs text-muted-foreground sm:text-sm">
		{branding.copy.footer}
	</p>
</footer>
