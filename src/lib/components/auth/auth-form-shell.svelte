<script lang="ts">
	import type { Snippet } from 'svelte';
	import { CompanyLogoLight } from '$lib/assets/icons';
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
	<div class={cn('mx-auto w-full max-w-md shrink-0 py-2 sm:py-3', className)}>
		<div class="flex w-full flex-col gap-4 sm:gap-5 [@media(max-height:700px)]:gap-3">
			<div>
				<CompanyLogoLight width="140" class="h-auto w-32 sm:w-36" />
			</div>

			<div class="flex flex-col gap-4 sm:gap-5 [@media(max-height:700px)]:gap-3">
				{#if title}
					<div class="flex flex-col gap-1">
						<h1 class="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
							{title}
						</h1>
						{#if subtitle}
							{#if typeof subtitle === 'string'}
								<p class="text-sm text-muted-foreground">{subtitle}</p>
							{:else}
								<p class="text-sm text-muted-foreground">{@render subtitle()}</p>
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

<footer class="flex shrink-0 flex-col gap-3 bg-background px-5 py-3 text-center sm:px-8 lg:px-10">
	<p class="text-xs text-muted-foreground">
		<a
			href="https://elixirpay.in/terms"
			target="_blank"
			rel="noopener noreferrer"
			class="underline underline-offset-4 hover:text-foreground"
		>
			Terms and Conditions
		</a>
		<span class="mx-2 text-border" aria-hidden="true">|</span>
		<a
			href="https://elixirpay.in/privacy"
			target="_blank"
			rel="noopener noreferrer"
			class="underline underline-offset-4 hover:text-foreground"
		>
			Privacy Policy
		</a>
	</p>
	<p class="text-xs text-muted-foreground">© 2026 ElixirPay • Secure Payment Gateway Platform</p>
</footer>
