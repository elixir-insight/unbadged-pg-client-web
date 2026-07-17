<script lang="ts">
	import ApiCredentialSection from './api-credential-section.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 sm:px-6">
	<section class="overflow-hidden rounded-xl border border-border bg-card">
		<ApiCredentialSection credential={data.apiCredential} loadError={data.apiCredentialError} />
	</section>
</div>
