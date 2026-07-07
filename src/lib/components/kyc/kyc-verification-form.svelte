<script lang="ts">
	import AlertTriangle from '@lucide/svelte/icons/alert-triangle';
	import { Button, Input } from '$lib/components/reusable';
	import { Loader2, RotateCcw } from '$lib/assets/icons';
	import type { KycTab, VerificationStatus } from './types';
	import { formatAadhaarDisplay, sanitizeAadhaar, sanitizePan } from './mock';

	let {
		tab,
		aadhaar = $bindable(''),
		pan = $bindable(''),
		status,
		error = $bindable(''),
		onVerify,
		onReset
	}: {
		tab: KycTab;
		aadhaar?: string;
		pan?: string;
		status: VerificationStatus;
		error?: string;
		onVerify: () => void;
		onReset: () => void;
	} = $props();

	const aadhaarDigits = $derived(sanitizeAadhaar(aadhaar));
	const panValue = $derived(sanitizePan(pan));
	const showReset = $derived(status === 'success' || status === 'failed');

	function handleAadhaarInput(event: Event) {
		const target = event.currentTarget as HTMLInputElement;
		aadhaar = sanitizeAadhaar(target.value);
	}

	function handlePanInput(event: Event) {
		const target = event.currentTarget as HTMLInputElement;
		pan = sanitizePan(target.value);
	}
</script>

<div class="rounded-xl border border-border bg-card p-5 shadow-sm">
	{#if tab === 'aadhaar'}
		<div>
			<label
				for="aadhaar-number"
				class="mb-2 block text-[11px] font-medium tracking-wider text-muted-foreground uppercase"
			>
				Aadhaar number
			</label>
			<Input
				id="aadhaar-number"
				value={formatAadhaarDisplay(aadhaarDigits)}
				oninput={handleAadhaarInput}
				placeholder="0000 0000 0000"
				inputmode="numeric"
				class="font-mono tracking-widest"
			/>
		</div>
	{:else}
		<div>
			<label
				for="pan-number"
				class="mb-2 block text-[11px] font-medium tracking-wider text-muted-foreground uppercase"
			>
				PAN number
			</label>
			<Input
				id="pan-number"
				value={panValue}
				oninput={handlePanInput}
				placeholder="AAAAA9999A"
				maxlength={10}
				class="font-mono tracking-widest uppercase"
			/>
		</div>
	{/if}

	{#if error}
		<p class="mt-2 flex items-start gap-1.5 text-xs text-destructive">
			<AlertTriangle class="mt-0.5 size-3.5 shrink-0" />
			{error}
		</p>
	{/if}

	<div class="mt-4 flex flex-wrap items-center justify-start gap-3">
		<Button size="sm" disabled={status === 'loading'} onclick={onVerify}>
			{#if status === 'loading'}
				<Loader2 class="size-4 animate-spin" />
				Verifying…
			{:else}
				Verify {tab === 'aadhaar' ? 'Aadhaar' : 'PAN'}
			{/if}
		</Button>

		{#if showReset}
			<Button variant="ghost" size="sm" class="text-xs text-muted-foreground" onclick={onReset}>
				<RotateCcw class="size-3" />
				Start a new verification
			</Button>
		{/if}
	</div>
</div>
