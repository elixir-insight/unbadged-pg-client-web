<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { Eye, EyeOff } from '$lib/assets/icons';
	import { Button, Input, Modal } from '$lib/components/reusable';
	import * as Select from '$lib/components/ui/select';
	import { Switch } from '$lib/components/ui/switch';
	import {
		buildWebhookUpdatePayload,
		isValidWebhookUrl,
		parseAddWebhookResult,
		parseUpdateWebhookResult,
		type WebhookFormField,
		type WebhookUrlRow
	} from './webhook-logic';

	const eventTypes = ['PAYIN', 'PAYOUT'] as const;

	interface Props {
		open?: boolean;
		webhook?: WebhookUrlRow | null;
		onadded?: () => void;
	}

	let { open = $bindable(false), webhook = null, onadded }: Props = $props();

	let eventType = $state('');
	let webhookUrl = $state('');
	let isActive = $state(true);
	let secretKey = $state('');
	let showSecret = $state(false);
	let submitting = $state(false);
	let formError = $state<string | null>(null);
	let errorField = $state<WebhookFormField | null>(null);

	const urlTouched = $derived(webhookUrl.length > 0);
	const urlValid = $derived(!urlTouched || isValidWebhookUrl(webhookUrl));
	const isEditing = $derived(webhook !== null);
	const updatePayload = $derived(
		webhook
			? buildWebhookUpdatePayload(webhook, { eventType, webhookUrl, isActive, secretKey })
			: {}
	);
	const hasChanges = $derived(Object.keys(updatePayload).length > 0);
	const canSubmit = $derived(
		eventType.trim().length > 0 &&
			urlTouched &&
			urlValid &&
			(isEditing ? hasChanges : secretKey.length > 0) &&
			!submitting
	);

	$effect(() => {
		if (open) {
			eventType = webhook?.eventType ?? '';
			webhookUrl = webhook?.webhookUrl ?? '';
			isActive = webhook?.isActive ?? true;
			secretKey = '';
			showSecret = false;
			submitting = false;
			formError = null;
			errorField = null;
		}
	});

	const onSubmit: SubmitFunction = ({ formData, cancel }) => {
		if (!eventType.trim()) {
			cancel();
			formError = 'Event type is required.';
			errorField = 'eventType';
			return;
		}
		if (!isValidWebhookUrl(webhookUrl)) {
			cancel();
			formError = 'Enter a valid http:// or https:// URL.';
			errorField = 'webhookUrl';
			return;
		}

		if (isEditing) {
			if (!webhook || !hasChanges) {
				cancel();
				return;
			}

			formData.delete('eventType');
			formData.delete('webhookUrl');
			formData.delete('secretKey');
			formData.set('webhookId', webhook.id);
			for (const [field, value] of Object.entries(updatePayload)) {
				formData.set(field, String(value));
			}
		}

		submitting = true;
		formError = null;
		errorField = null;
		return async ({ result }) => {
			submitting = false;

			if (result.type === 'redirect') {
				window.location.href = result.location;
				return;
			}

			if (isEditing) {
				const outcome = parseUpdateWebhookResult(result);
				if (outcome.kind === 'updated') {
					secretKey = '';
					open = false;
					toast.success('Webhook updated successfully.');
					await invalidateAll();
					return;
				}

				secretKey = '';
				formError = outcome.message;
				errorField = outcome.field;
				if (outcome.retryable) {
					toast.error('Failed to update webhook', { description: outcome.message });
				}
				return;
			}

			const addOutcome = parseAddWebhookResult(result);
			if (addOutcome.kind === 'added') {
				secretKey = '';
				open = false;
				onadded?.();
				toast.success('Webhook added successfully.');
				await invalidateAll();
			} else {
				// Never restore the secret on error ΓÇö the user re-enters it on retry.
				secretKey = '';
				formError = addOutcome.message;
				errorField = addOutcome.field;
			}
		};
	};
</script>

