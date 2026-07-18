<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button, Input, Textarea } from '$lib/components/reusable';
	import { AccessSelectTable } from '$lib/components/role-management';
	import { roleFormStore } from '$lib/stores/role-management/role-form.svelte';
	import { ROLE_MODULES, PERM_KEYS, PERM_LABELS } from '$lib/stores/role-management/role-modules';

	$effect(() => {
		if (!roleFormStore.isEditMode || roleFormStore.roleId === null) {
			goto(resolve('/management/role-management'));
		}
	});
</script>

<div class="space-y-6 w-full md:w-[75%] m-auto">
	<!-- Header -->
	<div class="flex flex-wrap items-start justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold text-foreground">Edit role</h1>
			<p class="mt-1 text-sm text-muted-foreground">
				Update the role name, description and permissions.
			</p>
		</div>
		<div class="flex justify-end gap-2">
			<Button variant="outline" onclick={() => roleFormStore.clear()}>Clear</Button>
			<Button
				disabled={!roleFormStore.isValid || !roleFormStore.hasChanges}
				onclick={() => goto(resolve('/management/role-management/edit-role/preview'))}
			>
				Preview
			</Button>
		</div>
	</div>

	<!-- Role detail -->
	<div class="rounded-xl border border-border bg-card p-5 shadow">
		<h2 class="mb-5 text-sm font-semibold text-foreground">Role detail</h2>
		<div class="space-y-4">
			<div class="space-y-1.5">
				<label for="role-name" class="text-sm font-medium text-foreground">
					Role name <span class="text-destructive">*</span>
				</label>
				<Input
					id="role-name"
					placeholder="e.g. Finance Manager"
					class="shadow"
					bind:value={roleFormStore.name}
				/>
			</div>
			<Textarea
				id="role-desc"
				label="Description"
				required
				class="min-h-28 resize-none shadow"
				placeholder="Briefly describe what this role is responsible for"
				bind:value={roleFormStore.description}
			/>
		</div>
	</div>

	<!-- Access & permissions -->
	<AccessSelectTable
		modules={ROLE_MODULES}
		title="Access & permissions"
		permissions={roleFormStore.permissions}
		permKeys={PERM_KEYS}
		permLabels={PERM_LABELS}
		description="Select the permissions to grant for this module"
		allSelected={roleFormStore.allSelected}
		onToggle={(moduleId, key) => roleFormStore.toggle(moduleId, key)}
		onToggleAll={() => roleFormStore.toggleAll()}
	/>
</div>
