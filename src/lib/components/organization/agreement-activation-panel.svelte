<script lang="ts">
	import { Button } from '$lib/components/reusable';
	import { ShieldCheck, Upload, AlertCircle, ExternalLink } from '$lib/assets/icons';
	import { cn } from '$lib/utils';
	import ActivateOrgDialog from './activate-org-dialog.svelte';

	type Variant = 'configuration' | 'profile';

	interface Props {
		variant: Variant;
		orgName?: string;
		agreementUploaded?: boolean;
		onViewDocuments?: () => void;
		onAgreementChange?: (file: File | null) => void;
		onActivate?: () => Promise<void>;
	}

	let {
		variant,
		orgName = 'this organization',
		agreementUploaded = false,
		onViewDocuments,
		onAgreementChange,
		onActivate
	}: Props = $props();

	let showActivationDialog = $state(false);
	let isDragOver = $state(false);
	let fileInput = $state<HTMLInputElement | null>(null);

	const isConfiguration = $derived(variant === 'configuration');
	const isReady = $derived(agreementUploaded);

	const readyText = $derived(
		'Your agreement document has been uploaded. Activate this profile to enable production access.'
	);

	const accept = '.pdf,.png,.jpg,.jpeg';

	function applyFile(incoming: File | null | undefined) {
		onAgreementChange?.(incoming ?? null);
	}

	function handleInputChange(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		applyFile(input.files?.[0]);
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragOver = false;
		applyFile(e.dataTransfer?.files?.[0]);
	}

	function openFilePicker() {
		fileInput?.click();
	}
</script>

<input bind:this={fileInput} type="file" class="sr-only" {accept} onchange={handleInputChange} />

{#if !isReady}
	<div
		class={cn(
			'activation-panel rounded-lg border bg-primary/5 transition-colors',
			isDragOver ? 'border-primary/40 bg-primary/10' : 'border-primary/20'
		)}
		style="view-transition-name: activation-panel"
		role="group"
		aria-label="Action Required: Upload Agreement Document"
		ondragover={(e) => {
			e.preventDefault();
			isDragOver = true;
		}}
		ondragleave={() => (isDragOver = false)}
		ondrop={handleDrop}
	>
		<div
			class="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4"
		>
			<div class="flex min-w-0 items-start gap-2.5">
				<div
					class="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
				>
					<AlertCircle class="size-3.5" />
				</div>
				<div class="min-w-0 space-y-1">
					<p class="text-sm font-semibold text-primary">
						Action Required: Upload Agreement Document
					</p>
					<p class="text-xs text-muted-foreground">
						The signed Agreement Document is required to proceed.
					</p>
				</div>
			</div>

			<div
				class="flex shrink-0 flex-col items-stretch gap-1 px-4 sm:items-end sm:border-l sm:border-border/50 sm:px-6"
			>
				<Button size="sm" class="h-8 px-3 text-xs" onclick={openFilePicker}>
					<Upload class="size-3.5" />
					Upload Agreement
				</Button>
				{#if onViewDocuments}
					<button
						type="button"
						onclick={onViewDocuments}
						class="inline-flex items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-primary sm:justify-end"
					>
						Learn more
						<ExternalLink class="size-3" />
					</button>
				{/if}
			</div>
		</div>
	</div>
{:else if !isConfiguration}
	<div
		class="activation-panel flex flex-col gap-3 rounded-lg border border-success/25 bg-success/8 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4"
		style="view-transition-name: activation-panel"
		role="group"
		aria-label="Agreement uploaded"
	>
		<p class="text-xs leading-relaxed text-muted-foreground sm:text-sm">{readyText}</p>
		<Button
			size="sm"
			class="h-8 shrink-0 px-3 text-xs"
			onclick={() => (showActivationDialog = true)}
		>
			<ShieldCheck class="size-3.5" />
			Activate profile
		</Button>
	</div>
{/if}

<ActivateOrgDialog
	{orgName}
	open={showActivationDialog}
	onclose={() => (showActivationDialog = false)}
	onconfirm={async () => {
		await onActivate?.();
	}}
/>
