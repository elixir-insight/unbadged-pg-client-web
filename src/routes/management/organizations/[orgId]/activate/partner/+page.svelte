<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/reusable';
	import { ThumbsUp } from '$lib/assets/icons';
	import { activationDocumentReady } from '../../completeness';

	let { data } = $props();

	const organization = $derived(data.organization);
	const orgId = $derived(organization.id);
	const canActivate = $derived(activationDocumentReady());

	function activatePartner() {
		organization.status = 'ACTIVE';
		goto(resolve('/management/organizations/[orgId]/manage', { orgId }));
	}
</script>

<div class="rounded-xl border border-border/60 bg-card p-5">
	<div class="mb-4 flex items-center gap-2">
		<ThumbsUp class="size-4 text-muted-foreground" />
		<h2 class="text-base font-semibold">Activate partner profile</h2>
	</div>
	<p class="text-sm text-muted-foreground">
		The business agreement gate is satisfied. Activating this profile will move the organization to
		`ACTIVE`.
	</p>
	<div class="mt-4 flex flex-wrap justify-end gap-2">
		<Button variant="ghost" href={`/management/organizations/${orgId}/kyb`}>Cancel</Button>
		<Button disabled={!canActivate} onclick={activatePartner}>
			<ThumbsUp class="size-4" />
			Confirm activation
		</Button>
	</div>
</div>
