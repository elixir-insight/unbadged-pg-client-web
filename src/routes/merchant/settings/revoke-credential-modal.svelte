<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { Button, Modal } from '$lib/components/reusable';
	import { parseRevokeResult } from './api-credential-logic';

	interface Props {
		open?: boolean;
		credentialId: string;
		onrevoked?: () => void;
		onerror?: (message: string) => void;
	}

	let { open = $bindable(false), credentialId, onrevoked, onerror }: Props = $props();

	let submitting = $state(false);

	const onSubmit: SubmitFunction = () => {
		submitting = true;
		return async ({ result }) => {
			submitting = false;

			if (result.type === 'redirect') {
				window.location.href = result.location;
				return;
			}

			const outcome = parseRevokeResult(result);
			if (outcome.kind === 'revoked') {
				open = false;
				onrevoked?.();
				await invalidateAll();
			} else {
				onerror?.(outcome.message);
			}
		};
	};
</script>

<Modal
	bind:open
	title="Revoke API credential"
	description="This will permanently revoke this credential. Any integrations using it will stop working. This cannot be undone."
>
	{#snippet footer()}
		<form
			method="POST"
			action="?/revoke"
			class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"
			use:enhance={onSubmit}
		>
			<input type="hidden" name="id" value={credentialId} />
			<Button
				type="button"
				variant="outline"
				class="w-full sm:w-auto"
				onclick={() => (open = false)}
				disabled={submitting}
			>
				Cancel
			</Button>
			<Button type="submit" variant="destructive" class="w-full sm:w-auto" disabled={submitting}>
				{submitting ? 'Revoking…' : 'Revoke'}
			</Button>
		</form>
	{/snippet}
</Modal>
