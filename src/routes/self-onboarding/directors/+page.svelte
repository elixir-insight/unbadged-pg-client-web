<script lang="ts">
	import { applyAction, deserialize, enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { toast } from 'svelte-sonner';
	import { toKybPayload } from '$lib/api/onboarding';
	import { Button } from '$lib/components/reusable';
	import { DirectorCard, InlineRemark, StepShell } from '$lib/components/self-onboarding';
	import { advanceFromStep, routeSaveError } from '$lib/components/self-onboarding/navigation';
	import {
		directorDocumentsUploaded,
		directorFieldIssues,
		directorsAreComplete,
		directorsAreFilled
	} from '$lib/components/self-onboarding/validation';
	import { Plus } from '$lib/assets/icons';
	import { onboarding } from '$lib/stores/onboarding.svelte';
	import {
		directorRemarkField,
		directorRemarkIndex,
		remarkDocument,
		remarksForStep
	} from '$lib/utils/remarkRouting';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Fresh ids for the directors saved upstream — the layout re-fetches the organization on every
	// step change (+layout.server.ts), and a save elsewhere can re-create directors under new ids.
	$effect(() => {
		if (data.prefill) onboarding.syncDirectorIds(data.prefill.directors);
	});

	let saving = $state(false);
	let saveError = $state('');
	let attempted = $state(false);
	let removingIndex = $state<number | null>(null);

	/** Gates the Continue button — every required field has a value, format not checked yet. */
	const filled = $derived(directorsAreFilled(onboarding.formData));
	const canContinue = $derived(directorsAreComplete(onboarding.formData));
	const directorRemarks = $derived(remarksForStep(onboarding.verifications, 4));
	const focusField = $derived(onboarding.focusField);

	/** Director fields that show their own remark (FieldRow `remarkKey` in DirectorCard). */
	const FIELD_LEVEL_REMARKS = new Set(['name', 'pan', 'aadhar', 'email']);

	/**
	 * This director's remarks that no single field or document slot shows (e.g. phone) — those
	 * go above the card instead, so every remark is shown exactly once.
	 */
	function cardLevelRemarks(index: number) {
		return directorRemarks.filter(
			(remark) =>
				directorRemarkIndex(remark.key) === index &&
				!FIELD_LEVEL_REMARKS.has(directorRemarkField(remark.key) ?? '') &&
				!remarkDocument(remark.key)
		);
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
		onboarding.markClean('organization', toKybPayload(onboarding.formData));
		return '';
	}

	/**
	 * The save carries every director, so one incomplete director blocks uploads on all of them —
	 * name the fields (and the director, when it isn't this one) so the user knows what to fix.
	 */
	function incompleteDirectorsMessage(index: number): string {
		const directors = onboarding.formData.directors;
		const own = directors[index] ? directorFieldIssues(directors[index]) : [];
		if (own.length > 0) return `Fix ${own.join(', ')} above, then upload again.`;
		const other = directors.findIndex((director) => directorFieldIssues(director).length > 0);
		if (other === -1) return 'Complete the director details above, then upload again.';
		const issues = directorFieldIssues(directors[other]).join(', ');
		// Same label as the card heading, so the user can find it.
		const label = directors[other].name.trim() || `Director ${other + 1}`;
		return `Fix ${issues} for ${label} first — all directors are saved together.`;
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
			return { ok: false, error: incompleteDirectorsMessage(index) };
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
		if (error) {
			toast.error(error);
			// This save carries the whole organization, so it can fail on another step's field
			// (e.g. "Invalid GST Format") — send the user there instead of showing it on the slot.
			const localError = await routeSaveError(error, 4);
			return { ok: false, error: localError || error };
		}
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
		// Unchanged since the last save, and every director already exists upstream — skip the PUT.
		const directors = onboarding.formData.directors;
		const saved = directors.every((director) => director.id !== undefined);
		if (saved && !onboarding.isDirty('organization', toKybPayload(onboarding.formData))) {
			cancel();
			void advanceFromStep(4);
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
				// Snapshot after the ids are stored, so the next visit compares like with like.
				onboarding.markClean('organization', toKybPayload(onboarding.formData));
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
			{@const remarks = cardLevelRemarks(index)}
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
