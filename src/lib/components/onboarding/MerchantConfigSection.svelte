<script lang="ts">
	import { cn } from '$lib/utils';
	import { fly, slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { Dropdown, Switch } from '$lib/components/reusable';

	interface ServiceType {
		value: string;
		label: string;
		icon: import('svelte').Component;
		desc: string;
	}

	interface BankPipelineOption {
		value: string;
		label: string;
	}

	interface Affiliate {
		value: string;
		label: string;
	}

	interface Props {
		selectedServiceTypes: string[];
		servicePipelines: Record<string, string>;
		affiliateId: string;
		errors: Record<string, string>;
		availableServiceTypes: ServiceType[];
		/** Pipeline options keyed by service type value (e.g. Pay-Ins / Payouts). Value is bankPipelineCode. */
		bankPipelinesByService: Record<string, BankPipelineOption[]>;
		affiliatesByPipeline: Record<string, Affiliate[]>;
		onToggleService: (value: string, checked: boolean) => void;
		onPipelineChange: (serviceType: string) => void;
	}

	let {
		selectedServiceTypes = $bindable(),
		servicePipelines = $bindable(),
		affiliateId = $bindable(),
		errors,
		availableServiceTypes,
		bankPipelinesByService,
		affiliatesByPipeline,
		onToggleService,
		onPipelineChange
	}: Props = $props();

	const activePipelines = $derived(
		selectedServiceTypes.map((s) => servicePipelines[s]).filter((p): p is string => !!p)
	);

	const affiliateOptions = $derived(
		Array.from(
			new Map(
				activePipelines.flatMap((p) => affiliatesByPipeline[p] ?? []).map((a) => [a.value, a])
			).values()
		)
	);

	const pendingServiceLabel = $derived(
		availableServiceTypes.find(
			(svc) => selectedServiceTypes.includes(svc.value) && !servicePipelines[svc.value]
		)?.label
	);

	const affiliatePlaceholder = $derived(
		activePipelines.length > 0
			? 'Select Affiliate'
			: pendingServiceLabel
				? `Select a ${pendingServiceLabel} Bank Pipeline to continue`
				: 'Select a Bank Pipeline to continue'
	);

	function setPipeline(serviceType: string, pipeline: string) {
		servicePipelines = { ...servicePipelines, [serviceType]: pipeline };
		onPipelineChange(serviceType);
	}
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
						'flex flex-col gap-3 rounded-xl border-2 px-4 py-3 transition-all duration-200',
						isOn
							? 'border-primary shadow-sm shadow-primary/10 hover:bg-background'
							: 'border-border/50 bg-background hover:border-border'
					)}
				>
					<div class="flex items-center gap-3.5">
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

					{#if isOn}
						<div
							class="flex flex-col gap-1.5 border-t border-primary/15 pt-3"
							transition:slide={{ duration: 200, easing: cubicOut }}
						>
							<label class="text-xs font-medium" for="pipeline-{svc.value}">
								Bank Pipeline <span class="text-destructive">*</span>
							</label>
							<Dropdown
								value={servicePipelines[svc.value] ?? ''}
								onValueChange={(v) => setPipeline(svc.value, v)}
								options={bankPipelinesByService[svc.value] ?? []}
								placeholder="Select Bank Pipeline"
								class={cn('w-full', errors[`bankPipeline_${svc.value}`] && 'border-destructive')}
							/>
							{#if errors[`bankPipeline_${svc.value}`]}
								<p class="text-xs text-destructive" in:fly={{ y: -4, duration: 160 }}>
									{errors[`bankPipeline_${svc.value}`]}
								</p>
							{/if}
						</div>
					{/if}
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
		<label class="text-sm font-medium" for="affiliate-select">
			Affiliate
			<span class="text-xs font-normal text-muted-foreground">(optional)</span>
		</label>

		<Dropdown
			bind:value={affiliateId}
			disabled={activePipelines.length === 0}
			options={affiliateOptions.map((a) => ({ value: a.value, label: a.label }))}
			placeholder={affiliatePlaceholder}
			class="w-full"
		/>
	</div>
</div>
