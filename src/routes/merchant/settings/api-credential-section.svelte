<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { Button } from '$lib/components/reusable';
	import { userPermissions } from '$lib/stores/rbac';
	import RevealCredentialModal from './reveal-credential-modal.svelte';
	import RevokeCredentialModal from './revoke-credential-modal.svelte';
	import {
		maskClientId,
		parseGenerateResult,
		type RevealedCredential
	} from './api-credential-logic';

	interface Props {
		credential: { id: string; clientId: string } | null;
		loadError?: string | null;
	}

	let { credential, loadError = null }: Props = $props();

	let generating = $state(false);
	let generateError = $state<string | null>(null);
	let revealed = $state<RevealedCredential | null>(null);
	let revokeOpen = $state(false);

	const onGenerate: SubmitFunction = () => {
		generating = true;
		generateError = null;
		return async ({ result }) => {
			generating = false;

			if (result.type === 'redirect') {
				window.location.href = result.location;
				return;
			}

			const outcome = parseGenerateResult(result);
			if (outcome.kind === 'revealed') {
				revealed = outcome.credential;
			} else if (outcome.kind === 'self-corrected') {
				toast.error(outcome.message);
				await invalidateAll();
			} else {
				generateError = outcome.message;
			}
		};
	};

	function closeRevealPanel() {
		revealed = null;
		void invalidateAll();
	}
</script>

{#if loadError}
	<div class="flex flex-col gap-3 border-t border-border/40 px-4 py-4 sm:px-5">
		<h3 class="text-sm font-semibold text-foreground">API Credential</h3>
		<p class="text-sm text-destructive" role="alert">{loadError}</p>
		<Button variant="outline" size="sm" class="w-fit" onclick={() => invalidateAll()}>Retry</Button>
	</div>
{:else if credential}
	<div
		class="flex flex-col gap-3 border-t border-border/40 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5"
	>
		<div class="min-w-0">
			<h3 class="text-sm font-semibold text-foreground">API Credential</h3>
			<p class="mt-2 font-mono text-sm text-muted-foreground">
				{maskClientId(credential.clientId)}
			</p>
		</div>
		{#if userPermissions.can('PROFILE', 'delete')}
			<Button variant="destructive" size="sm" class="shrink-0" onclick={() => (revokeOpen = true)}>
				Delete API Credential
			</Button>
		{/if}
	</div>

	<RevokeCredentialModal
		bind:open={revokeOpen}
		credentialId={credential.id}
		onerror={(message) => toast.error(message)}
	/>
{:else}
	<div class="flex flex-col gap-3 border-t border-border/40 px-4 py-4 sm:px-5">
		<h3 class="text-sm font-semibold text-foreground">API Credential</h3>
		<p class="text-sm text-muted-foreground">
			Generate an API credential to integrate with our APIs. This can only be done once per
			organization, so store the secret safely when it's shown.
		</p>
		{#if generateError}
			<p class="text-sm text-destructive" role="alert">{generateError}</p>
		{/if}
		<form method="POST" action="?/generate" use:enhance={onGenerate}>
			{#if userPermissions.can('PROFILE', 'write')}
				<Button type="submit" disabled={generating} class="w-fit">
					{#if generating}
						<span
							class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
						></span>
						Generating…
					{:else}
						Generate API Credential
					{/if}
				</Button>
			{/if}
		</form>
	</div>
{/if}

{#if revealed}
	<RevealCredentialModal credential={revealed} onclose={closeRevealPanel} />
{/if}
