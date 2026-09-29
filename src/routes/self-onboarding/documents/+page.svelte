<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { toast } from 'svelte-sonner';
	import { documentFieldOptions } from '$lib/api/onboarding';
	import { Button } from '$lib/components/reusable';
	import { DocumentCard, InlineRemark, StepShell } from '$lib/components/self-onboarding';
	import { advanceFromStep } from '$lib/components/self-onboarding/navigation';
	import {
		DOCUMENT_LABELS,
		requiredDocumentsUploaded,
		visibleDocumentKeys
	} from '$lib/components/self-onboarding/validation';
	import { onboarding } from '$lib/stores/onboarding.svelte';
	import {
		organizationDocumentRemark,
		remarkDocument,
		type RoutedRemark
	} from '$lib/utils/remarkRouting';
	import {
		DOCUMENT_KEYS,
		type DocumentKey,
		type Documents,
		type PendingDocument
	} from '$lib/types/onboarding';

	/** Files picked on this step; nothing is uploaded until Continue. */
	let pending = $state<Partial<Record<DocumentKey, PendingDocument>>>({});
	let uploading = $state(false);
	let formEl: HTMLFormElement;

	const docs = $derived(onboarding.formData.documents);
	/** The slots as they will be once the picked files upload — what Continue is judged on. */
	const withPending = $derived.by((): Documents => {
		const next = { ...docs };
		for (const key of Object.keys(pending) as DocumentKey[]) {
			next[key] = { ...next[key], uploaded: true };
		}
		return next;
	});
	// A remarked slot is always shown, even an optional one that's otherwise hidden.
	const docKeys = $derived(
		DOCUMENT_KEYS.filter(
			(key) =>
				visibleDocumentKeys(withPending).includes(key) ||
				organizationDocumentRemark(onboarding.verifications, key) !== undefined
		)
	);
	const uploadedCount = $derived(docKeys.filter((key) => docs[key].uploaded).length);
	const pendingCount = $derived(Object.keys(pending).length);
	const total = $derived(docKeys.length);
	const canContinue = $derived(requiredDocumentsUploaded(withPending));

	/**
	 * While remarked, the backend only takes the exact document management rejected — so a slot
	 * with a choice (e.g. Address Proof: rental agreement or electricity bill) offers only that one.
	 */
	function slotFieldOptions(key: DocumentKey, remark: RoutedRemark | undefined) {
		const options = documentFieldOptions(key);
		if (onboarding.onboardingStatus !== 'remarked' || !remark) return options;
		const remarked = remarkDocument(remark.key);
		const fieldName = remarked?.kind === 'organization' ? remarked.fieldName : '';
		const only = options.filter((option) => option.value === fieldName);
		return only.length > 0 ? only : options;
	}

	function pick(key: DocumentKey, document: PendingDocument) {
		pending = { ...pending, [key]: document };
	}

	function discard(key: DocumentKey) {
		const next = { ...pending };
		delete next[key];
		pending = next;
	}

	/** Records a confirmed upload; a replacement answers (and so drops) that slot's remark. */
	function markUploaded(keys: DocumentKey[]) {
		for (const key of keys) {
			const document = pending[key];
			if (!document) continue;
			onboarding.updateDocument(key, document.file);
			const remark = organizationDocumentRemark(onboarding.verifications, key);
			if (remark) onboarding.clearVerification(remark.key);
			discard(key);
		}
	}

	function uploadedKeys(data: unknown): DocumentKey[] {
		if (!data || typeof data !== 'object' || !('uploaded' in data)) return [];
		const uploaded = (data as { uploaded: unknown }).uploaded;
		return Array.isArray(uploaded)
			? uploaded.filter((key): key is DocumentKey => (DOCUMENT_KEYS as string[]).includes(key))
			: [];
	}

	function continueStep() {
		if (pendingCount === 0) {
			void advanceFromStep(5);
			return;
		}
		formEl.requestSubmit();
	}

	const onUploadEnhance: SubmitFunction = ({ formData }) => {
		const entries = Object.entries(pending) as [DocumentKey, PendingDocument][];
		formData.set(
			'documents',
			JSON.stringify(entries.map(([key, doc]) => ({ documentType: key, fieldName: doc.fieldName })))
		);
		for (const [key, doc] of entries) formData.set(`file:${key}`, doc.file);
		uploading = true;

		return async ({ result }) => {
			uploading = false;
			if (result.type === 'success') {
				markUploaded(uploadedKeys(result.data));
				toast.success(
					entries.length === 1
						? `${DOCUMENT_LABELS[entries[0][0]]} uploaded.`
						: `${entries.length} documents uploaded.`
				);
				await advanceFromStep(5);
				return;
			}
			if (result.type === 'failure') {
				// Keep what did upload; the rest stay picked so Continue can retry them.
				markUploaded(uploadedKeys(result.data));
				const data = result.data as { error?: unknown } | undefined;
				toast.error(
					typeof data?.error === 'string' ? data.error : 'Upload failed. Please try again.'
				);
				return;
			}
			toast.error('Upload failed. Please try again.');
		};
	};
</script>

<form
	bind:this={formEl}
	method="POST"
	enctype="multipart/form-data"
	class="hidden"
	use:enhance={onUploadEnhance}
></form>

<StepShell>
	<p class="text-sm font-medium">
		{uploadedCount} of {total} documents uploaded{pendingCount > 0
			? ` · ${pendingCount} ready to upload`
			: ''}
	</p>

	<div class="flex flex-col gap-3">
		{#each docKeys as key (key)}
			{@const remark = organizationDocumentRemark(onboarding.verifications, key)}
			<InlineRemark
				remark={remark?.message ?? ''}
				fieldKey={remark?.key ?? ''}
				highlighted={Boolean(remark) && onboarding.focusField === remark?.key}
				instruction="Please update this document based on the management remark."
			>
				<DocumentCard
					label={DOCUMENT_LABELS[key]}
					documentSlot={docs[key]}
					fieldOptions={slotFieldOptions(key, remark)}
					locked={onboarding.onboardingStatus === 'remarked' && !remark}
					pending={pending[key] ?? null}
					{uploading}
					onpick={(document) => pick(key, document)}
					ondiscard={() => discard(key)}
					onclear={() => onboarding.clearDocument(key)}
				/>
			</InlineRemark>
		{/each}
	</div>

	{#snippet footer()}
		<Button disabled={!canContinue || uploading} onclick={continueStep}>
			{uploading ? 'Uploading…' : 'Continue'}
		</Button>
	{/snippet}
</StepShell>
