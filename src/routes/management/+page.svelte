<script>
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/reusable';
</script>

<h1 class="text-2xl font-semibold">Management</h1>
<p class="mt-2 text-muted-foreground">Select a section from the navigation above.</p>
<Button onclick={() => goto(resolve('/management/onboarding/create-organization'))}
	>Create Organization</Button
>
