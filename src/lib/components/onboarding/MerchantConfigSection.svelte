<script lang="ts">
	import { cn } from '$lib/utils';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { Dropdown, Switch } from '$lib/components/reusable';

	interface ServiceType {
		value: string;
		label: string;
		icon: import('svelte').Component;
		desc: string;
	}

	interface AffiliateOption {
		value: string;
		label: string;
	}

	interface Props {
		selectedServiceTypes: string[];
		affiliateId: string;
		errors: Record<string, string>;
		availableServiceTypes: ServiceType[];
		availableAffiliates: AffiliateOption[];
		onToggleService: (value: string, checked: boolean) => void;
		onAffiliateChange: () => void;
	}

	let {
		selectedServiceTypes = $bindable(),
		affiliateId = $bindable(),
		errors,
		availableServiceTypes,
		availableAffiliates,
		onToggleService,
		onAffiliateChange
	}: Props = $props();
</script>

<div
	class="space-y-6 border-t border-border pt-6"
	in:fly={{ y: 8, duration: 260, easing: cubicOut }}
>
	<div class="space-y-2.5">
		<div class="flex items-center justify-between">
			<p class="text-sm font-medium">
				Service Types <span class="text-destructive">*</span>
			</p>
		</div>
		<div class="flex flex-col gap-3">
			{#each availableServiceTypes as svc (svc.value)}
				{@const isOn = selectedServiceTypes.includes(svc.value)}
				{@const SvcIcon = svc.icon}
				<div
					class={cn(
						'flex items-center gap-3.5 rounded-xl border-2 px-4 py-3 transition-all duration-200',
						isOn
							? 'border-primary shadow-sm shadow-primary/10 hover:bg-background'
							: 'border-border/50 bg-background hover:border-border'
					)}
				>
					<div
						class={cn(
							'flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-200',
							isOn ? 'bg-primary/15 text-primary' : 'bg-muted/60 text-muted-foreground'
						)}
					>
						<SvcIcon class="size-4" />
					</div>
					<div class="min-w-0 flex-1">
						<p class={cn('text-sm font-semibold', isOn ? 'text-primary' : 'text-foreground')}>
							{svc.label}
						</p>
						<p class="text-xs text-muted-foreground">{svc.desc}</p>
					</div>
					<Switch checked={isOn} onCheckedChange={(c) => onToggleService(svc.value, c)} />
				</div>
			{/each}
		</div>
		{#if errors.serviceTypes}
			<p class="text-xs text-destructive" in:fly={{ y: -4, duration: 160 }}>
				{errors.serviceTypes}
			</p>
		{/if}
	</div>

	<div class="flex flex-col gap-1.5">
		<label class="text-sm font-medium">
			Affiliate Id
			<span class="text-xs font-normal text-muted-foreground">(optional)</span>
		</label>
		<Dropdown
			bind:value={affiliateId}
			onValueChange={onAffiliateChange}
			options={availableAffiliates}
			placeholder="Select Affiliate Id"
			class={cn('w-full', errors.affiliateId && 'border-destructive')}
		/>
		{#if errors.affiliateId}
			<p class="text-xs text-destructive" in:fly={{ y: -4, duration: 160 }}>
				{errors.affiliateId}
			</p>
		{/if}
	</div>
</div>
