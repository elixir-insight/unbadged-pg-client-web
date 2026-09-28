<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { toast } from 'svelte-sonner';
	import { toKybPayload, toSectionSnapshot } from '$lib/api/onboarding';
	import { Button, Checkbox } from '$lib/components/reusable';
	import { FieldGrid, FieldRow, FormSection, StepShell } from '$lib/components/self-onboarding';
	import {
		actionFailure,
		advanceFromStep,
		routeSaveError
	} from '$lib/components/self-onboarding/navigation';
	import {
		isProfileComplete,
		isProfileFilled,
		isValidPincode
	} from '$lib/components/self-onboarding/validation';
	import { onboarding } from '$lib/stores/onboarding.svelte';
	import type { Address } from '$lib/types/onboarding';
	import { effectiveRegisteredAddress } from '$lib/utils/onboarding-address';
	import { communicationAddressKey, registeredAddressKey } from '$lib/utils/saveErrorRouting';

	let saving = $state(false);
	let attempted = $state(false);

	const data = $derived(onboarding.formData);
	const details = $derived(data.businessDetails);
	const sameAsCommunication = $derived(details.sameAsCommunication);
	/** Mirrors the communication address live while ticked; the user's own values otherwise. */
	const registered = $derived(effectiveRegisteredAddress(details));
	/** Gates the Continue button — every required field has a value, format not checked yet. */
	const filled = $derived(isProfileFilled(data));
	const canContinue = $derived(isProfileComplete(data));

	function digitsOnly(value: string, maxLength: number): string {
		return value.replace(/\D/g, '').slice(0, maxLength);
	}

	const onSaveEnhance: SubmitFunction = ({ cancel }) => {
		attempted = true;
		// Validation first: an invalid field blocks Continue even when nothing changed.
		if (!canContinue || saving) {
			cancel();
			return;
		}
		const snapshot = toSectionSnapshot('address', toKybPayload(onboarding.formData));
		if (!onboarding.isDirty('address', snapshot)) {
			cancel();
			void advanceFromStep(2);
			return;
		}
		saving = true;
		onboarding.clearFieldSaveError();
		return async ({ result }) => {
			if (result.type === 'success') {
				onboarding.markClean('address', snapshot);
				toast.success('Address saved.');
				// Stays "saving" until the next step (and the refreshed saved state) has loaded.
				await advanceFromStep(2);
				saving = false;
				return;
			}
			saving = false;
			const { message, field } = actionFailure(result);
			toast.error(message);
			await routeSaveError(message, 2, field);
		};
	};
</script>

{#snippet addressFields(
	address: Address,
	update: (patch: Partial<Address>) => void,
	remarkKeyFor: (field: 'address' | 'city' | 'state' | 'pinCode') => string,
	readonly = false
)}
	{@const showErrors = attempted && !readonly}
	<FieldGrid>
		<FieldRow
			label="Address line 1"
			placeholder="Enter your address line 1"
			required
			{readonly}
			remarkKey={remarkKeyFor('address')}
			error={address.line1.trim() ? '' : 'Address is required.'}
			{showErrors}
			value={address.line1}
			oninput={(next) => update({ line1: next })}
		/>
		<FieldRow
			label="Address line 2"
			placeholder="Enter your address line 2"
			{readonly}
			value={address.line2}
			oninput={(next) => update({ line2: next })}
		/>
		<FieldRow
			label="City"
			placeholder="Enter your city"
			required
			{readonly}
			remarkKey={remarkKeyFor('city')}
			error={address.city.trim() ? '' : 'City is required.'}
			{showErrors}
			value={address.city}
			oninput={(next) => update({ city: next })}
		/>
		<FieldRow
			label="State"
			placeholder="Enter your state"
			required
			{readonly}
			remarkKey={remarkKeyFor('state')}
			error={address.state.trim() ? '' : 'State is required.'}
			{showErrors}
			value={address.state}
			oninput={(next) => update({ state: next })}
		/>
		<FieldRow
			label="Pincode"
			placeholder="Enter your pincode"
			required
			{readonly}
			maxlength={6}
			inputmode="numeric"
			remarkKey={remarkKeyFor('pinCode')}
			error={isValidPincode(address.pincode) ? '' : 'Enter a valid 6-digit pincode.'}
			{showErrors}
			value={address.pincode}
			normalize={(next) => digitsOnly(next, 6)}
			oninput={(next) => update({ pincode: next })}
		/>
	</FieldGrid>
{/snippet}

<form id="business-profile-form" method="POST" use:enhance={onSaveEnhance}>
	<input type="hidden" name="payload" value={JSON.stringify(onboarding.formData)} />
</form>

<StepShell>
	<FormSection title="Communication address">
		{@render addressFields(
			details.communicationAddress,
			(patch) => onboarding.updateCommunicationAddress(patch),
			communicationAddressKey
		)}
	</FormSection>

	<FormSection title="Registered address">
		{#snippet action()}
			<Checkbox
				label="Same as communication address"
				bind:checked={() => sameAsCommunication, (next) => onboarding.setSameAsCommunication(next)}
			/>
		{/snippet}
		{@render addressFields(
			registered,
			(patch) => onboarding.updateBusinessAddress(patch),
			registeredAddressKey,
			sameAsCommunication
		)}
	</FormSection>

	{#snippet footer()}
		<Button type="submit" form="business-profile-form" disabled={!filled || saving}>
			{saving ? 'Saving…' : 'Continue'}
		</Button>
	{/snippet}
</StepShell>
