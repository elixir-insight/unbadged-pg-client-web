<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { onboardingDrafts } from '$lib/stores/onboarding-draft.svelte';
	import { ClientTypeStep, MerchantProfileStep } from '$lib/components/onboarding';
	import {
		type ClientType,
		businessTypes,
		availableServiceTypes,
		availableBankPipelines,
		affiliatesByPipeline
	} from './constants';
	import { firstValidationError, validateCreateOrganization } from './validation';

	let activeStep = $state(0);
	let completedSteps = $state(new Set<number>());
	let selectedCategory = $state<ClientType | null>(null);

	let orgName = $state('');
	let orgPhone = $state('');
	let orgEmail = $state('');
	let orgBusinessType = $state('');
	let selectedServiceTypes = $state<string[]>([]);
	let servicePipelines = $state<Record<string, string>>({});
	let affiliateId = $state('');

	let errors = $state<Record<string, string>>({});
	let submitAttempted = $state(false);

	function validate(): string | null {
		errors = validateCreateOrganization({
			selectedCategory,
			orgName,
			orgPhone,
			orgEmail,
			orgBusinessType,
			selectedServiceTypes,
			servicePipelines
		});
		return firstValidationError(errors);
	}

	function toggleService(val: string, checked: boolean) {
		if (checked) {
			if (!selectedServiceTypes.includes(val)) {
				selectedServiceTypes = [...selectedServiceTypes, val];
			}
		} else {
			selectedServiceTypes = selectedServiceTypes.filter((s) => s !== val);
			const nextPipelines = { ...servicePipelines };
			delete nextPipelines[val];
			servicePipelines = nextPipelines;
			affiliateId = '';
		}
		if (submitAttempted) validate();
	}

	function onPipelineChange() {
		affiliateId = '';
		if (submitAttempted) validate();
	}

	function onFieldInput() {
		if (submitAttempted) validate();
	}

	function next() {
		if (activeStep === 1) {
			submitAttempted = true;
			const validationError = validate();
			if (validationError) {
				toast.error(`Could not create ${selectedCategory ?? 'organization'}`, {
					description: validationError
				});
				return;
			}

			try {
				const newId = `ORG-${Date.now().toString().slice(-6)}`;
				onboardingDrafts.add({
					id: newId,
					name: orgName,
					category: selectedCategory!,
					businessType: orgBusinessType || '—',
					phone: orgPhone,
					email: orgEmail,
					serviceTypes: selectedServiceTypes,
					bankPipelines: selectedServiceTypes.map((s) => servicePipelines[s]).filter(Boolean),
					affiliateId,
					status: 'In Progress',
					createdAt: new Date().toISOString().slice(0, 10)
				});

				toast.success(`${selectedCategory} created successfully`, {
					description: `${orgName} has been added. Continue with KYB & compliance.`
				});
				// goto(resolve(`/management/onboarding/${newId}`));
			} catch (error) {
				toast.error(`Failed to create ${selectedCategory ?? 'organization'}`, {
					description:
						error instanceof Error ? error.message : 'Something went wrong. Please try again.'
				});
			}
			return;
		}

		completedSteps = new Set([...completedSteps, activeStep]);
		activeStep += 1;
	}

	function prev() {
		if (activeStep > 0) {
			activeStep -= 1;
		}
	}
</script>

{#if activeStep === 0}
	<ClientTypeStep bind:selectedCategory onNext={next} />
{:else}
	<MerchantProfileStep
		{selectedCategory}
		bind:orgName
		bind:orgPhone
		bind:orgEmail
		bind:orgBusinessType
		bind:selectedServiceTypes
		bind:servicePipelines
		bind:affiliateId
		{errors}
		{businessTypes}
		{availableServiceTypes}
		{availableBankPipelines}
		{affiliatesByPipeline}
		{onFieldInput}
		onToggleService={toggleService}
		{onPipelineChange}
		onPrev={prev}
		onNext={next}
	/>
{/if}
