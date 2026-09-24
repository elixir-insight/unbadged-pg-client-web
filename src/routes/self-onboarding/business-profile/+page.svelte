<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/reusable';
	import { FieldGrid, FieldRow, FormSection, StepShell } from '$lib/components/self-onboarding';
	import { advanceFromStep, routeSaveError } from '$lib/components/self-onboarding/navigation';
	import {
		isProfileComplete,
		isProfileFilled,
		isValidPincode
	} from '$lib/components/self-onboarding/validation';
	import { onboarding } from '$lib/stores/onboarding.svelte';
	import type { Address } from '$lib/types/onboarding';

	let saving = $state(false);
	let saveError = $state('');
	let attempted = $state(false);

	const data = $derived(onboarding.formData);
	const details = $derived(data.businessDetails);
	/** Gates the Continue button — every required field has a value, format not checked yet. */
	const filled = $derived(isProfileFilled(data));
	const canContinue = $derived(isProfileComplete(data));

	function digitsOnly(value: string, maxLength: number): string {
		return value.replace(/\D/g, '').slice(0, maxLength);
	}

	function actionErrorMessage(data: unknown): string {
		if (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string') {
			return data.error;
		}
		return 'Could not save your address. Please try again.';
	}

	const onSaveEnhance: SubmitFunction = ({ cancel }) => {
		attempted = true;
		if (!canContinue || saving) {
			cancel();
			return;
		}
		saving = true;
		saveError = '';
		return async ({ result }) => {
			saving = false;
			if (result.type === 'success') {
				toast.success('Address saved.');
				await advanceFromStep(2);
				return;
			}
			const message =
				result.type === 'failure'
					? actionErrorMessage(result.data)
					: 'Could not save your address. Please try again.';
			toast.error(message);
			saveError = await routeSaveError(message, 2);
		};
	};
</script>

{#snippet addressFields(
	address: Address,
	update: (patch: Partial<Address>) => void,
	remarkPrefix: string
)}
	<FieldGrid>
		<FieldRow
			label="Address line 1"
			placeholder="Enter your address line 1"
			required
			remarkKey={remarkPrefix ? `${remarkPrefix}.address` : ''}
			error={address.line1.trim() ? '' : 'Address is required.'}
			showErrors={attempted}
			value={address.line1}
			oninput={(next) => update({ line1: next })}
		/>
		<FieldRow
			label="Address line 2"
			placeholder="Enter your address line 2"
			value={address.line2}
			oninput={(next) => update({ line2: next })}
		/>
		<FieldRow
			label="City"
			placeholder="Enter your city"
			required
			remarkKey={remarkPrefix ? `${remarkPrefix}.city` : ''}
			error={address.city.trim() ? '' : 'City is required.'}
			showErrors={attempted}
			value={address.city}
			oninput={(next) => update({ city: next })}
		/>
		<FieldRow
			label="State"
			placeholder="Enter your state"
			required
			remarkKey={remarkPrefix ? `${remarkPrefix}.state` : ''}
			error={address.state.trim() ? '' : 'State is required.'}
			showErrors={attempted}
			value={address.state}
			oninput={(next) => update({ state: next })}
		/>
		<FieldRow
			label="Pincode"
			placeholder="Enter your pincode"
			required
			maxlength={6}
			inputmode="numeric"
			remarkKey={remarkPrefix ? `${remarkPrefix}.pinCode` : ''}
			error={isValidPincode(address.pincode) ? '' : 'Enter a valid 6-digit pincode.'}
			showErrors={attempted}
			value={address.pincode}
			normalize={(next) => digitsOnly(next, 6)}
			oninput={(next) => update({ pincode: next })}
		/>
	</FieldGrid>
{/snippet}

<form id="business-profile-form" method="POST" use:enhance={onSaveEnhance}>
	<input type="hidden" name="payload" value={JSON.stringify(onboarding.formData)} />
</form>

<StepShell error={saveError}>
	<FormSection title="Communication address">
		<FieldRow
			label="Communication address"
			placeholder="Enter your communication address"
			required
			remarkKey="kyb.communicationAddress"
			error={details.communicationAddress.trim() ? '' : 'Communication address is required.'}
			showErrors={attempted}
			value={details.communicationAddress}
			oninput={(next) => onboarding.updateBusinessDetails({ communicationAddress: next })}
		/>
	</FormSection>

	<FormSection title="Registered address">
		{@render addressFields(
			details.address,
			(patch) => onboarding.updateBusinessAddress(patch),
			'addressDetails'
		)}
	</FormSection>

	{#snippet footer()}
		<Button type="submit" form="business-profile-form" disabled={!filled || saving}>
			{saving ? 'Saving…' : 'Continue'}
		</Button>
	{/snippet}
</StepShell>
