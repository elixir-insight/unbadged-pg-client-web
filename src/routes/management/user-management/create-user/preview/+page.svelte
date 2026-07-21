<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { UserDetailProfile } from '$lib/components/user-management';
	import { buildUserOverviewFields } from '$lib/components/user-management/user-overview-fields';
	import { Button } from '$lib/components/reusable';
	import { createUserFormStore } from '$lib/stores/user-management/user-form.svelte';
	import { formatPhoneDisplay } from '$lib/stores/user-management/user-mapper';
	import { createUser } from '$lib/stores/user-management/users-api';

	let creating = $state(false);

	onMount(() => {
		if (!createUserFormStore.isValid) {
			goto(resolve('/management/user-management/create-user'));
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

	async function handleCreate() {
		if (creating) return;

		const reportingTo = Number(createUserFormStore.reportingManagerId);
		if (!Number.isFinite(reportingTo)) {
			toast.error('Select a reporting manager');
			return;
		}

		creating = true;
		try {
			const result = await createUser({
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
			toast.error('Could not create user', {
				description: e instanceof Error ? e.message : 'Something went wrong'
			});
		} finally {
			creating = false;
		}
	}
</script>

<div class="m-auto w-full space-y-6 md:w-[75%]">
	<div class="mb-6">
		<h1 class="text-2xl font-bold text-foreground">Preview User</h1>
		<p class="mt-1 text-sm text-muted-foreground">Review the details before creating the user</p>
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
		<Button disabled={creating} onclick={handleCreate}>
			{creating ? 'Creating…' : 'Create User'}
		</Button>
	{/snippet}
</UserDetailProfile>
