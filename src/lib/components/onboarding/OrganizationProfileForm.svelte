<script lang="ts">
	import { fly } from 'svelte/transition';
	import { Radio, type RadioOption } from '$lib/components/reusable';
	import MerchantConfigSection from './MerchantConfigSection.svelte';

	interface ServiceType {
		value: string;
		label: string;
		icon: import('svelte').Component;
		desc: string;
	}

	interface Option {
		value: string;
		label: string;
	}

	interface Props {
		profileType: string;
		profileTypeOptions: RadioOption[];
		selectedServiceTypes: string[];
		servicePipelines: Record<string, string>;
		affiliateId: string;
		errors: Record<string, string>;
		availableServiceTypes: ServiceType[];
		bankPipelinesByService: Record<string, Option[]>;
		affiliatesByPipeline: Record<string, Option[]>;
		onToggleService: (value: string, checked: boolean) => void;
		onPipelineChange: (serviceType: string) => void;
		disabled?: boolean;
	}

	let {
		profileType = $bindable(),
		profileTypeOptions,
		selectedServiceTypes = $bindable(),
		servicePipelines = $bindable(),
		affiliateId = $bindable(),
		errors,
		availableServiceTypes,
		bankPipelinesByService,
		affiliatesByPipeline,
		onToggleService,
		onPipelineChange,
		disabled = false
	}: Props = $props();
</script>

<div class="space-y-6">
	<div class="flex flex-col gap-2.5">
		<p class="text-sm font-medium">
			Profile Type <span class="text-destructive">*</span>
		</p>
		<Radio
			bind:value={profileType}
			options={profileTypeOptions}
			orientation="horizontal"
			{disabled}
		/>
		{#if errors.profileType}
			<p class="text-xs text-destructive" in:fly={{ y: -4, duration: 160 }}>
				{errors.profileType}
			</p>
		{/if}
	</div>

	{#if profileType === 'MERCHANT'}
		<MerchantConfigSection
			bind:selectedServiceTypes
			bind:servicePipelines
			bind:affiliateId
			{errors}
			{availableServiceTypes}
			{bankPipelinesByService}
			{affiliatesByPipeline}
			{onToggleService}
			{onPipelineChange}
			{disabled}
		/>
	{/if}
</div>
