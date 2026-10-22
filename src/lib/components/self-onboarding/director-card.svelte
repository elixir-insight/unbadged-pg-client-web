<script lang="ts">
	import { deserialize } from '$app/forms';
	import { Button, PhoneInput } from '$lib/components/reusable';
	import { Loader2, Trash2 } from '$lib/assets/icons';
	import { onboarding } from '$lib/stores/onboarding.svelte';
	import type { Director } from '$lib/types/onboarding';
	import { directorDocumentRemark, directorFieldRemark } from '$lib/utils/remarkRouting';
	import { normalizeAadhar, normalizePanInput } from '$lib/validation/organization-kyb';
	import DirectorDocumentSlot from './director-document-slot.svelte';
	import FieldGrid from './field-grid.svelte';
	import FieldRow from './field-row.svelte';
	import {
		directorDocumentsUploaded,
		directorPanError,
		isValidDirectorAadhaar,
		isValidEmail,
		isValidPhone
	} from './validation';

	let {
		director,
		index,
		showErrors = false,
		removing = false,
		onupdate,
		onremove,
		onensureid
	}: {
		director: Director;
		index: number;
		showErrors?: boolean;
		/** True while this director's DELETE call is in flight — disables the remove control. */
		removing?: boolean;
		onupdate: (index: number, patch: Partial<Director>) => void;
		onremove: (index: number) => void;
		/** Saves the directors when this one has no id yet, so its documents can be uploaded. */
		onensureid: (index: number) => Promise<{ ok: true; id: number } | { ok: false; error: string }>;
	} = $props();

	const phoneInvalid = $derived(director.phone.length > 0 && !isValidPhone(director.phone));
	const remarked = $derived(onboarding.onboardingStatus === 'remarked');
	/** Prefer the real `verifications` key (index or management id) so Fix-this focus lands. */
	function fieldRemarkKey(field: string): string {
		return (
			directorFieldRemark(onboarding.verifications, index, director.id, field)?.key ??
			`directors[${index}].${field}`
		);
	}
	const phoneRemark = $derived(
		directorFieldRemark(onboarding.verifications, index, director.id, 'phone')
	);
	const aadharRemark = $derived(
		directorDocumentRemark(onboarding.verifications, index, 'aadhar', director.id)
	);
	const panRemark = $derived(
		directorDocumentRemark(onboarding.verifications, index, 'pan', director.id)
	);

	/** Records the upload; a replacement also answers the management remark on that document. */
	function handleUploaded(patch: Partial<Director>, remarkToClear: string | undefined) {
		onupdate(index, patch);
		if (remarkToClear) onboarding.clearVerification(remarkToClear);
	}

	/**
	 * Picks up documents already on the backend for a saved director (uploaded in an earlier
	 * session, or from management onboarding) — only ever fills a slot in, never clears one.
	 */
	async function syncDocuments(directorId: number) {
		const formData = new FormData();
		formData.set('directorId', String(directorId));
		try {
			const response = await fetch('?/getDirectorDocuments', { method: 'POST', body: formData });
			const result = deserialize(await response.text());
			if (result.type !== 'success' || !result.data) return;
			const patch: Partial<Director> = {};
			if (result.data.aadhar === true && !director.aadhaarDocument)
				patch.aadhaarDocument = 'Uploaded';
			if (result.data.pan === true && !director.panDocument) patch.panDocument = 'Uploaded';
			if (Object.keys(patch).length > 0) onupdate(index, patch);
		} catch {
			// Best-effort: the slots simply show "Not uploaded" and can still be uploaded.
		}
	}

	const directorId = $derived(director.id);
	$effect(() => {
		if (directorId !== undefined) void syncDocuments(directorId);
	});
</script>

