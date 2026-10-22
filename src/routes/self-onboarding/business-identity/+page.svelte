<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { toast } from 'svelte-sonner';
	import { toKybPayload, toSectionSnapshot } from '$lib/api/onboarding';
	import { Button, PhoneInput } from '$lib/components/reusable';
	import { FieldRow, InlineRemark, StepShell } from '$lib/components/self-onboarding';
	import {
		actionFailure,
		advanceFromStep,
		routeSaveError
	} from '$lib/components/self-onboarding/navigation';
	import {
		businessPanError,
		gstinError,
		isCinValid,
		isIdentityComplete,
		isIdentityFilled,
		isTanValid,
		isValidPhone,
		isValidRegisteredYear,
		isValidWebsite,
		MIN_REGISTERED_YEAR
	} from '$lib/components/self-onboarding/validation';
	import { onboarding } from '$lib/stores/onboarding.svelte';
	import { getFieldRemark } from '$lib/utils/remarkRouting';
	import { isMaskedPan } from '$lib/validation/organization-kyb';

	let attempted = $state(false);
	let saving = $state(false);

	const data = $derived(onboarding.formData);
	const details = $derived(data.businessDetails);
	/** Gates the Continue button — every required field has a value, format not checked yet. */
	const filled = $derived(isIdentityFilled(data));
	const canContinue = $derived(isIdentityComplete(data));
	const cinRequired = $derived(data.entityType === 'private_limited');
	const panSaved = $derived(isMaskedPan(data.businessPan));
	const phoneRemark = $derived(getFieldRemark(onboarding.verifications, 'kyb.businessPhone'));
	const remarked = $derived(onboarding.onboardingStatus === 'remarked');
	const phoneInvalid = $derived(details.phone.length > 0 && !isValidPhone(details.phone));
	const phoneSaveError = $derived(onboarding.fieldSaveErrors['kyb.businessPhone'] ?? '');

	function normalizeId(value: string, maxLength: number): string {
		return value
			.replace(/[^a-zA-Z0-9]/g, '')
			.toUpperCase()
			.slice(0, maxLength);
	}

	function handleYearInput(next: string) {
		const digits = next.replace(/\D/g, '').slice(0, 4);
		onboarding.updateBusinessDetails({ registeredYear: digits ? Number(digits) : null });
	}

	function handlePhoneInput(next: string) {
		onboarding.clearFieldSaveError('kyb.businessPhone');
		onboarding.updateBusinessDetails({ phone: next });
	}

	const onSaveEnhance: SubmitFunction = ({ cancel }) => {
		attempted = true;
		// Format checks first — nothing invalid is ever sent.
		if (!canContinue || saving) {
			cancel();
			return;
		}
		const snapshot = toSectionSnapshot('identity', toKybPayload(onboarding.formData));
		if (!onboarding.isDirty('identity', snapshot)) {
			cancel();
			void advanceFromStep(1);
			return;
		}
		saving = true;
		onboarding.clearFieldSaveError();
		return async ({ result }) => {
			if (result.type === 'success') {
				onboarding.markClean('identity', snapshot);
				toast.success('Tax and registration details saved.');
				// Stays "saving" until the next step (and the refreshed saved state) has loaded.
				await advanceFromStep(1);
				saving = false;
				return;
			}
			saving = false;
			const { message, field } = actionFailure(result);
			toast.error(message);
			await routeSaveError(message, 1, field);
		};
	};
</script>

<form id="business-identity-form" method="POST" use:enhance={onSaveEnhance}>
	<input type="hidden" name="payload" value={JSON.stringify(onboarding.formData)} />
</form>

