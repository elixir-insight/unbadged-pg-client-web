<script lang="ts">
	import { applyAction, deserialize, enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/reusable';
	import { DirectorCard, InlineRemark, StepShell } from '$lib/components/self-onboarding';
	import { advanceFromStep, routeSaveError } from '$lib/components/self-onboarding/navigation';
	import {
		directorDocumentsUploaded,
		directorsAreComplete,
		directorsAreFilled
	} from '$lib/components/self-onboarding/validation';
	import { Plus } from '$lib/assets/icons';
	import { onboarding } from '$lib/stores/onboarding.svelte';
	import { directorRemarkIndex, remarksForStep } from '$lib/utils/remarkRouting';

	let saving = $state(false);
	let saveError = $state('');
	let attempted = $state(false);
	let removingIndex = $state<number | null>(null);

	/** Gates the Continue button — every required field has a value, format not checked yet. */
	const filled = $derived(directorsAreFilled(onboarding.formData));
	const canContinue = $derived(directorsAreComplete(onboarding.formData));
	const directorRemarks = $derived(remarksForStep(onboarding.verifications, 4));
	const focusField = $derived(onboarding.focusField);

	function remarksForDirector(index: number) {
		return directorRemarks.filter((remark) => directorRemarkIndex(remark.key) === index);
	}

	function actionErrorMessage(data: unknown): string {
		if (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string') {
			return data.error;
		}
		return 'Could not save directors. Please try again.';
	}

	/**
	 * A director that only exists locally (never saved, no id yet) is just dropped from the list.
	 * One that's already persisted upstream is deleted there first — mirrors Management
	 * Onboarding's removeDirector (kyb/+page.svelte), which does the same id-gated delete.
	 */
	async function removeDirector(index: number) {
		if (removingIndex !== null) return;
		const director = onboarding.formData.directors[index];
		if (!director) return;

		if (director.id === undefined) {
			onboarding.removeDirector(index);
			return;
		}

		removingIndex = index;
		try {
			const formData = new FormData();
			formData.set('directorId', String(director.id));
			const response = await fetch('?/deleteDirector', { method: 'POST', body: formData });
			const result = deserialize(await response.text());
			if (result.type === 'success') {
				toast.success('Director removed.');
				onboarding.removeDirector(index);
				return;
			}
			toast.error(actionErrorMessage(result.type === 'failure' ? result.data : undefined));
		} catch {
			toast.error('Could not remove director. Please try again.');
		} finally {
			removingIndex = null;
		}
	}

	const documentsUploaded = $derived(
		onboarding.formData.directors.every(directorDocumentsUploaded)
	);

	let pendingSave: Promise<string> | null = null;

	/** Saves the directors via the save action and stores the returned ids; '' on success. */
	async function saveDirectorsInPlace(): Promise<string> {
		const formData = new FormData();
		formData.set('payload', JSON.stringify(onboarding.formData));
		const response = await fetch('?/saveDirectors', { method: 'POST', body: formData });
		const result = deserialize(await response.text());
		if (result.type !== 'success') {
			return actionErrorMessage(result.type === 'failure' ? result.data : undefined);
		}
		const directorIds = result.data?.directorIds;
		if (!Array.isArray(directorIds)) {
			return 'Director saved, but could not be linked for document upload. Refresh and try again.';
		}
		onboarding.setDirectorIds(directorIds as (number | undefined)[]);
		return '';
	}

	/**
	 * Called when a document is picked for a director that hasn't been saved upstream yet — the
	 * upload endpoint needs its id. Saves every director in place (no step change); concurrent
	 * callers share one in-flight save so two slots can't create the director twice.
	 */
	async function ensureDirectorId(
		index: number
	): Promise<{ ok: true; id: number } | { ok: false; error: string }> {
		attempted = true;
		if (!canContinue) {
			return { ok: false, error: 'Complete the director details above, then upload again.' };
		}
		if (!pendingSave) {
			saving = true;
			pendingSave = saveDirectorsInPlace()
				.catch(() => 'Could not save director. Please try again.')
				.finally(() => {
					saving = false;
					pendingSave = null;
				});
		}
		const error = await pendingSave;
		if (error) return { ok: false, error };
		const id = onboarding.formData.directors[index]?.id;
		return id === undefined
			? { ok: false, error: 'Director saved, but could not be linked. Refresh and try again.' }
			: { ok: true, id };
	}

	const onSaveEnhance: SubmitFunction = ({ cancel }) => {
		attempted = true;
		if (!canContinue || saving) {
			cancel();
			return;
		}
		// The backend won't accept the application without both KYC documents per director.
		if (!documentsUploaded) {
			toast.error('Upload the Aadhaar card and PAN card for every director.');
			cancel();
			return;
		}
		saving = true;
		saveError = '';
		return async ({ result }) => {
			saving = false;
			if (result.type === 'success') {
				const directorIds =
					result.data && typeof result.data === 'object' && 'directorIds' in result.data
						? result.data.directorIds
						: undefined;
				if (Array.isArray(directorIds)) {
					onboarding.setDirectorIds(directorIds as (number | undefined)[]);
				}
				toast.success('Directors saved.');
				await advanceFromStep(4);
				return;
			}
			// e.g. an expired session: the server hook answers with a redirect to /login.
			if (result.type === 'redirect') {
				await applyAction(result);
				return;
			}
			const message =
				result.type === 'failure'
					? actionErrorMessage(result.data)
					: 'Could not save directors. Please try again.';
			toast.error(message);
			saveError = await routeSaveError(message, 4);
		};
	};
</script>

<form id="directors-form" method="POST" action="?/saveDirectors" use:enhance={onSaveEnhance}>
	<input type="hidden" name="payload" value={JSON.stringify(onboarding.formData)} />
</form>

<StepShell error={saveError}>
	<div class="flex flex-col gap-4">
		{#if onboarding.formData.directors.length === 0}
			<p class="text-sm text-muted-foreground">Add at least one director to continue.</p>
		{/if}

		{#each onboarding.formData.directors as director, index (index)}
			{@const remarks = remarksForDirector(index)}
			<InlineRemark
				remark={remarks.map((item) => `${item.field}: ${item.message}`).join(' ')}
				fieldKey={remarks[0]?.key ?? `directors[${index}]`}
				highlighted={Boolean(focusField && directorRemarkIndex(focusField) === index)}
			>
				<DirectorCard
					{director}
					{index}
					showErrors={attempted}
					removing={removingIndex === index}
					onupdate={(i, patch) => onboarding.updateDirector(i, patch)}
					onremove={removeDirector}
					onensureid={ensureDirectorId}
				/>
			</InlineRemark>
		{/each}

		<div>
			<Button variant="outline" size="sm" onclick={() => onboarding.addDirector()}>
				<Plus class="size-4" />
				Add director
			</Button>
		</div>
	</div>

	{#snippet footer()}
		<Button type="submit" form="directors-form" disabled={!filled || saving}>
			{saving ? 'Saving…' : 'Continue'}
		</Button>
	{/snippet}
</StepShell>
