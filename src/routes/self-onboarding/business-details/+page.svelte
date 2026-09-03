<script lang="ts">
	import { getContext } from 'svelte';
	import { Button, Checkbox, PhoneInput, toast } from '$lib/components/reusable';
	import { FieldRow, InlineRemark, SectionCard, StepShell } from '$lib/components/self-onboarding';
	import { advanceFromTab } from '$lib/components/self-onboarding/navigation';
	import { STAGE_NAV_KEY, type StageNav } from '$lib/components/self-onboarding/stage-nav.svelte';
	import {
		isAddressTabComplete,
		isCompanyTabComplete
	} from '$lib/components/self-onboarding/stage-status';
	import { formatAddress } from '$lib/components/self-onboarding/validation';
	import { CheckCircle2 } from '$lib/assets/icons';
	import { onboarding } from '$lib/stores/onboarding.svelte';
	import { getFieldRemark } from '$lib/utils/remarkRouting';

	const stageNav = getContext<StageNav | undefined>(STAGE_NAV_KEY);
	const isAddressTab = $derived(onboarding.businessSection === 'address');
	const focusField = $derived(onboarding.focusField);

	const details = $derived(onboarding.formData.businessDetails);
	const identityLocked = $derived(onboarding.mode === 'auto' && details.companyName.length > 0);
	const gstVerifiedHint = $derived(identityLocked ? 'Verified from GST' : '');

	const registeredSummary = $derived.by(() => {
		const cityState = [details.address.city, details.address.state]
			.filter((part) => part.trim().length > 0)
			.join(', ');
		if (cityState && details.address.pincode) {
			return `${cityState} - ${details.address.pincode}`;
		}
		return formatAddress(
			details.address.line1,
			details.address.line2,
			details.address.city,
			details.address.state,
			details.address.pincode
		);
	});

	const cinRemark = $derived(getFieldRemark(onboarding.verifications, 'kyb.cin'));
	const brandRemark = $derived(getFieldRemark(onboarding.verifications, 'brandName'));
	const phoneRemark = $derived(getFieldRemark(onboarding.verifications, 'kyb.businessPhone'));
	const websiteRemark = $derived(
		getFieldRemark(onboarding.verifications, 'kyb.organizationWebsite')
	);
	const communicationRemark = $derived(
		getFieldRemark(onboarding.verifications, 'kyb.communicationAddress')
	);
	const addressRemark = $derived(
		getFieldRemark(onboarding.verifications, 'addressDetails.address')
	);
	const cityRemark = $derived(getFieldRemark(onboarding.verifications, 'addressDetails.city'));
	const stateRemark = $derived(getFieldRemark(onboarding.verifications, 'addressDetails.state'));
	const pinRemark = $derived(
		getFieldRemark(onboarding.verifications, 'addressDetails.pinCode') ||
			getFieldRemark(onboarding.verifications, 'addressDetails.pincode')
	);

	const canContinue = $derived(
		isAddressTab
			? isAddressTabComplete(onboarding.formData)
			: isCompanyTabComplete(onboarding.formData)
	);

	function saveDraft() {
		onboarding.persist();
		toast.success('Progress saved. You can continue later.');
	}

	function continueFromTab() {
		if (!canContinue) return;
		if (isAddressTab) {
			onboarding.commitCurrentAddressFromContact();
			onboarding.persist();
			void advanceFromTab('address');
			return;
		}
		onboarding.persist();
		void advanceFromTab('company');
	}

	$effect.pre(() => {
		stageNav?.setConfig({
			canContinue,
			onContinue: continueFromTab,
			label: 'Continue',
			secondaryLabel: 'Save Draft',
			onSecondary: saveDraft
		});
	});
</script>