<StepShell>
	<FieldRow
		label="Business PAN"
		required
		monospace
		maxlength={10}
		autocomplete="off"
		placeholder="Enter your business PAN"
		remarkKey="kyb.businessPan"
		hint={panSaved
			? 'Already saved — hidden for security. Type a new PAN only to change it.'
			: '10 characters, format ABCDE1234F.'}
		error={businessPanError(data.businessPan)}
		showErrors={attempted}
		value={data.businessPan}
		normalize={(next) => normalizeId(next, 10)}
		oninput={(next) => onboarding.setBusinessPan(next)}
	/>

	<div class="flex flex-col gap-4">
		<!-- Required by the backend's submit ("required organization fields are incomplete: brandName"). -->
		<FieldRow
			label="Brand name"
			required
			placeholder="Enter your brand name"
			remarkKey="brandName"
			hint="The name customers see, e.g. on payment pages."
			error={details.brandName.trim() ? '' : 'Brand name is required.'}
			showErrors={attempted}
			value={details.brandName}
			oninput={(next) => onboarding.updateBusinessDetails({ brandName: next })}
		/>
		<FieldRow
			label="GSTIN"
			placeholder="Enter your GSTIN"
			required
			monospace
			maxlength={15}
			autocomplete="off"
			remarkKey="kyb.gstNumber"
			hint="15 characters, e.g. 27ABCPE1234F1ZB."
			error={gstinError(data.gstin)}
			showErrors={attempted}
			value={data.gstin}
			normalize={(next) => normalizeId(next, 15)}
			oninput={(next) => onboarding.selectGstin(next)}
		/>
		<FieldRow
			label="CIN"
			placeholder="Enter your 21-character CIN"
			required={cinRequired}
			monospace
			maxlength={21}
			autocomplete="off"
			remarkKey="kyb.cin"
			hint="21 characters, e.g. U12345MH2018PTC123456."
			error={isCinValid(details.cin, data.entityType)
				? ''
				: details.cin
					? 'Enter a valid 21-character CIN.'
					: 'CIN is required for private limited companies.'}
			showErrors={attempted}
			value={details.cin}
			normalize={(next) => normalizeId(next, 21)}
			oninput={(next) => onboarding.updateBusinessDetails({ cin: next })}
		/>
		<FieldRow
			label="TAN"
			placeholder="Enter your 10-character TAN"
			monospace
			maxlength={10}
			autocomplete="off"
			remarkKey="kyb.tan"
			hint="10 characters, e.g. ABCD12345E."
			error={isTanValid(details.tan) ? '' : 'Enter a valid 10-character TAN.'}
			showErrors={attempted}
			value={details.tan}
			normalize={(next) => normalizeId(next, 10)}
			oninput={(next) => onboarding.updateBusinessDetails({ tan: next })}
		/>
		<FieldRow
			label="Industry"
			required
			remarkKey="kyb.industry"
			placeholder="Enter your industry"
			error={details.industry.trim() ? '' : 'Industry is required.'}
			showErrors={attempted}
			value={details.industry}
			oninput={(next) => onboarding.updateBusinessDetails({ industry: next })}
		/>
		<FieldRow
			label="Registered year"
			required
			inputmode="numeric"
			maxlength={4}
			placeholder="Enter your registered year"
			remarkKey="kyb.registeredYear"
			error={isValidRegisteredYear(details.registeredYear)
				? ''
				: `Enter a year between ${MIN_REGISTERED_YEAR} and ${new Date().getFullYear()}.`}
			showErrors={attempted}
			value={details.registeredYear === null ? '' : String(details.registeredYear)}
			normalize={(next) => next.replace(/\D/g, '').slice(0, 4)}
			oninput={handleYearInput}
		/>
		<InlineRemark remark={phoneRemark} fieldKey="kyb.businessPhone">
			<label class="block min-w-0 space-y-1.5">
				<span class="text-sm font-medium text-foreground">
					Business phone <span class="text-destructive">*</span>
				</span>
				<PhoneInput
					placeholder="Enter your phone number"
					value={details.phone}
					disabled={remarked && !phoneRemark}
					invalid={(attempted && phoneInvalid) || Boolean(phoneSaveError)}
					onValueChange={handlePhoneInput}
				/>
				{#if attempted && phoneInvalid}
					<p class="text-xs text-destructive">Enter a valid 10-digit mobile number.</p>
				{:else if phoneSaveError}
					<p class="text-xs text-destructive">{phoneSaveError}</p>
				{/if}
			</label>
		</InlineRemark>
		<FieldRow
			label="Website"
			required
			type="url"
			placeholder="Enter your website URL"
			remarkKey="kyb.organizationWebsite"
			error={isValidWebsite(details.website) ? '' : 'Enter a valid website URL.'}
			showErrors={attempted}
			value={details.website}
			oninput={(next) => onboarding.updateBusinessDetails({ website: next })}
		/>
	</div>

	{#snippet footer()}
		<Button type="submit" form="business-identity-form" disabled={!filled || saving}>
			{saving ? 'Saving…' : 'Continue'}
		</Button>
	{/snippet}
</StepShell>
