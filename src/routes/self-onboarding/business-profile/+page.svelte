<script lang="ts">
	import { saveOrganization } from '$lib/api/onboarding';
	import { Button, PhoneInput } from '$lib/components/reusable';
	import {
		FieldGrid,
		FieldRow,
		FormSection,
		InlineRemark,
		StepShell
	} from '$lib/components/self-onboarding';
	import { advanceFromStep, routeSaveError } from '$lib/components/self-onboarding/navigation';
	import {
		isProfileComplete,
		isValidPhone,
		isValidPincode,
		isValidWebsite
	} from '$lib/components/self-onboarding/validation';
	import { onboarding } from '$lib/stores/onboarding.svelte';
	import type { Address } from '$lib/types/onboarding';
	import { getFieldRemark } from '$lib/utils/remarkRouting';

	let saving = $state(false);
	let saveError = $state('');

	const data = $derived(onboarding.formData);
	const details = $derived(data.businessDetails);
	const canContinue = $derived(isProfileComplete(data));
	const phoneRemark = $derived(getFieldRemark(onboarding.verifications, 'kyb.businessPhone'));
	const phoneInvalid = $derived(details.phone.length > 0 && !isValidPhone(details.phone));

	function digitsOnly(value: string, maxLength: number): string {
		return value.replace(/\D/g, '').slice(0, maxLength);
	}

	async function continueToBank() {
		if (!canContinue || saving) return;
		saving = true;
		saveError = '';
		try {
			await saveOrganization(onboarding.formData);
		} catch (error) {
			const message =
				error instanceof Error && error.message
					? error.message
					: 'Could not save your business profile. Please try again.';
			saveError = await routeSaveError(message, 2);
			saving = false;
			return;
		}
		saving = false;
		await advanceFromStep(2);
	}
</script>

{#snippet addressFields(
	address: Address,
	update: (patch: Partial<Address>) => void,
	remarkPrefix: string
)}
	<FieldGrid>
		<FieldRow
			label="Address line 1"
			required
			remarkKey={remarkPrefix ? `${remarkPrefix}.address` : ''}
			error={address.line1.trim() ? '' : 'Address is required.'}
			value={address.line1}
			oninput={(next) => update({ line1: next })}
		/>
		<FieldRow
			label="Address line 2"
			value={address.line2}
			oninput={(next) => update({ line2: next })}
		/>
		<FieldRow
			label="City"
			required
			remarkKey={remarkPrefix ? `${remarkPrefix}.city` : ''}
			error={address.city.trim() ? '' : 'City is required.'}
			value={address.city}
			oninput={(next) => update({ city: next })}
		/>
		<FieldRow
			label="State"
			required
			remarkKey={remarkPrefix ? `${remarkPrefix}.state` : ''}
			error={address.state.trim() ? '' : 'State is required.'}
			value={address.state}
			oninput={(next) => update({ state: next })}
		/>
		<FieldRow
			label="Pincode"
			required
			maxlength={6}
			inputmode="numeric"
			remarkKey={remarkPrefix ? `${remarkPrefix}.pinCode` : ''}
			error={isValidPincode(address.pincode) ? '' : 'Enter a valid 6-digit pincode.'}
			value={address.pincode}
			normalize={(next) => digitsOnly(next, 6)}
			oninput={(next) => update({ pincode: next })}
		/>
	</FieldGrid>
{/snippet}

<StepShell error={saveError}>
	<FormSection title="Business">
		<FieldGrid>
			<FieldRow
				label="Brand / store name"
				required
				remarkKey="brandName"
				error={details.brandName.trim() ? '' : 'Brand name is required.'}
				value={details.brandName}
				oninput={(next) => onboarding.updateBusinessDetails({ brandName: next })}
			/>
			<InlineRemark remark={phoneRemark} fieldKey="kyb.businessPhone">
				<label class="block min-w-0 space-y-1.5">
					<span class="text-sm font-medium text-foreground">
						Business phone <span class="text-destructive">*</span>
					</span>
					<PhoneInput
						value={details.phone}
						invalid={phoneInvalid}
						onValueChange={(next) => onboarding.updateBusinessDetails({ phone: next })}
					/>
					{#if phoneInvalid}
						<p class="text-xs text-destructive">Enter a valid 10-digit mobile number.</p>
					{/if}
				</label>
			</InlineRemark>
			<FieldRow
				label="Website"
				required
				type="url"
				placeholder="https://example.com"
				remarkKey="kyb.organizationWebsite"
				error={isValidWebsite(details.website) ? '' : 'Enter a valid website URL.'}
				value={details.website}
				oninput={(next) => onboarding.updateBusinessDetails({ website: next })}
			/>
		</FieldGrid>
	</FormSection>

	<FormSection title="Communication address">
		<FieldRow
			label="Communication address"
			required
			remarkKey="kyb.communicationAddress"
			error={details.communicationAddress.trim() ? '' : 'Communication address is required.'}
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
		<Button disabled={!canContinue || saving} onclick={continueToBank}>
			{saving ? 'Saving…' : 'Continue'}
		</Button>
	{/snippet}
</StepShell>
