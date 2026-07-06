<script lang="ts">
	import * as v from 'valibot';
	import { Button, Input, toast } from '$lib/components/reusable';
	import { fly } from 'svelte/transition';
	import { cn } from '$lib/utils';
	import { integrationSchema, flattenIssues } from '$lib/validation/onboarding';
	import { Plug, Globe, ArrowLeft } from '$lib/assets/icons';

	let {
		isValid = $bindable(false),
		seed = undefined as { callbackUrl?: string; ipAddress?: string } | undefined,
		hideNavigation = false,
		onprev = () => {},
		onsubmit = () => {}
	}: {
		isValid?: boolean;
		seed?: { callbackUrl?: string; ipAddress?: string };
		hideNavigation?: boolean;
		onprev?: () => void;
		onsubmit?: () => void;
	} = $props();

	let callbackUrl = $state('');
	let ipAddress = $state('');
	let seedApplied = $state(false);

	$effect.pre(() => {
		if (!seed || seedApplied) return;
		callbackUrl = seed.callbackUrl ?? '';
		ipAddress = seed.ipAddress ?? '';
		seedApplied = true;
	});

	// ── Validation ─────────────────────────────────────────────────
	let errors = $state<Record<string, string>>({});
	let submitAttempted = $state(false);

	function validate(): boolean {
		const result = v.safeParse(integrationSchema, { callbackUrl, ipAddress });
		errors = result.success ? {} : flattenIssues(result.issues);
		return result.success;
	}

	const canContinue = $derived(v.safeParse(integrationSchema, { callbackUrl, ipAddress }).success);

	const allMandatoryFilled = $derived(callbackUrl.trim() !== '');

	const canSave = $derived(allMandatoryFilled && Object.keys(errors).length === 0);

	$effect(() => {
		if (isValid !== canContinue) {
			isValid = canContinue;
		}
	});

	function onFieldInput() {
		if (submitAttempted) validate();
	}

	function handleSubmit() {
		submitAttempted = true;
		if (!validate()) return;
		onsubmit();
	}

	function handlePanelSave() {
		submitAttempted = true;
		if (!validate()) return;
		toast.success('Application integration updated successfully');
	}

	function clearIntegration() {
		callbackUrl = '';
		ipAddress = '';
		errors = {};
		submitAttempted = false;
	}
</script>

<div in:fly={{ y: 10, duration: 220 }} class="space-y-3">
	<!-- Header -->
	<div
		class="flex items-center gap-3 rounded-2xl border border-border/40 bg-background/80 px-4 py-4 shadow-sm backdrop-blur-sm sm:px-5"
	>
		<div
			class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
		>
			<Plug class="size-4.5" />
		</div>
		<div class="min-w-0 flex-1">
			<p class="text-base leading-none font-semibold">Application Integration</p>
			<p class="mt-0.5 text-xs text-muted-foreground">Configure callback and IP endpoints</p>
		</div>
	</div>

	<!-- Webhook & Callbacks -->
	<div
		class="overflow-hidden rounded-2xl border border-border/40 bg-background/80 shadow-sm backdrop-blur-sm"
	>
		<div class="flex items-center gap-3 border-b border-border/30 px-4 py-3.5 sm:px-5">
			<div class="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
				<Globe class="size-3.5" />
			</div>
			<p class="text-sm font-semibold">Webhook & Callbacks</p>
		</div>

		<div class="space-y-5 p-4 sm:p-5">
			<!-- Callback URL + IP Address -->
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div class="space-y-1.5">
					<label class="text-sm font-medium" for="callbackUrl"
						>Callback URL <span class="text-rose-500">*</span></label
					>
					<Input
						id="callbackUrl"
						bind:value={callbackUrl}
						oninput={onFieldInput}
						placeholder="Enter Callback URL"
						class={cn(errors.callbackUrl && 'border-destructive focus-visible:ring-destructive/30')}
					/>
					{#if submitAttempted && errors.callbackUrl}
						<p class="text-xs text-rose-500">{errors.callbackUrl}</p>
					{/if}
				</div>
				<div class="space-y-1.5">
					<label class="text-sm font-medium" for="ipAddress">IP Address</label>
					<Input
						id="ipAddress"
						bind:value={ipAddress}
						oninput={onFieldInput}
						placeholder="Enter IP Address"
						class={cn(errors.ipAddress && 'border-destructive focus-visible:ring-destructive/30')}
					/>
					{#if submitAttempted && errors.ipAddress}
						<p class="text-xs text-rose-500">{errors.ipAddress}</p>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Actions bar -->
	{#if !hideNavigation}
		<div
			class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/40 bg-background/80 px-4 py-3.5 shadow-sm backdrop-blur-sm sm:px-5"
		>
			<Button variant="ghost" size="sm" onclick={onprev}>
				<ArrowLeft class="size-4" />
				Previous
			</Button>
			<div class="flex items-center gap-2">
				<!-- Hide Clear on mobile -->
				<Button variant="ghost" size="sm" onclick={clearIntegration} class="hidden sm:inline-flex">
					Clear all
				</Button>
				<Button
					size="sm"
					class="gradient-primary text-primary-foreground"
					onclick={handleSubmit}
					disabled={!canSave}
				>
					Save & Continue
				</Button>
			</div>
		</div>
	{:else}
		<div
			class="flex items-center justify-end rounded-2xl border border-border/40 bg-background/80 px-4 py-3.5 shadow-sm backdrop-blur-sm sm:px-5"
		>
			<Button
				size="sm"
				class="gradient-primary text-primary-foreground"
				onclick={handlePanelSave}
				disabled={!canSave}
			>
				Save changes
			</Button>
		</div>
	{/if}
</div>
