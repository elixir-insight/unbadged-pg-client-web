<script lang="ts">
	import { Check } from '$lib/assets/icons';
	import { cn } from '$lib/utils';
	import { getPasswordRules } from '$lib/validation/sign-up';

	let {
		password = '',
		id,
		class: className
	}: { password?: string; id?: string; class?: string } = $props();

	const rules = $derived(getPasswordRules(password));
	const metCount = $derived(rules.filter((rule) => rule.met).length);

	const strength = $derived.by(() => {
		if (password.length === 0) return null;
		if (metCount <= 1) return { label: 'Weak', tone: 'bg-destructive' };
		if (metCount <= 3) return { label: 'Fair', tone: 'bg-warning' };
		return { label: 'Strong', tone: 'bg-success' };
	});
</script>

<div {id} class={cn('flex flex-col gap-2.5', className)}>
	{#if strength}
		<div class="flex items-center gap-2.5">
			<div
				class="flex flex-1 gap-1"
				role="progressbar"
				aria-valuemin={0}
				aria-valuemax={4}
				aria-valuenow={metCount}
				aria-label="Password strength"
			>
				{#each { length: 4 }, i (i)}
					<span
						class={cn('h-1.5 flex-1 rounded-full bg-muted', i < metCount && strength.tone)}
						aria-hidden="true"
					></span>
				{/each}
			</div>
			<span
				class={cn(
					'text-xs font-medium',
					strength.label === 'Weak' && 'text-destructive',
					strength.label === 'Fair' && 'text-warning',
					strength.label === 'Strong' && 'text-success'
				)}
			>
				{strength.label}
			</span>
		</div>
	{/if}

	<ul class="grid grid-cols-1 gap-1 sm:grid-cols-2">
		{#each rules as rule (rule.id)}
			<li
				class={cn(
					'flex items-center gap-1.5 text-sm',
					rule.met ? 'text-success' : 'text-muted-foreground'
				)}
			>
				<Check class={cn('h-3.5 w-3.5 shrink-0', !rule.met && 'opacity-0')} aria-hidden="true" />
				{rule.label}
			</li>
		{/each}
	</ul>
</div>
