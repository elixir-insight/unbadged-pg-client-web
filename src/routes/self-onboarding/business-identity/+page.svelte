<script lang="ts">
	import { Button, PhoneInput } from '$lib/components/reusable';
	import { FieldRow, InlineRemark, StepShell } from '$lib/components/self-onboarding';
	import { advanceFromStep } from '$lib/components/self-onboarding/navigation';
	import {
		isCinValid,
		isIdentityComplete,
		isIdentityFilled,
		isTanValid,
		isValidGstin,
		isValidPan,
		isValidPhone,
		isValidRegisteredYear,
		isValidWebsite,
		MIN_REGISTERED_YEAR
	} from '$lib/components/self-onboarding/validation';
	import { onboarding } from '$lib/stores/onboarding.svelte';
	import { getFieldRemark } from '$lib/utils/remarkRouting';

	let attempted = $state(false);

	const data = $derived(onboarding.formData);
	const details = $derived(data.businessDetails);
	/** Gates the Continue button — every required field has a value, format not checked yet. */
	const filled = $derived(isIdentityFilled(data));
	const canContinue = $derived(isIdentityComplete(data));
	const cinRequired = $derived(data.entityType === 'private_limited');
	const phoneRemark = $derived(getFieldRemark(onboarding.verifications, 'kyb.businessPhone'));
	const phoneInvalid = $derived(details.phone.length > 0 && !isValidPhone(details.phone));

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

	function continueToProfile() {
		attempted = true;
		if (!canContinue) return;
		void advanceFromStep(1);
	}
</script>

<StepShell>
	<FieldRow
		label="Business PAN"
		required
		monospace
		maxlength={10}
		autocomplete="off"
		placeholder="Enter your business PAN"
		remarkKey="kyb.businessPan"
		hint="10 characters, format ABCDE1234F."
		error={isValidPan(data.businessPan) ? '' : 'Enter a valid 10-character PAN.'}
		showErrors={attempted}
		value={data.businessPan}
		normalize={(next) => normalizeId(next, 10)}
		oninput={(next) => onboarding.setBusinessPan(next)}
	/>

	<div class="flex flex-col gap-4">
		<FieldRow
			label="GSTIN"
			placeholder="Enter your GSTIN"
			required
			monospace
			maxlength={15}
			autocomplete="off"
			remarkKey="kyb.gstNumber"
			hint="15 characters, e.g. 27ABCDE1234F1Z5."
			error={isValidGstin(data.gstin) ? '' : 'Enter a valid 15-character GSTIN.'}
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
					invalid={attempted && phoneInvalid}
					onValueChange={(next) => onboarding.updateBusinessDetails({ phone: next })}
				/>
				{#if attempted && phoneInvalid}
					<p class="text-xs text-destructive">Enter a valid 10-digit mobile number.</p>
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
		<Button disabled={!filled} onclick={continueToProfile}>Continue</Button>
	{/snippet}
</StepShell>
