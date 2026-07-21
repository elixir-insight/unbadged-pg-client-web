<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { UserDetailProfile } from '$lib/components/user-management';
	import { buildUserOverviewFields } from '$lib/components/user-management/user-overview-fields';
	import { Button, Chip } from '$lib/components/reusable';
	import { createUserFormStore } from '$lib/stores/user-management/user-form.svelte';
	import { formatPhoneDisplay } from '$lib/stores/user-management/user-mapper';
	import { updateUser } from '$lib/stores/user-management/users-api';

	const userId = $derived(page.params.id);
	let saving = $state(false);

	onMount(() => {
		const id = userId;
		if (
			!id ||
			!createUserFormStore.isEditMode ||
			createUserFormStore.userId !== id ||
			!createUserFormStore.isValid
		) {
			if (id) {
				goto(resolve('/management/user-management/edit-user/[id]', { id }));
			} else {
				goto(resolve('/management/user-management'));
			}
		}
	});

	const overviewFields = $derived.by(() =>
		buildUserOverviewFields({
			email: createUserFormStore.email,
			mobileNumber: createUserFormStore.mobileNumber,
			employeeId: createUserFormStore.employeeId,
			reportingManager: createUserFormStore.reportingManagerName
				? {
						name: createUserFormStore.reportingManagerName,
						employeeId: createUserFormStore.reportingManagerEmployeeId,
						email: createUserFormStore.reportingManagerEmail
					}
				: null
		})
	);

	const phoneDisplay = $derived(formatPhoneDisplay(createUserFormStore.mobileNumber));

	const roles = $derived(createUserFormStore.selectedRoles.map((role) => role.displayName));

	async function handleSave() {
		if (saving) return;

		const id = createUserFormStore.userId;
		if (!id) {
			goto(resolve('/management/user-management'));
			return;
		}

		const reportingTo = Number(createUserFormStore.reportingManagerId);
		if (!Number.isFinite(reportingTo)) {
			toast.error('Select a reporting manager');
			return;
		}

		saving = true;
		try {
			const result = await updateUser(id, {
				employeeId: createUserFormStore.employeeId.trim(),
				phoneNumber: createUserFormStore.formattedMobile,
				reportingTo,
				roles: createUserFormStore.selectedRoleIds,
				userEmail: createUserFormStore.email.trim().toLowerCase(),
				userName: createUserFormStore.fullName
			});

			toast.success(result.message);
			createUserFormStore.reset();
			goto(resolve('/management/user-management'));
		} catch (e) {
			toast.error('Could not update user', {
				description: e instanceof Error ? e.message : 'Something went wrong'
			});
		} finally {
			saving = false;
		}
	}
</script>

<div class="m-auto w-full space-y-6 md:w-[75%]">
	<div class="mb-6">
		<div class="flex flex-wrap items-center gap-3">
			<h1 class="text-2xl font-bold text-foreground">Preview User</h1>
			<Chip variant="outline" class="border-primary/40 bg-primary/10 text-primary">Edit</Chip>
		</div>
		<p class="mt-1 text-sm text-muted-foreground">Review the changes before saving</p>
	</div>
</div>

<UserDetailProfile
	name={createUserFormStore.fullName}
	email={createUserFormStore.email}
	employeeId={createUserFormStore.employeeId}
	{phoneDisplay}
	{roles}
	{overviewFields}
	initials={createUserFormStore.initials}
	showStatusChip={false}
>
	{#snippet actions()}
		<Button disabled={saving} onclick={handleSave}>
			{saving ? 'Saving…' : 'Confirm & save'}
		</Button>
	{/snippet}
</UserDetailProfile>
