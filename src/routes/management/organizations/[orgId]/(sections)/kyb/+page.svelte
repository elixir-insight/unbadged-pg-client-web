<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { untrack } from 'svelte';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { toast } from 'svelte-sonner';
	import { Button, Checkbox, Input } from '$lib/components/reusable';
	import { Pencil, Plus, Trash2 } from '$lib/assets/icons';
	import { createMissingDirectorDocument } from '$lib/data/mockData';
	import { cn } from '$lib/utils';
	import {
		addressStepFieldsEqual,
		directorsStepFieldsEqual,
		firstValidationError,
		formatAadharInput,
		legalStepFieldsEqual,
		normalizePanInput,
		validateAddressStep,
		validateDirectorsStep,
		validateLegalStep
	} from '$lib/validation/organization-kyb';
	import {
		addressesEqual,
		cloneOrganization,
		getAdjacentFlowSteps,
		flowStepHref,
		type FlowStepKey
	} from '../../helpers';

	type DirectorTextField = 'name' | 'pan' | 'email' | 'phone' | 'aadhar';
	type AddressField = 'line1' | 'line2' | 'city' | 'state' | 'pincode' | 'country';

	type KybStep = Extract<FlowStepKey, 'legal' | 'address' | 'directors'>;

	const stepIds = new Set<string>(['legal', 'address', 'directors']);

	const stepCopy: Record<KybStep, { title: string; description: string }> = {
		legal: {
			title: 'Business Registration',
			description: 'Enter legal registration and business details.'
		},
		address: {
			title: 'Address',
			description: 'Provide the registered and communication addresses.'
		},
		directors: {
			title: 'Directors',
			description: 'Add at least one director before approval.'
		}
	};

	let { data } = $props();

	const organization = $derived(data.organization);
	const orgId = $derived(organization.id);

	let editableKyb = $state(untrack(() => cloneOrganization(organization.kyb)));
	let editableDirectors = $state(untrack(() => cloneOrganization(organization.directors)));
	let baselineKyb = $state(untrack(() => cloneOrganization(organization.kyb)));
	let baselineDirectors = $state(untrack(() => cloneOrganization(organization.directors)));
	let baselineSameAsRegistered = $state(
		untrack(() =>
			addressesEqual(organization.kyb.registeredAddress, organization.kyb.communicationAddress)
		)
	);
	let lastOrgId = $state(untrack(() => organization.id));
	let sameAsRegistered = $state(
		untrack(() =>
			addressesEqual(organization.kyb.registeredAddress, organization.kyb.communicationAddress)
		)
	);
	let expandedDirectorId = $state<string | null>(null);
	let fieldErrors = $state<Record<string, string>>({});
	let saving = $state(false);
	let formElement = $state<HTMLFormElement | null>(null);

	function captureBaseline() {
		baselineKyb = cloneOrganization(editableKyb);
		baselineDirectors = cloneOrganization(editableDirectors);
		baselineSameAsRegistered = sameAsRegistered;
	}

	function syncFromOrganization() {
		editableKyb = cloneOrganization(organization.kyb);
		editableDirectors = cloneOrganization(organization.directors);
		sameAsRegistered = addressesEqual(
			organization.kyb.registeredAddress,
			organization.kyb.communicationAddress
		);
		captureBaseline();
	}

	$effect(() => {
		if (organization.id !== lastOrgId) {
			syncFromOrganization();
			lastOrgId = organization.id;
			expandedDirectorId = null;
			fieldErrors = {};
		}
	});

	$effect(() => {
		if (!sameAsRegistered) return;
		editableKyb.communicationAddress = {
			line1: editableKyb.registeredAddress.line1,
			line2: editableKyb.registeredAddress.line2,
			city: editableKyb.registeredAddress.city,
			state: editableKyb.registeredAddress.state,
			pincode: editableKyb.registeredAddress.pincode,
			country: editableKyb.registeredAddress.country
		};
	});

	const currentStep = $derived.by((): KybStep => {
		const step = page.url.searchParams.get('step') ?? 'legal';
		return stepIds.has(step) ? (step as KybStep) : 'legal';
	});

	const adjacent = $derived(getAdjacentFlowSteps(currentStep));
	const meta = $derived(stepCopy[currentStep]);

	$effect(() => {
		void currentStep;
		fieldErrors = {};
	});

	function collectStepValidationErrors(): Record<string, string> {
		if (currentStep === 'legal') {
			return validateLegalStep({
				gstin: editableKyb.gstin,
				businessPan: editableKyb.businessPan,
				businessPhone: editableKyb.businessPhone,
				industry: editableKyb.industry,
				organizationWebsite: editableKyb.organizationWebsite,
				registeredYear: editableKyb.registeredYear,
				cin: editableKyb.cin,
				tan: editableKyb.tan,
				businessType: editableKyb.businessType
			});
		}

		if (currentStep === 'address') {
			return validateAddressStep({
				registeredAddress: editableKyb.registeredAddress,
				communicationAddress: editableKyb.communicationAddress
			});
		}

		return validateDirectorsStep(editableDirectors);
	}

	function clearFieldError(key: string) {
		if (!fieldErrors[key]) return;
		const next = { ...fieldErrors };
		delete next[key];
		fieldErrors = next;
	}

	function saveKyb() {
		Object.assign(organization.kyb, cloneOrganization(editableKyb));
		organization.directors = cloneOrganization(editableDirectors);
		organization.kyb.directors = organization.directors;
		organization.addressDetails = cloneOrganization(editableKyb.registeredAddress);
	}

	function validateCurrentStep(): string | null {
		fieldErrors = collectStepValidationErrors();
		return firstValidationError(fieldErrors);
	}

	const canProceed = $derived(firstValidationError(collectStepValidationErrors()) === null);

	function isCurrentStepUnchanged(): boolean {
		if (currentStep === 'legal') {
			return legalStepFieldsEqual(editableKyb, baselineKyb);
		}

		if (currentStep === 'address') {
			return addressStepFieldsEqual(
				{
					registeredAddress: editableKyb.registeredAddress,
					communicationAddress: editableKyb.communicationAddress
				},
				{
					registeredAddress: baselineKyb.registeredAddress,
					communicationAddress: baselineKyb.communicationAddress
				},
				sameAsRegistered,
				baselineSameAsRegistered
			);
		}

		return directorsStepFieldsEqual(editableDirectors, baselineDirectors);
	}

	function handleNext() {
		const validationError = validateCurrentStep();
		if (validationError) {
			toast.error('Please fix the highlighted fields', { description: validationError });
			return;
		}

		if (isCurrentStepUnchanged()) {
			saveKyb();
			navigateAfterSave();
			return;
		}

		saveKyb();
		formElement?.requestSubmit();
	}

	function buildFormPayload() {
		return {
			businessType: editableKyb.businessType,
			gstin: editableKyb.gstin,
			businessPan: editableKyb.businessPan,
			businessPhone: editableKyb.businessPhone,
			industry: editableKyb.industry,
			organizationWebsite: editableKyb.organizationWebsite,
			registeredYear: editableKyb.registeredYear,
			cin: editableKyb.cin,
			tan: editableKyb.tan,
			registeredAddress: editableKyb.registeredAddress,
			communicationAddress: editableKyb.communicationAddress,
			directors: editableDirectors.map((director) => ({
				name: director.name,
				pan: director.pan,
				email: director.email,
				phone: director.phone,
				aadhar: director.aadhar
			}))
		};
	}

	function navigateAfterSave() {
		const nextStep = adjacent.next?.key ?? 'review';
		const href = resolve(flowStepHref(orgId, nextStep) as '/');
		const isKybSubStep = nextStep === 'legal' || nextStep === 'address' || nextStep === 'directors';

		goto(href, {
			replaceState: isKybSubStep,
			noScroll: isKybSubStep,
			keepFocus: isKybSubStep,
			invalidateAll: isKybSubStep ? false : undefined
		});
	}

	const onEnhance: SubmitFunction = ({ formData, cancel }) => {
		if (isCurrentStepUnchanged()) {
			cancel();
			saveKyb();
			navigateAfterSave();
			return;
		}

		const validationError = validateCurrentStep();
		if (validationError) {
			toast.error('Please fix the highlighted fields', { description: validationError });
			cancel();
			return;
		}

		saveKyb();
		formData.set('section', currentStep);
		formData.set('payload', JSON.stringify(buildFormPayload()));

		saving = true;
		return async ({ result, update }) => {
			saving = false;

			if (result.type === 'failure') {
				const message =
					result.data &&
					typeof result.data === 'object' &&
					'message' in result.data &&
					typeof result.data.message === 'string'
						? result.data.message
						: 'Something went wrong. Please try again.';
				toast.error('Failed to update organization', { description: message });
				await update({ reset: false });
				return;
			}

			if (result.type === 'success') {
				const message =
					result.data &&
					typeof result.data === 'object' &&
					'message' in result.data &&
					typeof result.data.message === 'string'
						? result.data.message
						: 'Saved successfully';
				const sectionLabel =
					currentStep === 'legal'
						? 'Legal details'
						: currentStep === 'address'
							? 'Address'
							: 'Directors';
				toast.success(`${sectionLabel} saved`, { description: message });
				captureBaseline();
				await update({ reset: false });
				navigateAfterSave();
				return;
			}

			await update({ reset: false });
		};
	};

	function updateRegisteredAddress(field: AddressField, value: string) {
		clearFieldError(`registeredAddress.${field}`);
		editableKyb.registeredAddress[field] = value;
	}

	function updateCommunicationAddress(field: AddressField, value: string) {
		clearFieldError(`communicationAddress.${field}`);
		sameAsRegistered = false;
		editableKyb.communicationAddress[field] = value;
	}

	function addDirector() {
		const id = `director-${Date.now()}`;
		editableDirectors = [
			...editableDirectors,
			{
				id,
				name: '',
				pan: '',
				email: '',
				phone: '',
				aadhar: '',
				aadharDocument: createMissingDirectorDocument(`${id}-aadhar`),
				panDocument: createMissingDirectorDocument(`${id}-pan`)
			}
		];
		expandedDirectorId = id;
	}

	function removeDirector(id: string) {
		editableDirectors = editableDirectors.filter((director) => director.id !== id);
		if (expandedDirectorId === id) {
			expandedDirectorId = null;
		}
	}

	function updateDirector(id: string, field: DirectorTextField, value: string) {
		const index = editableDirectors.findIndex((director) => director.id === id);
		const normalized =
			field === 'pan'
				? normalizePanInput(value)
				: field === 'aadhar'
					? formatAadharInput(value)
					: value;
		editableDirectors = editableDirectors.map((director) =>
			director.id === id ? { ...director, [field]: normalized } : director
		);
		if (index >= 0) {
			clearFieldError(`directors.${index}.${field}`);
		}
	}
