<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
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

	let { data }: { data: PageData } = $props();

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

	async function createViaApi() {
		const response = await fetch(resolve('/api/management/onboard/organization'), {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				selectedCategory,
				orgName,
				orgPhone,
				orgEmail,
				orgBusinessType,
				affiliateId,
				selectedServiceTypes,
				servicePipelines
			})
		});

		const payload: unknown = await response.json().catch(() => null);
		const message =
			payload &&
			typeof payload === 'object' &&
			'message' in payload &&
			typeof payload.message === 'string'
				? payload.message
				: `Request failed (${response.status})`;

		if (!response.ok) {
			throw new Error(message);
		}

		const organizationId =
			payload &&
			typeof payload === 'object' &&
			'organizationId' in payload &&
			typeof payload.organizationId === 'string' &&
			payload.organizationId.trim()
				? payload.organizationId.trim()
				: null;

		if (!organizationId) {
			throw new Error('Organization created but no orgId was returned');
		}

		return organizationId;
	}

	async function next() {
		if (activeStep === 1) {
			if (submitting) return;

			submitAttempted = true;
			const validationError = validate();
			if (validationError) {
				toast.error(`Could not create ${selectedCategory ?? 'organization'}`, {
					description: validationError
				});
				return;
			}

			submitting = true;
			try {
				const organizationId = await createViaApi();
				seedLocalOrganization(organizationId);

				await goto(resolve('/management/organizations/[orgId]', { orgId: organizationId }));

				toast.success(`${selectedCategory} created successfully`, {
					description: `${orgName} has been added. Continue with KYB & compliance.`
				});
			} catch (error) {
				toast.error(`Failed to create ${selectedCategory ?? 'organization'}`, {
					description:
						error instanceof Error ? error.message : 'Something went wrong. Please try again.'
				});
			} finally {
				submitting = false;
			}
			return;
		}

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
		onNext={next}
		{submitting}
	/>
{/if}
