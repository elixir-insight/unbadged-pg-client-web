<script lang="ts">
	import { cn } from '$lib/utils';
	import { getPasswordRules } from '$lib/validation/sign-up';

	let {
		password = '',
		id,
		class: className
	}: { password?: string; id?: string; class?: string } = $props();

	const rules = $derived(getPasswordRules(password));
	const metCount = $derived(rules.filter((rule) => rule.met).length);

	const tone = $derived.by(() => {
		if (password.length === 0) return null;
		if (metCount <= 1) return 'bg-destructive';
		if (metCount <= 3) return 'bg-warning';
		return 'bg-success';
	});
</script>

{#if tone}
	<div
		{id}
		class={cn('flex gap-1', className)}
		role="progressbar"
		aria-valuemin={0}
		aria-valuemax={4}
		aria-valuenow={metCount}
		aria-label="Password strength"
	>
		{#each { length: 4 }, i (i)}
			<span
				class={cn('h-1.5 flex-1 rounded-full bg-muted', i < metCount && tone)}
				aria-hidden="true"
			></span>
		{/each}
	</div>
{/if}