<Modal
	bind:open
	title={isEditing ? 'Edit Webhook' : 'Add Webhook'}
	description={isEditing
		? 'Update this webhook endpoint and its delivery status.'
		: 'Configure a new webhook endpoint to receive event notifications.'}
>
	<form
		class="flex flex-col gap-4"
		method="POST"
		action={isEditing ? '?/editWebhook' : '?/addWebhook'}
		use:enhance={onSubmit}
	>
		{#if formError && errorField === 'general'}
			<p class="text-sm text-destructive" role="alert">{formError}</p>
		{/if}

		<div class="flex flex-col gap-1.5">
			<label for="webhook-event-type" class="text-sm font-medium text-foreground">
				Event Type <span class="text-destructive">*</span>
			</label>
			<Select.Root type="single" name="eventType" bind:value={eventType}>
				<Select.Trigger
					id="webhook-event-type"
					class="w-full"
					aria-label="Webhook event type"
					aria-invalid={formError && errorField === 'eventType' ? 'true' : undefined}
				>
					{eventType || 'Select event type'}
				</Select.Trigger>
				<Select.Content>
					{#each eventTypes as eventTypeOption (eventTypeOption)}
						<Select.Item value={eventTypeOption} label={eventTypeOption}>
							{eventTypeOption}
						</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			{#if formError && errorField === 'eventType'}
				<p class="text-sm text-destructive" role="alert">{formError}</p>
			{/if}
		</div>

		<div class="flex flex-col gap-1.5">
			<label for="webhook-url" class="text-sm font-medium text-foreground">
				Webhook URL <span class="text-destructive">*</span>
			</label>
			<Input
				id="webhook-url"
				name="webhookUrl"
				bind:value={webhookUrl}
				placeholder="https://example.com/webhook"
			/>
			{#if urlTouched && !urlValid}
				<p class="text-sm text-destructive" role="alert">Enter a valid http:// or https:// URL.</p>
			{/if}
			{#if formError && errorField === 'webhookUrl'}
				<p class="text-sm text-destructive" role="alert">{formError}</p>
			{/if}
		</div>

		{#if isEditing}
			<div class="flex items-center justify-between gap-4">
				<div class="flex flex-col gap-0.5">
					<label for="webhook-active" class="text-sm font-medium text-foreground">Active</label>
					<p class="text-sm text-muted-foreground">Receive events at this endpoint.</p>
				</div>
				<Switch id="webhook-active" bind:checked={isActive} aria-label="Webhook active status" />
			</div>
		{/if}

		<div class="flex flex-col gap-1.5">
			<label for="webhook-secret" class="text-sm font-medium text-foreground">
				Secret Key
				{#if !isEditing}<span class="text-destructive">*</span>{/if}
			</label>
			<div class="relative">
				<Input
					id="webhook-secret"
					name="secretKey"
					type={showSecret ? 'text' : 'password'}
					bind:value={secretKey}
					placeholder={isEditing ? 'Leave blank to keep current secret' : 'Signing secret'}
					autocomplete="off"
					class="pr-11"
				/>
				<button
					type="button"
					onclick={() => (showSecret = !showSecret)}
					class="absolute top-1/2 right-3.5 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
					aria-label={showSecret ? 'Hide secret key' : 'Show secret key'}
				>
					{#if showSecret}
						<EyeOff class="size-4" />
					{:else}
						<Eye class="size-4" />
					{/if}
				</button>
			</div>
			{#if formError && errorField === 'secretKey'}
				<p class="text-sm text-destructive" role="alert">{formError}</p>
			{/if}
		</div>

		<Button type="submit" disabled={!canSubmit} class="w-full">
			{#if submitting}
				<span class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
				></span>
				{isEditing ? 'SavingΓÇª' : 'AddingΓÇª'}
			{:else}
				{isEditing ? 'Save Changes' : 'Add Webhook'}
			{/if}
		</Button>
	</form>
</Modal>
