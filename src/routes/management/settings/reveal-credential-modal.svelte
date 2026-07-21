<script lang="ts">
	import { Button, Modal } from '$lib/components/reusable';
	import { buildCredentialCsv, type RevealedCredential } from './api-credential-logic';

	interface Props {
		credential: RevealedCredential;
		onclose: () => void;
	}

	let { credential, onclose }: Props = $props();

	let open = $state(true);

	$effect(() => {
		if (!open) onclose();
	});

	function download() {
		const csv = buildCredentialCsv(credential);
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = 'api-credentials.csv';
		anchor.click();
		URL.revokeObjectURL(url);
	}
</script>

<Modal
	bind:open
	title="Save your API credential"
	description="Save this now — your secret key will not be shown again."
>
	<div class="flex flex-col gap-4">
		<div class="flex flex-col gap-1.5">
			<span class="text-sm font-medium text-foreground">Client ID</span>
			<p
				class="rounded-md border border-border bg-muted px-3 py-2 font-mono text-sm break-all text-foreground"
			>
				{credential.clientId}
			</p>
		</div>
		<p class="text-sm text-muted-foreground">
			Your client secret has been generated. It is never shown on screen — download the CSV now to
			save it. You can only generate a credential once; if you lose the secret, you'll need to
			revoke this one and generate a new credential.
		</p>
	</div>

	{#snippet footer()}
		<div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
			<Button type="button" variant="outline" class="w-full sm:w-auto" onclick={download}>
				Download credentials (.csv)
			</Button>
			<Button type="button" class="w-full sm:w-auto" onclick={() => (open = false)}>Done</Button>
		</div>
	{/snippet}
</Modal>
