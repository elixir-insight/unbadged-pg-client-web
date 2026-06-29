<script lang="ts">
	import { cn } from '$lib/utils';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { Button, Input, Dropdown } from '$lib/components/reusable';
	import SectionWrapper from '$lib/components/onboarding/SectionWrapper.svelte';
	import { Building2Icon, ArrowLeftIcon, CheckCircle2Icon } from '$lib/assets/icons';
	import CreateOrgSidebar from './CreateOrgSidebar.svelte';
	import MerchantConfigSection from './MerchantConfigSection.svelte';

	type ClientType = 'Merchant' | 'Partner';

	interface Category {
		value: ClientType;
		icon: import('svelte').Component;
		title: string;
		description: string;
		features: string[];
		activeBorder: string;
		activeIconBg: string;
		activeBg: string;
		checkBg: string;
		activeGlow: string;
	}

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
		selectedCategory: ClientType | null;
		categories: Category[];
		orgName: string;
		orgPhone: string;
		orgEmail: string;
		orgBusinessType: string;
		selectedServiceTypes: string[];
		selectedBankPipeline: string;
		affiliateId: string;
		errors: Record<string, string>;
		businessTypes: string[];
		availableServiceTypes: ServiceType[];
		availableBankPipelines: BankPipeline[];
		affiliatesByPipeline: Record<string, Affiliate[]>;
		onFieldInput: () => void;
		onToggleService: (value: string) => void;
		onPipelineChange: () => void;
		onChangeClientType: () => void;
		onPrev: () => void;
		onNext: () => void;
	}

	let {
		selectedCategory,
		categories,
		orgName = $bindable(),
		orgPhone = $bindable(),
		orgEmail = $bindable(),
		orgBusinessType = $bindable(),
		selectedServiceTypes = $bindable(),
		selectedBankPipeline = $bindable(),
		affiliateId = $bindable(),
		errors,
		businessTypes,
		availableServiceTypes,
		availableBankPipelines,
		affiliatesByPipeline,
		onFieldInput,
		onToggleService,
		onPipelineChange,
		onChangeClientType,
		onPrev,
		onNext
	}: Props = $props();
</script>

<div class="space-y-6 p-4 sm:p-6" in:fly={{ y: 16, duration: 280, easing: cubicOut }}>
	{#if selectedCategory}
		{@const cat = categories.find((c) => c.value === selectedCategory)}
		{#if cat}
			{@const CatIcon = cat.icon}
			<div
				class={cn(
					'flex items-center gap-3 rounded-xl border px-4 py-3',
					cat.activeBg,
					cat.activeBorder
				)}
				in:fly={{ y: -6, duration: 220, easing: cubicOut }}
			>
				<div
					class={cn(
						'flex size-8 shrink-0 items-center justify-center rounded-lg',
						cat.activeIconBg
					)}
				>
					<CatIcon class="size-4" />
				</div>
				<div class="min-w-0 flex-1">
					<p class="text-sm font-semibold">{cat.title}</p>
					<p class="text-xs text-muted-foreground">{cat.description}</p>
				</div>
				<button
					onclick={onChangeClientType}
					class="shrink-0 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
				>
					Change
				</button>
			</div>
		{/if}
	{/if}

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<div class="lg:col-span-2">
			<div class="w-full space-y-4">
				<SectionWrapper
					title="Organization Information"
					icon={Building2Icon}
					description="Provide the basic details for this {selectedCategory ?? 'organization'}."
				>
					<div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
						<div class="flex flex-col gap-1.5">
							<label class="text-sm font-medium" for="org-name">
								Organization Name <span class="text-destructive">*</span>
							</label>
							<Input
								id="org-name"
								bind:value={orgName}
								oninput={onFieldInput}
								placeholder="Enter Organization Name"
								class={cn(
									'h-10',
									errors.orgName && 'border-destructive focus-visible:ring-destructive/30'
								)}
							/>
							{#if errors.orgName}
								<p class="text-xs text-destructive" in:fly={{ y: -4, duration: 160 }}>
									{errors.orgName}
								</p>
							{/if}
						</div>

						<div class="flex flex-col gap-1.5">
							<label class="text-sm font-medium" for="org-email">
								Email Address <span class="text-destructive">*</span>
							</label>
							<Input
								id="org-email"
								type="email"
								bind:value={orgEmail}
								oninput={onFieldInput}
								placeholder="Enter Email Address"
								class={cn(
									'h-10',
									errors.orgEmail && 'border-destructive focus-visible:ring-destructive/30'
								)}
							/>
							{#if errors.orgEmail}
								<p class="text-xs text-destructive" in:fly={{ y: -4, duration: 160 }}>
									{errors.orgEmail}
								</p>
							{/if}
						</div>

						<div class="flex flex-col gap-1.5">
							<label class="text-sm font-medium" for="org-phone">
								Mobile Number <span class="text-destructive">*</span>
							</label>
							<Input
								id="org-phone"
								type="tel"
								bind:value={orgPhone}
								oninput={onFieldInput}
								placeholder="Enter Mobile Number"
								class={cn(
									'h-10',
									errors.orgPhone && 'border-destructive focus-visible:ring-destructive/30'
								)}
							/>
							{#if errors.orgPhone}
								<p class="text-xs text-destructive" in:fly={{ y: -4, duration: 160 }}>
									{errors.orgPhone}
								</p>
							{/if}
						</div>

						<div class="flex flex-col gap-1.5">
							<label class="text-sm font-medium" for="org-business-type">
								Business Type <span class="text-destructive">*</span>
							</label>
							<Dropdown
								bind:value={orgBusinessType}
								onValueChange={onFieldInput}
								options={businessTypes.map((t) => ({ value: t, label: t }))}
								placeholder="Select Business Type"
								class={cn('h-10 w-full', errors.orgBusinessType && 'border-destructive')}
							/>
							{#if errors.orgBusinessType}
								<p class="text-xs text-destructive" in:fly={{ y: -4, duration: 160 }}>
									{errors.orgBusinessType}
								</p>
							{/if}
						</div>
					</div>
				</SectionWrapper>

				{#if selectedCategory === 'Merchant'}
					<MerchantConfigSection
						bind:selectedServiceTypes
						bind:selectedBankPipeline
						bind:affiliateId
						{errors}
						{availableServiceTypes}
						{availableBankPipelines}
						{affiliatesByPipeline}
						{onToggleService}
						{onPipelineChange}
					/>
				{/if}

				<div
					class="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between"
				>
					<Button
						variant="outline"
						size="lg"
						onclick={onPrev}
						class="w-full gap-2 rounded-full px-6 sm:w-auto"
					>
						<ArrowLeftIcon class="size-4" />
						Back
					</Button>
					<Button
						size="lg"
						onclick={onNext}
						class="gradient-primary w-full gap-2 rounded-full px-6 text-primary-foreground sm:w-auto"
					>
						<CheckCircle2Icon class="size-4" />
						Create {selectedCategory ?? 'Organization'}
					</Button>
				</div>
			</div>
		</div>

		<CreateOrgSidebar
			{selectedCategory}
			{orgName}
			{orgPhone}
			{orgEmail}
			{orgBusinessType}
			{selectedServiceTypes}
			{selectedBankPipeline}
		/>
	</div>
</div>