<StepShell>
	{#if isAddressTab}
		<div class="flex flex-col gap-4">
			<SectionCard>
				<InlineRemark
					remark={communicationRemark || addressRemark}
					fieldKey={communicationRemark ? 'kyb.communicationAddress' : 'addressDetails.address'}
					highlighted={focusField === 'kyb.communicationAddress' ||
						focusField.startsWith('addressDetails')}
				>
					<div class="flex flex-col gap-4">
						<InlineRemark remark={addressRemark} fieldKey="addressDetails.address">
							<FieldRow
								label="Address Line 1"
								bind:value={onboarding.formData.businessDetails.address.line1}
								forceEdit
							/>
						</InlineRemark>
						<FieldRow
							label="Address Line 2"
							bind:value={onboarding.formData.businessDetails.address.line2}
							forceEdit
						/>
					</div>
					<div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
						<InlineRemark remark={cityRemark} fieldKey="addressDetails.city">
							<FieldRow
								label="City"
								bind:value={onboarding.formData.businessDetails.address.city}
								forceEdit
							/>
						</InlineRemark>
						<InlineRemark remark={stateRemark} fieldKey="addressDetails.state">
							<FieldRow
								label="State"
								bind:value={onboarding.formData.businessDetails.address.state}
								forceEdit
							/>
						</InlineRemark>
						<InlineRemark
							remark={pinRemark}
							fieldKey="addressDetails.pinCode"
							highlighted={focusField === 'addressDetails.pinCode'}
						>
							<FieldRow
								label="Pincode"
								bind:value={onboarding.formData.businessDetails.address.pincode}
								forceEdit
								maxlength={6}
							/>
						</InlineRemark>
					</div>
				</InlineRemark>
			</SectionCard>

			<SectionCard>
				<div class="mb-4">
					<Checkbox
						label="Same as Registered Address"
						bind:checked={onboarding.formData.businessDetails.currentAddressSameAsContact}
					/>
				</div>
				{#if details.currentAddressSameAsContact}
					<div class="rounded-xl border border-border bg-muted/40 p-4">
						<p class="flex items-center gap-2 text-sm font-medium text-foreground">
							<CheckCircle2 class="size-4 text-success" />
							Using registered address
						</p>
						{#if registeredSummary}
							<p class="mt-1 text-sm text-muted-foreground">{registeredSummary}</p>
						{/if}
					</div>
				{:else}
					<div class="flex flex-col gap-4">
						<FieldRow
							label="Address Line 1"
							bind:value={onboarding.formData.businessDetails.currentAddress.line1}
							forceEdit
						/>
						<FieldRow
							label="Address Line 2"
							bind:value={onboarding.formData.businessDetails.currentAddress.line2}
							forceEdit
						/>
					</div>
					<div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
						<FieldRow
							label="City"
							bind:value={onboarding.formData.businessDetails.currentAddress.city}
							forceEdit
						/>
						<FieldRow
							label="State"
							bind:value={onboarding.formData.businessDetails.currentAddress.state}
							forceEdit
						/>
						<FieldRow
							label="Pincode"
							bind:value={onboarding.formData.businessDetails.currentAddress.pincode}
							forceEdit
							maxlength={6}
						/>
					</div>
				{/if}
			</SectionCard>
		</div>
	{:else}
		<div class="flex flex-col gap-4">
			<SectionCard>
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<FieldRow
						label="Legal Business Name"
						bind:value={onboarding.formData.businessDetails.companyName}
						forceEdit
						verifiedHint={gstVerifiedHint}
					/>
					<InlineRemark
						remark={brandRemark}
						fieldKey="brandName"
						highlighted={focusField === 'brandName'}
					>
						<FieldRow
							label="Brand / Store Name"
							bind:value={onboarding.formData.businessDetails.brandName}
							forceEdit
						/>
					</InlineRemark>
					<FieldRow
						label="Company Type"
						bind:value={onboarding.formData.businessDetails.companyType}
						locked={identityLocked}
						verifiedHint={gstVerifiedHint}
					/>
					<InlineRemark
						remark={cinRemark}
						fieldKey="kyb.cin"
						highlighted={focusField === 'kyb.cin'}
					>
						<FieldRow
							label="CIN"
							bind:value={onboarding.formData.businessDetails.cin}
							locked={identityLocked}
							monospace
							verifiedHint={gstVerifiedHint}
						/>
					</InlineRemark>
				</div>
			</SectionCard>

			<SectionCard>
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<FieldRow
						label="Business Email"
						bind:value={onboarding.formData.businessDetails.email}
						type="email"
						forceEdit
					/>
					<InlineRemark
						remark={phoneRemark}
						fieldKey="kyb.businessPhone"
						highlighted={focusField === 'kyb.businessPhone'}
					>
						<label class="min-w-0 space-y-1">
							<span class="text-sm font-medium text-primary">Business Phone</span>
							<PhoneInput bind:value={onboarding.formData.businessDetails.phone} />
						</label>
					</InlineRemark>
					<InlineRemark
						remark={websiteRemark}
						fieldKey="kyb.organizationWebsite"
						highlighted={focusField === 'kyb.organizationWebsite'}
					>
						<FieldRow
							label="Website"
							bind:value={onboarding.formData.businessDetails.website}
							type="url"
							forceEdit
						/>
					</InlineRemark>
				</div>
			</SectionCard>
		</div>
	{/if}

	{#snippet footer()}
		<Button variant="outline" onclick={saveDraft}>Save Draft</Button>
		<Button disabled={!canContinue} onclick={continueFromTab}>Continue</Button>
	{/snippet}
</StepShell>
