<script lang="ts">
	import { Button, Input, toast } from '$lib/components/reusable';
	import DetailSection from './detail-section.svelte';
	import DetailField from './detail-field.svelte';
	import type { OrganizationIntegration } from '$lib/utils/organization-form';
	import { Plug, Globe, Pencil } from '$lib/assets/icons';

	let {
		integration = $bindable()
	}: {
		integration: OrganizationIntegration;
	} = $props();

	let editing = $state(false);
	let draft = $state<OrganizationIntegration>({ callbackUrl: '', ipAddress: '' });

	function startEditing() {
		draft = { ...integration };
		editing = true;
	}

	function cancelEditing() {
		draft = { ...integration };
		editing = false;
	}

	function saveChanges() {
		integration = { ...draft };
		editing = false;
		toast.success('Application integration updated successfully');
	}
</script>

<div class="space-y-5">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div>
			<h2 class="text-sm font-semibold text-foreground">Application Integration</h2>
			<p class="text-xs text-muted-foreground">Webhook and callback configuration</p>
		</div>
		{#if !editing}
			<Button variant="outline" size="sm" onclick={startEditing}>
				<Pencil class="size-4" />
				Edit
			</Button>
		{:else}
			<div class="flex items-center gap-2">
				<Button variant="outline" size="sm" onclick={cancelEditing}>Cancel</Button>
				<Button size="sm" onclick={saveChanges}>Save changes</Button>
			</div>
		{/if}
	</div>

	<DetailSection title="Webhook & Callbacks" description="API endpoint configuration" icon={Plug}>
		{#if editing}
			<div class="grid gap-4 sm:grid-cols-2">
				<div class="space-y-1.5 sm:col-span-2">
					<label for="callback-url" class="text-xs font-medium text-muted-foreground"
						>Callback URL</label
					>
					<Input
						id="callback-url"
						bind:value={draft.callbackUrl}
						placeholder="https://example.com/callback"
					/>
				</div>
				<div class="space-y-1.5 sm:col-span-2">
					<label for="ip-address" class="text-xs font-medium text-muted-foreground"
						>IP Address</label
					>
					<Input id="ip-address" bind:value={draft.ipAddress} placeholder="203.0.113.10" />
				</div>
			</div>
		{:else}
			<div class="grid gap-4 sm:grid-cols-2">
				<DetailField label="Callback URL" value={integration.callbackUrl} class="sm:col-span-2" />
				<DetailField label="IP Address" value={integration.ipAddress} mono />
			</div>
		{/if}
	</DetailSection>

	<DetailSection title="Integration Notes" icon={Globe}>
		<p class="text-sm text-muted-foreground">
			These settings were configured during onboarding. Updates here will apply to live payment
			callbacks for this organization.
		</p>
	</DetailSection>
</div>
