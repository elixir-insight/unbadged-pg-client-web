<script lang="ts">
	import { cn } from '$lib/utils';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { Button, Input, Dropdown } from '$lib/components/reusable';
	import MerchantConfigSection from './merchant-config-section.svelte';
	import {
		enumToDropdownOptions,
		formatStatusLabel,
		type OrgCategory
	} from '$lib/utils/status_rename';

	interface ServiceType {
		value: string;
		label: string;
		icon: import('svelte').Component;
		desc: string;
	}

	interface Props {
		selectedCategory: OrgCategory | null;
		orgName: string;
		orgPhone: string;
		orgEmail: string;
		orgBusinessType: string;
		selectedServiceTypes: string[];
		affiliateId: string;
		errors: Record<string, string>;
		businessTypes: string[];
		availableServiceTypes: ServiceType[];
		availableAffiliates: { value: string; label: string }[];
		onFieldInput: () => void;
		onToggleService: (value: string, checked: boolean) => void;
		onAffiliateChange: () => void;
		onPrev: () => void;
		onNext: () => void;
	}

	let {
		selectedCategory,
		orgName = $bindable(),
		orgPhone = $bindable(),
		orgEmail = $bindable(),
		orgBusinessType = $bindable(),
		selectedServiceTypes = $bindable(),
		affiliateId = $bindable(),
		errors,
		businessTypes,
		availableServiceTypes,
		availableAffiliates,
		onFieldInput,
		onToggleService,
		onAffiliateChange,
		onPrev,
		onNext
	}: Props = $props();

	const businessTypeOptions = $derived(enumToDropdownOptions(businessTypes));
</script>

<div
	class="relative flex flex-col items-center px-4 py-12"
	in:fly={{ y: 16, duration: 280, easing: cubicOut }}
>
	<div class="w-full max-w-2xl space-y-6">
		<h2 class="text-center font-bold tracking-tight">
			Tell us about your {selectedCategory ? formatStatusLabel(selectedCategory) : 'organization'}
		</h2>

		<div class="space-y-6 rounded-2xl border border-border bg-background p-6 shadow-xs">
			<div class="grid grid-cols-1 gap-5 sm:grid-cols-1">
				<div class="flex flex-col gap-1.5">
					<label class="text-sm font-medium" for="org-name">
						Organization Name <span class="text-destructive">*</span>
					</label>
					<Input
						id="org-name"
						bind:value={orgName}
						oninput={onFieldInput}
						placeholder="Enter Organization Name"
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
						type="email"
						bind:value={orgEmail}
						oninput={onFieldInput}
						placeholder="Enter Email Address"
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
						type="tel"
						bind:value={orgPhone}
						oninput={onFieldInput}
						placeholder="Enter Mobile Number"
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
						bind:value={orgBusinessType}
						onValueChange={onFieldInput}
						options={businessTypeOptions}
						placeholder="Select Business Type"
						class={cn(' w-full', errors.orgBusinessType && 'border-destructive')}
					/>
					{#if errors.orgBusinessType}
						<p class="text-xs text-destructive" in:fly={{ y: -4, duration: 160 }}>
							{errors.orgBusinessType}
						</p>
					{/if}
				</div>
			</div>

			{#if selectedCategory === 'MERCHANT'}
				<MerchantConfigSection
					bind:selectedServiceTypes
					bind:affiliateId
					{errors}
					{availableServiceTypes}
					{availableAffiliates}
					{onToggleService}
					{onAffiliateChange}
				/>
			{/if}
		</div>

		<div class="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
			<Button variant="outline" size="lg" onclick={onPrev}>Back</Button>
			<Button size="lg" onclick={onNext}>
				Create {selectedCategory ? formatStatusLabel(selectedCategory) : 'Organization'}
			</Button>
		</div>
	</div>
</div>