</script>

{#snippet textField(
	label: string,
	value: string,
	onChange: (value: string) => void,
	errorKey = '',
	placeholder = '',
	type: 'text' | 'email' | 'tel' | 'url' | 'number' = 'text',
	disabled = false
)}
	{@const error = errorKey ? fieldErrors[errorKey] : undefined}
	<label class="space-y-2">
		<span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
		<Input
			{type}
			{value}
			{disabled}
			aria-invalid={error ? 'true' : undefined}
			class={cn(error && 'border-destructive focus-visible:ring-destructive/30')}
			oninput={(event) => {
				if (errorKey) clearFieldError(errorKey);
				onChange((event.currentTarget as HTMLInputElement).value);
			}}
			{placeholder}
		/>
		{#if error}
			<p class="text-xs text-destructive">{error}</p>
		{/if}
	</label>
{/snippet}

<form
	method="POST"
	action="?/saveSection"
	use:enhance={onEnhance}
	class="space-y-6"
	bind:this={formElement}
>
	<div>
		<h2 class="text-base font-semibold">{meta.title}</h2>
		<p class="mt-1 text-sm text-muted-foreground">{meta.description}</p>
	</div>

	{#if currentStep === 'legal'}
		<div class="grid gap-4 md:grid-cols-2">
			{@render textField(
				'GSTIN',
				editableKyb.gstin,
				(value) => {
					editableKyb.gstin = value;
				},
				'gstin'
			)}
			{@render textField(
				'Business PAN',
				editableKyb.businessPan,
				(value) => {
					editableKyb.businessPan = value;
				},
				'businessPan'
			)}
			{@render textField(
				'Business phone',
				editableKyb.businessPhone,
				(value) => {
					editableKyb.businessPhone = value;
				},
				'businessPhone',
				'',
				'tel'
			)}
			{@render textField(
				'Industry',
				editableKyb.industry,
				(value) => {
					editableKyb.industry = value;
				},
				'industry'
			)}
			{@render textField(
				'Organization website',
				editableKyb.organizationWebsite,
				(value) => {
					editableKyb.organizationWebsite = value;
				},
				'organizationWebsite',
				'',
				'url'
			)}
			{@render textField(
				'Registered year',
				editableKyb.registeredYear == null ? '' : String(editableKyb.registeredYear),
				(value) => {
					editableKyb.registeredYear = value === '' ? null : Number(value);
				},
				'registeredYear',
				'',
				'number'
			)}
			{@render textField(
				editableKyb.businessType === 'Private Limited' ? 'CIN' : 'CIN (optional)',
				editableKyb.cin,
				(value) => {
					editableKyb.cin = value;
				},
				'cin'
			)}
			{@render textField(
				'TAN (optional)',
				editableKyb.tan,
				(value) => {
					editableKyb.tan = value;
				},
				'tan'
			)}
		</div>
	{:else if currentStep === 'address'}
		<div class="space-y-6">
			<div class="space-y-4">
				<h3 class="text-sm font-medium">Registered Address</h3>
				<div class="grid gap-4 md:grid-cols-2">
					{@render textField(
						'Address Line 1',
						editableKyb.registeredAddress.line1,
						(value) => {
							updateRegisteredAddress('line1', value);
						},
						'registeredAddress.line1'
					)}
					{@render textField(
						'Address Line 2',
						editableKyb.registeredAddress.line2,
						(value) => {
							updateRegisteredAddress('line2', value);
						},
						'registeredAddress.line2'
					)}
					{@render textField(
						'City',
						editableKyb.registeredAddress.city,
						(value) => {
							updateRegisteredAddress('city', value);
						},
						'registeredAddress.city'
					)}
					{@render textField(
						'State',
						editableKyb.registeredAddress.state,
						(value) => {
							updateRegisteredAddress('state', value);
						},
						'registeredAddress.state'
					)}
					{@render textField(
						'Pincode',
						editableKyb.registeredAddress.pincode,
						(value) => {
							updateRegisteredAddress('pincode', value);
						},
						'registeredAddress.pincode'
					)}
					{@render textField(
						'Country',
						editableKyb.registeredAddress.country,
						(value) => {
							updateRegisteredAddress('country', value);
						},
						'registeredAddress.country'
					)}
				</div>
			</div>

			<div class="space-y-4">
				<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<h3 class="text-sm font-medium">Communication Address</h3>
					<Checkbox label="Same as registered address" bind:checked={sameAsRegistered} />
				</div>
				<div class="grid gap-4 md:grid-cols-2">
					{@render textField(
						'Address Line 1',
						editableKyb.communicationAddress.line1,
						(value) => {
							updateCommunicationAddress('line1', value);
						},
						'communicationAddress.line1',
						'',
						'text',
						sameAsRegistered
					)}
					{@render textField(
						'Address Line 2',
						editableKyb.communicationAddress.line2,
						(value) => {
							updateCommunicationAddress('line2', value);
						},
						'communicationAddress.line2',
						'',
						'text',
						sameAsRegistered
					)}
					{@render textField(
						'City',
						editableKyb.communicationAddress.city,
						(value) => {
							updateCommunicationAddress('city', value);
						},
						'communicationAddress.city',
						'',
						'text',
						sameAsRegistered
					)}
					{@render textField(
						'State',
						editableKyb.communicationAddress.state,
						(value) => {
							updateCommunicationAddress('state', value);
						},
						'communicationAddress.state',
						'',
						'text',
						sameAsRegistered
					)}
					{@render textField(
						'Pincode',
						editableKyb.communicationAddress.pincode,
						(value) => {
							updateCommunicationAddress('pincode', value);
						},
						'communicationAddress.pincode',
						'',
						'text',
						sameAsRegistered
					)}
					{@render textField(
						'Country',
						editableKyb.communicationAddress.country,
						(value) => {
							updateCommunicationAddress('country', value);
						},
						'communicationAddress.country',
						'',
						'text',
						sameAsRegistered
					)}
				</div>
			</div>
		</div>
	{:else}
		<div class="space-y-4">
			<div class="flex items-center justify-end">
				<Button variant="outline" size="sm" onclick={addDirector}>
					<Plus class="size-4" />
					Add Director
				</Button>
			</div>

			{#if editableDirectors.length === 0}
				<p class="text-sm text-muted-foreground">Add at least one director before approval.</p>
			{:else}
				<div class="space-y-3">
					{#each editableDirectors as director, index (director.id)}
						{@const isExpanded = expandedDirectorId === director.id}
						<div class="rounded-xl border border-border/60 p-4">
							{#if isExpanded}
								<div class="mb-4 flex items-center justify-between">
									<p class="text-sm font-medium">{director.name || 'New director'}</p>
									<div class="flex flex-wrap gap-2">
										<Button variant="ghost" size="sm" onclick={() => (expandedDirectorId = null)}>
											Done
										</Button>
										{#if editableDirectors.length > 1}
											<Button
												variant="ghost"
												size="icon-sm"
												class="text-destructive hover:bg-destructive/10 hover:text-destructive"
												aria-label="Remove director"
												onclick={() => removeDirector(director.id)}
											>
												<Trash2 class="size-4" />
											</Button>
										{/if}
									</div>
								</div>
								<div class="grid gap-4 md:grid-cols-2">
									{@render textField(
										'Name',
										director.name,
										(value) => updateDirector(director.id, 'name', value),
										`directors.${index}.name`
									)}
									{@render textField(
										'PAN',
										director.pan,
										(value) => updateDirector(director.id, 'pan', value),
										`directors.${index}.pan`,
										'ABCDE1234F'
									)}
									{@render textField(
										'Aadhar',
										director.aadhar,
										(value) => updateDirector(director.id, 'aadhar', value),
										`directors.${index}.aadhar`,
										'XXXX XXXX XXXX'
									)}
									{@render textField(
										'Email',
										director.email,
										(value) => updateDirector(director.id, 'email', value),
										`directors.${index}.email`,
										'',
										'email'
									)}
									{@render textField(
										'Phone',
										director.phone,
										(value) => updateDirector(director.id, 'phone', value),
										`directors.${index}.phone`,
										'',
										'tel'
									)}
								</div>
							{:else}
								<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
									<div class="space-y-0.5">
										<p class="text-sm font-medium">{director.name || 'New director'}</p>
										<p class="text-sm text-muted-foreground">
											PAN {director.pan || '—'} · Aadhar {director.aadhar || '—'}
										</p>
									</div>
									<div class="flex flex-wrap gap-2">
										<Button
											variant="outline"
											size="icon-sm"
											aria-label="Edit director"
											onclick={() => (expandedDirectorId = director.id)}
										>
											<Pencil class="size-4" />
										</Button>
										{#if editableDirectors.length > 1}
											<Button
												variant="ghost"
												size="icon-sm"
												class="text-destructive hover:bg-destructive/10 hover:text-destructive"
												aria-label="Remove director"
												onclick={() => removeDirector(director.id)}
											>
												<Trash2 class="size-4" />
											</Button>
										{/if}
									</div>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	<div class="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
		<Button variant="outline" href="/management/organizations">Cancel</Button>
		<Button type="button" disabled={saving || !canProceed} onclick={handleNext}>
			{saving
				? 'Saving…'
				: adjacent.next?.key === 'review' || !adjacent.next
					? 'Review & approve'
					: 'Next step'}
		</Button>
	</div>
</form>
