<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import { Chip } from '$lib/components/reusable';
	import { AccessPreviewTable } from '$lib/components/role-management';
	import { roleFormStore } from '$lib/stores/role-management/role-form.svelte';
	import { MERCHANT_ROLE_MODULES } from '$lib/stores/role-management/merchant-role-modules';
	import type { PermStatus } from '$lib/stores/role-management/role-management';
	import { Pencil } from '$lib/assets/icons';

	const modules = $derived(
		MERCHANT_ROLE_MODULES.map((mod) => {
			const perms = roleFormStore.permissions[mod.id];
			return {
				name: mod.name,
				icon: mod.icon,
				read: (perms?.read ? 'granted' : 'denied') as PermStatus,
				writeUnrestricted: (perms?.writeUnrestricted ? 'granted' : 'denied') as PermStatus,
				writeRestricted: (perms?.writeRestricted ? 'granted' : 'denied') as PermStatus,
				delete: (perms?.delete ? 'granted' : 'denied') as PermStatus,
				approve: (perms?.approve ? 'granted' : 'denied') as PermStatus
			};
		})
	);

	function handleConfirm() {
		roleFormStore.reset();
		goto(resolve('/merchant/role-management'));
	}
</script>

<div class="m-auto w-full space-y-6 md:w-[75%]">
	<div class="flex flex-wrap items-start justify-between gap-4">
		<div class="flex flex-wrap items-center gap-3">
			<h1 class="text-2xl font-bold text-foreground">
				{roleFormStore.name || 'Untitled role'}
			</h1>
			<Chip variant="outline" class="border-primary/40 bg-primary/10 text-primary">Preview</Chip>
		</div>
		<div class="flex items-center gap-2">
			<Button
				variant="outline"
				size="sm"
				onclick={() => goto(resolve('/merchant/role-management/create-role'))}
			>
				<Pencil class="h-4 w-4" />
				Edit
			</Button>
			<Button onclick={handleConfirm}>Confirm &amp; create</Button>
		</div>
	</div>

	<div class="rounded-xl border border-border bg-card shadow">
		<div class="border-b border-border px-5 py-4">
			<h2 class="text-sm font-semibold text-foreground">Role detail</h2>
		</div>
		<div class="divide-y divide-border">
			<div class="flex items-start gap-4 px-5 py-3">
				<span class="w-36 shrink-0 text-sm text-muted-foreground">Role name</span>
				<span class="text-sm font-medium text-foreground">{roleFormStore.name || '—'}</span>
			</div>
			<div class="flex items-start gap-4 px-5 py-3">
				<span class="w-36 shrink-0 text-sm text-muted-foreground">Description</span>
				<span class="text-sm text-foreground">{roleFormStore.description || '—'}</span>
			</div>
		</div>
	</div>

	<AccessPreviewTable {modules} />
</div>
