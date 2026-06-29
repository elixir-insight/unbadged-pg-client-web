<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { CheckCircle2Icon } from '$lib/assets/icons';

	type ClientType = 'Merchant' | 'Partner';

	interface Props {
		selectedCategory: ClientType | null;
		orgName: string;
		orgPhone: string;
		orgEmail: string;
		orgBusinessType: string;
		selectedServiceTypes: string[];
		selectedBankPipeline: string;
	}

	let {
		selectedCategory,
		orgName,
		orgPhone,
		orgEmail,
		orgBusinessType,
		selectedServiceTypes,
		selectedBankPipeline
	}: Props = $props();

	const requiredFields = $derived([
		{ label: 'Organization name', done: !!orgName.trim() },
		{ label: 'Mobile number', done: !!orgPhone.trim() },
		{ label: 'Email address', done: !!orgEmail.trim() },
		{ label: 'Business type', done: !!orgBusinessType },
		...(selectedCategory === 'Merchant'
			? [
					{ label: 'Service type(s)', done: selectedServiceTypes.length > 0 },
					{ label: 'Bank pipeline', done: !!selectedBankPipeline }
				]
			: [])
	]);

	const nextSteps = [
		'KYB verification',
		'Director KYC',
		'Document upload',
		'Bank setup',
		'Integration review'
	] as const;
</script>

<div class="flex flex-col gap-4">
	<div
		class="animate-fade-up surface-card rounded-xl p-6 border bg-card text-left shadow-sm"
		style="animation-delay: 60ms"
		in:fly={{ y: 8, duration: 220, delay: 60, easing: cubicOut }}
	>
		<p class="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
			Required Fields
		</p>
		<ul class="space-y-2">
			{#each requiredFields as item (item.label)}
				<li class="flex items-center gap-2 text-xs">
					{#if item.done}
						<CheckCircle2Icon class="size-3.5 shrink-0 text-success" />
						<span class="text-foreground">{item.label}</span>
					{:else}
						<span class="size-3.5 shrink-0 rounded-full border-2 border-border"></span>
						<span class="text-muted-foreground">{item.label}</span>
					{/if}
				</li>
			{/each}
		</ul>
	</div>

	<div
		class="animate-fade-up surface-card rounded-xl p-6 border bg-card text-left shadow-sm"
		style="animation-delay: 120ms"
		in:fly={{ y: 8, duration: 220, delay: 120, easing: cubicOut }}
	>
		<p class="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
			What's next
		</p>
		<ul class="space-y-1.5">
			{#each nextSteps as item (item)}
				<li class="flex items-center gap-2 text-xs text-muted-foreground">
					<span class="size-1 shrink-0 rounded-full bg-muted-foreground/40"></span>
					{item}
				</li>
			{/each}
		</ul>
	</div>
</div>
