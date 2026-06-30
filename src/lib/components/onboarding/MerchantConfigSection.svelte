<script lang="ts">
	import { cn } from '$lib/utils';
	import { fly, scale } from 'svelte/transition';
	import { backOut, cubicOut } from 'svelte/easing';
	import { Dropdown } from '$lib/components/reusable';
	import SectionWrapper from '$lib/components/onboarding/SectionWrapper.svelte';
	import { SlidersHorizontal, CheckIcon } from '$lib/assets/icons';

	interface ServiceType {
		value: string;
		label: string;
		icon: import('svelte').Component;
		desc: string;
	}

	interface BankPipeline {
		value: string;
		logo: string;
	}

	interface Affiliate {
		value: string;
		label: string;
	}

	interface Props {
		selectedServiceTypes: string[];
		selectedBankPipeline: string;
		affiliateId: string;
		errors: Record<string, string>;
		availableServiceTypes: ServiceType[];
		availableBankPipelines: BankPipeline[];
		affiliatesByPipeline: Record<string, Affiliate[]>;
		onToggleService: (value: string) => void;
		onPipelineChange: () => void;
	}

	let {
		selectedServiceTypes = $bindable(),
		selectedBankPipeline = $bindable(),
		affiliateId = $bindable(),
		errors,
		availableServiceTypes,
		availableBankPipelines,
		affiliatesByPipeline,
		onToggleService,
		onPipelineChange
	}: Props = $props();
</script>

<div in:fly={{ y: 8, duration: 260, easing: cubicOut }}>
	<SectionWrapper
		title="Merchant Configuration"
		icon={SlidersHorizontal}
		description="Configure services, bank pipelines, and affiliate details for this merchant."
	>
		<div class="space-y-6">
			<div class="space-y-2.5">
				<div class="flex items-center justify-between">
					<p class="text-sm font-medium">
						Service Types <span class="text-destructive">*</span>
					</p>
					{#if selectedServiceTypes.length > 0}
						<span class="text-xs text-muted-foreground">
							{selectedServiceTypes.length} selected
						</span>
					{/if}
				</div>
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
					{#each availableServiceTypes as svc (svc.value)}
						{@const isOn = selectedServiceTypes.includes(svc.value)}
						{@const SvcIcon = svc.icon}
						<button
							type="button"
							onclick={() => onToggleService(svc.value)}
							class={cn(
								'group relative flex items-center gap-3.5 rounded-xl border-2 px-4 py-3 text-left transition-all duration-200',
								'hover:-translate-y-0.5 hover:shadow-md',
								isOn
									? 'border-primary bg-primary/5 shadow-sm shadow-primary/10'
									: 'border-border/50 bg-background hover:border-border'
							)}
						>
							<div
								class={cn(
									'flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-200',
									isOn
										? 'bg-primary/15 text-primary'
										: 'bg-muted/60 text-muted-foreground group-hover:bg-muted'
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
							{#if isOn}
								<span
									class="absolute top-2.5 right-2.5 flex size-4 items-center justify-center rounded-full bg-primary text-white"
									in:scale={{ duration: 180, easing: backOut, start: 0.2 }}
								>
									<CheckIcon class="size-2.5" />
								</span>
							{/if}
						</button>
					{/each}
				</div>
				{#if errors.serviceTypes}
					<p class="text-xs text-destructive" in:fly={{ y: -4, duration: 160 }}>
						{errors.serviceTypes}
					</p>
				{/if}
			</div>

			<div class="flex flex-col gap-5 lg:flex-row">
				<div class="flex flex-1 flex-col gap-1.5">
					<p class="text-sm font-medium">
						Bank Pipeline <span class="text-destructive">*</span>
					</p>

					<Dropdown
						bind:value={selectedBankPipeline}
						onValueChange={onPipelineChange}
						options={availableBankPipelines.map((b) => ({
							value: b.value,
							label: `${b.logo} ${b.value}`
						}))}
						placeholder="Select Bank Pipeline"
						class={cn('!h-10 w-full', errors.bankPipelines && 'border-destructive')}
					/>
					{#if errors.bankPipelines}
						<p class="text-xs text-destructive" in:fly={{ y: -4, duration: 160 }}>
							{errors.bankPipelines}
						</p>
					{/if}
				</div>

				<div class="flex flex-1 flex-col gap-1.5">
					<label class="text-sm font-medium" for="affiliate-select ">
						Affiliate
						<span class=" text-xs font-normal text-muted-foreground">(optional)</span>
					</label>

					<Dropdown
						bind:value={affiliateId}
						disabled={!selectedBankPipeline}
						options={(affiliatesByPipeline[selectedBankPipeline] ?? []).map((a) => ({
							value: a.value,
							label: a.label
						}))}
						placeholder={!selectedBankPipeline ? 'Select Bank Pipeline first' : 'Select Affiliate'}
						class="!h-10 w-full"
					/>
				</div>
			</div>
		</div>
	</SectionWrapper>
</div>
