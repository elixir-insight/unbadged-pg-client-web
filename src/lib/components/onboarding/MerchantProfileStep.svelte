<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { cn } from '$lib/utils';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { Button, Input, Dropdown } from '$lib/components/reusable';
	import MerchantConfigSection from './MerchantConfigSection.svelte';

	type ClientType = 'Merchant' | 'Partner';

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
		selectedCategory: ClientType | null;
		orgName: string;
		orgPhone: string;
		orgEmail: string;
		orgBusinessType: string;
		selectedServiceTypes: string[];
		servicePipelines: Record<string, string>;
		affiliateId: string;
		errors: Record<string, string>;
		businessTypes: string[];
		availableServiceTypes: ServiceType[];
		bankPipelinesByService: Record<string, BankPipelineOption[]>;
		affiliatesByPipeline: Record<string, Affiliate[]>;
		onFieldInput: () => void;
		onToggleService: (value: string, checked: boolean) => void;
		onPipelineChange: (serviceType: string) => void;
		onPrev: () => void;
		submitting?: boolean;
		onEnhance: SubmitFunction;
	}

	let {
		selectedCategory,
		orgName = $bindable(),
		orgPhone = $bindable(),
		orgEmail = $bindable(),
		orgBusinessType = $bindable(),
		selectedServiceTypes = $bindable(),
		servicePipelines = $bindable(),
		affiliateId = $bindable(),
		errors,
		businessTypes,
		availableServiceTypes,
		bankPipelinesByService,
		affiliatesByPipeline,
		onFieldInput,
		onToggleService,
		onPipelineChange,
		onPrev,
		submitting = false,
		onEnhance
	}: Props = $props();
</script>

<div
	class="relative flex flex-col items-center px-4 py-12"
	in:fly={{ y: 16, duration: 280, easing: cubicOut }}
>
	<form method="POST" action="?/create" use:enhance={onEnhance} class="w-full max-w-2xl space-y-6">
		<h2 class="text-center font-bold tracking-tight">
			Tell us about your {selectedCategory ?? 'organization'}
		</h2>

		<input type="hidden" name="selectedCategory" value={selectedCategory ?? ''} />
		<input type="hidden" name="servicePipelines" value={JSON.stringify(servicePipelines)} />
		{#each selectedServiceTypes as serviceType (serviceType)}
			<input type="hidden" name="selectedServiceTypes" value={serviceType} />
		{/each}

		<div class="space-y-6 rounded-2xl border border-border bg-background p-6 shadow-xs">
			<div class="grid grid-cols-1 gap-5 sm:grid-cols-1">
				<div class="flex flex-col gap-1.5">
					<label class="text-sm font-medium" for="org-name">
						Organization Name <span class="text-destructive">*</span>
					</label>
					<Input
						id="org-name"
						name="orgName"
						bind:value={orgName}
						oninput={onFieldInput}
						placeholder="Enter Organization Name"
						required
						disabled={submitting}
						class={cn(errors.orgName && 'border-destructive focus-visible:ring-destructive/30')}
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
						name="orgEmail"
						type="email"
						bind:value={orgEmail}
						oninput={onFieldInput}
						placeholder="Enter Email Address"
						required
						disabled={submitting}
						class={cn(errors.orgEmail && 'border-destructive focus-visible:ring-destructive/30')}
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
						name="orgPhone"
						type="tel"
						bind:value={orgPhone}
						oninput={onFieldInput}
						placeholder="Enter Mobile Number"
						required
						disabled={submitting}
						class={cn(errors.orgPhone && 'border-destructive focus-visible:ring-destructive/30')}
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
						name="orgBusinessType"
						bind:value={orgBusinessType}
						onValueChange={onFieldInput}
						options={businessTypes.map((t) => ({ value: t, label: t }))}
						placeholder="Select Business Type"
						required
						disabled={submitting}
						class={cn(' w-full', errors.orgBusinessType && 'border-destructive')}
					/>
					{#if errors.orgBusinessType}
						<p class="text-xs text-destructive" in:fly={{ y: -4, duration: 160 }}>
							{errors.orgBusinessType}
						</p>
					{/if}
				</div>
			</div>

			{#if selectedCategory === 'Merchant'}
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
					disabled={submitting}
				/>
			{/if}
		</div>

		<div class="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
			<Button type="button" variant="outline" size="lg" onclick={onPrev} disabled={submitting}>
				Back
			</Button>
			<Button type="submit" size="lg" disabled={submitting}>
				{submitting ? 'Creating…' : `Create ${selectedCategory ?? 'Organization'}`}
			</Button>
		</div>
	</form>
</div>
