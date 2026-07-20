<script lang="ts">
	import { Button } from '$lib/components/reusable';
	import { ArrowRight } from '$lib/assets/icons';

	let {
		code,
		title,
		description,
		actionLabel = 'Go to home',
		actionHref = '/login'
	}: {
		code: string;
		title: string;
		description: string;
		actionLabel?: string;
		actionHref?: string;
	} = $props();
</script>

<div class="flex min-h-dvh items-center justify-center bg-background px-6 py-12">
	<div class="relative w-full max-w-xl text-center">
		<p
			class="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 select-none text-[clamp(12rem,40vw,20rem)] leading-none font-bold text-accent-foreground/10"
			aria-hidden="true"
		>
			{code}
		</p>

		<div class="relative z-10 flex flex-col items-center gap-4">
			<h1 class="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
			<p class="max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
			<Button href={actionHref} size="lg" class="mt-2 ">
				{actionLabel}
				<ArrowRight class="size-4" aria-hidden="true" />
			</Button>
		</div>
	</div>
</div>