<div class="rounded-xl border border-border p-4">
	<div class="mb-4 flex items-center justify-between gap-3">
		<p class="text-sm font-medium">{director.name || `Director ${index + 1}`}</p>
		{#if !remarked}
			<Button
				variant="ghost"
				size="icon-sm"
				class="text-destructive hover:bg-destructive/10 hover:text-destructive"
				aria-label={`Remove director ${index + 1}`}
				disabled={removing}
				onclick={() => onremove(index)}
			>
				{#if removing}
					<Loader2 class="size-4 animate-spin" />
				{:else}
					<Trash2 class="size-4" />
				{/if}
			</Button>
		{/if}
	</div>

	<FieldGrid>
		<FieldRow
			label="Name"
			placeholder="Enter your name"
			required
			value={director.name}
			remarkKey={fieldRemarkKey('name')}
			forceEdit
			error={director.name.trim() ? '' : 'Name is required.'}
			{showErrors}
			oninput={(next) => onupdate(index, { name: next })}
		/>
		<FieldRow
			label="PAN"
			required
			monospace
			maxlength={10}
			autocomplete="off"
			placeholder="Enter your PAN number"
			hint="Personal PAN, 10 characters, e.g. ABCPE1234F (4th character P)."
			value={director.pan}
			remarkKey={fieldRemarkKey('pan')}
			normalize={normalizePanInput}
			error={directorPanError(director.pan)}
			{showErrors}
			oninput={(next) => onupdate(index, { pan: next })}
		/>
		<FieldRow
			label="Aadhaar"
			placeholder="Enter your Aadhaar number"
			required
			monospace
			maxlength={12}
			inputmode="numeric"
			value={director.aadhaar}
			remarkKey={fieldRemarkKey('aadhar')}
			normalize={normalizeAadhar}
			error={isValidDirectorAadhaar(director.aadhaar)
				? ''
				: 'Enter a valid 12-digit Aadhaar number.'}
			{showErrors}
			oninput={(next) => onupdate(index, { aadhaar: next })}
		/>
		<FieldRow
			label="Email"
			placeholder="Enter your email address"
			required
			type="email"
			value={director.email}
			remarkKey={fieldRemarkKey('email')}
			error={isValidEmail(director.email) ? '' : 'Enter a valid email address.'}
			{showErrors}
			oninput={(next) => onupdate(index, { email: next })}
		/>
		<label class="block min-w-0 space-y-1.5" data-remark-field={phoneRemark?.key}>
			<span class="text-sm font-medium text-foreground">
				Phone <span class="text-destructive">*</span>
			</span>
			<PhoneInput
				placeholder="Enter your phone number"
				value={director.phone}
				disabled={remarked && !phoneRemark}
				invalid={showErrors && phoneInvalid}
				onValueChange={(next) => onupdate(index, { phone: next })}
			/>
			{#if showErrors && phoneInvalid}
				<p class="text-xs text-destructive">Enter a valid 10-digit mobile number.</p>
			{/if}
			{#if phoneRemark}
				<p class="flex items-start gap-1.5 text-xs text-warning">
					<span class="min-w-0">
						<span class="block font-semibold">Management Remark</span>
						<span class="block">{phoneRemark.message}</span>
					</span>
				</p>
			{/if}
		</label>
	</FieldGrid>

	<div class="mt-4 space-y-2">
		<p class="text-sm font-medium">Director documents</p>
		<DirectorDocumentSlot
			directorId={director.id}
			field="aadhar"
			label="Aadhaar card"
			uploadedName={director.aadhaarDocument}
			invalid={showErrors}
			locked={remarked && !aadharRemark}
			remark={aadharRemark?.message}
			remarkKey={aadharRemark?.key}
			highlighted={Boolean(aadharRemark) && onboarding.focusField === aadharRemark?.key}
			ensureDirectorId={() => onensureid(index)}
			onuploaded={(fileName) => handleUploaded({ aadhaarDocument: fileName }, aadharRemark?.key)}
		/>
		<DirectorDocumentSlot
			directorId={director.id}
			field="pan"
			label="PAN card"
			uploadedName={director.panDocument}
			invalid={showErrors}
			locked={remarked && !panRemark}
			remark={panRemark?.message}
			remarkKey={panRemark?.key}
			highlighted={Boolean(panRemark) && onboarding.focusField === panRemark?.key}
			ensureDirectorId={() => onensureid(index)}
			onuploaded={(fileName) => handleUploaded({ panDocument: fileName }, panRemark?.key)}
		/>
		{#if showErrors && !directorDocumentsUploaded(director)}
			<p class="text-xs text-destructive">Upload both the Aadhaar card and PAN card.</p>
		{/if}
	</div>
</div>
