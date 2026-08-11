<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { MailIcon, PhoneIcon } from '$lib/assets/icons';
	import { Button, Chip, Radio, Switch, toast } from '$lib/components/reusable';
	import type { MfaConfig } from '$lib/server/domains/auth/schema';

	interface Props {
		mfaConfig: MfaConfig | null;
		mfaError: string | null;
	}

	let { mfaConfig, mfaError }: Props = $props();

	let selectedMethod = $state('EMAIL');
	let enabled = $state(false);
	let configured = $state(false);
	let submitting = $state(false);
	let enableForm = $state<HTMLFormElement | null>(null);

	const methodOptions = [
		{
			value: 'EMAIL',
			label: 'Email',
			description: 'Receive one-time codes by email.'
		},
		{
			value: 'SMS',
			label: 'SMS',
			description: 'Receive one-time codes by text message.'
		}
	];

	$effect(() => {
		configured = mfaConfig?.configured ?? false;
		enabled = mfaConfig?.enabled ?? false;
		selectedMethod = mfaConfig?.method ?? 'EMAIL';
	});

	const statusLabel = $derived(!configured ? 'Not configured' : enabled ? 'Enabled' : 'Disabled');
	const statusVariant = $derived(!configured ? 'secondary' : enabled ? 'success' : 'secondary');

	const handleResult: SubmitFunction = () => {
		submitting = true;
		return async ({ result, update }) => {
			submitting = false;

			if (result.type === 'failure') {
				const message =
					(result.data as { mfaMessage?: string } | undefined)?.mfaMessage ??
					'Could not update MFA settings.';
				toast.error(message);
				configured = mfaConfig?.configured ?? false;
				enabled = mfaConfig?.enabled ?? false;
				selectedMethod = mfaConfig?.method ?? 'EMAIL';
				return;
			}

			if (result.type === 'success') {
				const message =
					(result.data as { mfaMessage?: string } | undefined)?.mfaMessage ?? 'MFA settings saved.';
				toast.success(message);
				await invalidateAll();
			}

			await update();
		};
	};

	function toggleEnabled(checked: boolean): void {
		enabled = checked;
		queueMicrotask(() => enableForm?.requestSubmit());
	}
</script>

{#if mfaError}
	<section class="overflow-hidden rounded-xl border border-border bg-card">
		<div class="flex flex-col gap-3 px-4 py-4 sm:px-5">
			<p class="text-sm text-destructive" role="alert">{mfaError}</p>
			<Button variant="outline" size="sm" class="w-fit" onclick={() => invalidateAll()}>
				Retry
			</Button>
		</div>
	</section>
{:else}
	<section class="overflow-hidden rounded-xl border border-border bg-card">
		<div
			class="flex flex-col gap-3 border-b border-border/40 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-5"
		>
			<div class="min-w-0 flex-1">
				<h3 class="text-sm font-semibold text-foreground">Multi-factor authentication</h3>
				<p class="mt-1 text-sm text-muted-foreground">
					Add an extra verification step when signing in using email or SMS codes.
				</p>
			</div>
			<Chip variant={statusVariant}>{statusLabel}</Chip>
		</div>

		<div class="flex flex-col gap-6 px-4 py-4 sm:px-5">
			{#if configured}
				<div class="flex items-center justify-between gap-4">
					<div>
						<p class="text-sm font-medium text-foreground">Enable MFA</p>
						<p class="mt-0.5 text-sm text-muted-foreground">Turn MFA on or off for your account.</p>
					</div>
					<form
						bind:this={enableForm}
						method="POST"
						action="?/updateMfa"
						use:enhance={handleResult}
					>
						<input type="hidden" name="enabled" value={enabled.toString()} />
						<Switch checked={enabled} disabled={submitting} onCheckedChange={toggleEnabled} />
					</form>
				</div>
			{/if}

			<div class="flex flex-col gap-3">
				<p class="text-sm font-medium text-foreground">Verification method</p>
				<Radio bind:value={selectedMethod} options={methodOptions} disabled={submitting} />
			</div>

			{#if configured && mfaConfig?.method}
				<div class="flex items-center gap-2 text-sm text-muted-foreground">
					{#if mfaConfig.method === 'EMAIL'}
						<MailIcon class="size-4 shrink-0" aria-hidden="true" />
					{:else}
						<PhoneIcon class="size-4 shrink-0" aria-hidden="true" />
					{/if}
					<span>
						Currently configured for
						<span class="font-medium text-foreground">{mfaConfig.method}</span>
					</span>
				</div>
			{/if}

			{#if !configured}
				<form method="POST" action="?/createMfa" use:enhance={handleResult}>
					<input type="hidden" name="method" value={selectedMethod} />
					<Button type="submit" disabled={submitting}>
						{submitting ? 'Setting up…' : 'Set up MFA'}
					</Button>
				</form>
			{:else}
				<form method="POST" action="?/updateMfa" use:enhance={handleResult}>
					<input type="hidden" name="enabled" value="true" />
					<input type="hidden" name="method" value={selectedMethod} />
					<Button
						type="submit"
						variant="outline"
						disabled={submitting || selectedMethod === mfaConfig?.method}
					>
						{submitting ? 'Saving…' : 'Update method'}
					</Button>
				</form>
			{/if}
		</div>
	</section>
{/if}
