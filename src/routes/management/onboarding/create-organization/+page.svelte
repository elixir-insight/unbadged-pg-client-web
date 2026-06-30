<script lang="ts">
	import * as v from 'valibot';
	import { toast } from 'svelte-sonner';
	import { onboardingDrafts } from '$lib/stores/onboarding-draft.svelte';
	import { ClientTypeStep, MerchantProfileStep } from '$lib/components/onboarding';
	import {
		type ClientType,
		categories,
		businessTypes,
		availableServiceTypes,
		availableBankPipelines,
		affiliatesByPipeline
	} from './constants';

	const orgSchema = v.object({
		orgName: v.pipe(v.string(), v.trim(), v.minLength(1, 'Organization name is required')),
		orgPhone: v.pipe(
			v.string(),
			v.trim(),
			v.minLength(1, 'Mobile number is required'),
			v.check(
				(val) => /^[6-9]\d{9}$/.test(val.replace(/\D/g, '')),
				'Enter a valid 10-digit Indian mobile number'
			)
		),
		orgEmail: v.pipe(
			v.string(),
			v.trim(),
			v.minLength(1, 'Email address is required'),
			v.email('Enter a valid email address')
		),
		orgBusinessType: v.pipe(v.string(), v.minLength(1, 'Business type is required'))
	});

	let activeStep = $state(0);
	let completedSteps = $state(new Set<number>());
	let selectedCategory = $state<ClientType | null>(null);

	let orgName = $state('');
	let orgPhone = $state('');
	let orgEmail = $state('');
	let orgBusinessType = $state('');
	let selectedServiceTypes = $state<string[]>([]);
	let selectedBankPipeline = $state('');
	let affiliateId = $state('');

	let errors = $state<Record<string, string>>({});
	let submitAttempted = $state(false);

	function validate(): boolean {
		const e: Record<string, string> = {};

		const result = v.safeParse(orgSchema, { orgName, orgPhone, orgEmail, orgBusinessType });
		if (!result.success) {
			for (const issue of result.issues) {
				const key = issue.path?.[0]?.key as string | undefined;
				if (key && !e[key]) e[key] = issue.message;
			}
		}

		if (selectedCategory === 'Merchant') {
			if (selectedServiceTypes.length === 0) e.serviceTypes = 'Select at least one service type';
			if (!selectedBankPipeline) e.bankPipelines = 'Select a bank pipeline';
		}

		errors = e;
		return Object.keys(e).length === 0;
	}

	const stepCanContinue = $derived<Record<number, boolean>>({
		0: selectedCategory !== null,
		1: true
	});

	function toggleService(val: string) {
		selectedServiceTypes = selectedServiceTypes.includes(val)
			? selectedServiceTypes.filter((s) => s !== val)
			: [...selectedServiceTypes, val];
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
			if (!validate()) return;

			const newId = `ORG-${Date.now().toString().slice(-6)}`;
			onboardingDrafts.add({
				id: newId,
				name: orgName,
				category: selectedCategory!,
				businessType: orgBusinessType || '—',
				phone: orgPhone,
				email: orgEmail,
				serviceTypes: selectedServiceTypes,
				bankPipelines: selectedBankPipeline ? [selectedBankPipeline] : [],
				affiliateId,
				status: 'In Progress',
				createdAt: new Date().toISOString().slice(0, 10)
			});

			toast.success(`${selectedCategory} profile created`, {
				description: `${orgName} has been added. Continue with KYB & compliance.`
			});
			// goto(resolve(`/management/onboarding/${newId}`));
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
	<ClientTypeStep
		{categories}
		bind:selectedCategory
		canContinue={stepCanContinue[0]}
		onNext={next}
	/>
{:else}
	<MerchantProfileStep
		{selectedCategory}
		{categories}
		bind:orgName
		bind:orgPhone
		bind:orgEmail
		bind:orgBusinessType
		bind:selectedServiceTypes
		bind:selectedBankPipeline
		bind:affiliateId
		{errors}
		{businessTypes}
		{availableServiceTypes}
		{availableBankPipelines}
		{affiliatesByPipeline}
		{onFieldInput}
		onToggleService={toggleService}
		{onPipelineChange}
		onChangeClientType={() => (activeStep = 0)}
		onPrev={prev}
		onNext={next}
	/>
{/if}
