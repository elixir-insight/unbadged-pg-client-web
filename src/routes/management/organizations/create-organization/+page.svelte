<script lang="ts">
	import type { SubmitFunction } from '@sveltejs/kit';
	import { toast } from 'svelte-sonner';
	import { ClientTypeStep, MerchantProfileStep } from '$lib/components/onboarding';
	import {
		createOrganization,
		organizations,
		type OrganizationBusinessType,
		type OrganizationCategory,
		type OrganizationServiceType
	} from '$lib/data/mockData';
	import {
		type ClientType,
		businessTypes,
		availableServiceTypes,
		affiliatesByPipeline
	} from './constants';
	import { firstValidationError, validateCreateOrganization } from './validation';
	import type { PageData } from './$types';

	let { data, form }: { data: PageData; form: { message?: string } | null } = $props();

	const businessTypeEnumMap: Record<string, OrganizationBusinessType> = {
		'Sole Proprietorship': 'SOLE_PROPRIETORSHIP',
		Partnership: 'PARTNERSHIP',
		LLP: 'LLP',
		'Private Limited': 'PRIVATE_LIMITED'
	};

	const serviceTypeMap: Record<string, OrganizationServiceType> = {
		Payouts: 'Payouts',
		'Pay-Ins': 'Pay-Ins'
	};

	const bankPipelinesByService = $derived({
		'Pay-Ins': data.payinPipelines,
		Payouts: data.payoutPipelines
	});

	function toOrganizationServiceTypes(selected: string[]): OrganizationServiceType[] {
		return selected
			.map((value) => serviceTypeMap[value])
			.filter((value): value is OrganizationServiceType => value !== undefined);
	}

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
	let submitting = $state(false);

	$effect(() => {
		if (data.pipelinesError) {
			toast.error('Could not load bank pipelines', {
				description: data.pipelinesError
			});
		}
	});

	$effect(() => {
		if (form?.message) {
			toast.error(`Failed to create ${selectedCategory ?? 'organization'}`, {
				description: form.message
			});
		}
	});

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

	function seedLocalOrganization(organizationId: string) {
		const category = selectedCategory!.toUpperCase() as OrganizationCategory;
		const businessType =
			businessTypeEnumMap[orgBusinessType] ?? ('PRIVATE_LIMITED' as OrganizationBusinessType);

		const existing = organizations.find((candidate) => candidate.id === organizationId);
		if (existing) return;

		const result = createOrganization({
			id: organizationId,
			name: orgName,
			businessType,
			category,
			status: 'IN_PROGRESS',
			kybStatus: 'Not Started',
			createdAt: new Date().toISOString().slice(0, 10),
			assignedAdmin: 'Sarah Chen',
			serviceTypes: toOrganizationServiceTypes(selectedServiceTypes)
		});

		organizations.push(result);
	}

	function extractOrgIdFromRedirect(location: string): string | null {
		const match = location.match(/\/management\/organizations\/([^/]+)/);
		return match?.[1] ?? null;
	}

	const onEnhance: SubmitFunction = ({ cancel }) => {
		submitAttempted = true;
		const validationError = validate();
		if (validationError) {
			toast.error(`Could not create ${selectedCategory ?? 'organization'}`, {
				description: validationError
			});
			cancel();
			return;
		}

		submitting = true;
		return async ({ result, update }) => {
			submitting = false;

			if (result.type === 'redirect') {
				const organizationId = extractOrgIdFromRedirect(result.location);
				if (organizationId) {
					seedLocalOrganization(organizationId);
				}
				toast.success(`${selectedCategory} created successfully`, {
					description: `${orgName} has been added. Continue with KYB & compliance.`
				});
			}

			await update({ reset: false });
		};
	};

	function next() {
		completedSteps = new Set([...completedSteps, activeStep]);
		activeStep += 1;
	}

	function prev() {
		if (activeStep > 0 && !submitting) {
			activeStep -= 1;
			errors = {};
			submitAttempted = false;
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
		{bankPipelinesByService}
		{affiliatesByPipeline}
		{onFieldInput}
		onToggleService={toggleService}
		{onPipelineChange}
		onPrev={prev}
		{submitting}
		{onEnhance}
	/>
{/if}
