<script lang="ts">
	import {
		Eye,
		Download,
		FileText,
		CheckCircle2,
		AlertCircle,
		XIcon,
		ShieldCheck,
		Pencil,
		Settings
	} from '$lib/assets/icons';
	import { Button, FileUpload } from '$lib/components/reusable';
	import DocumentUploadFields from './DocumentUploadFields.svelte';
	import type { OrgDocument } from '../types';
	import { fade } from 'svelte/transition';
	import { cn } from '$lib/utils';
	import ActivationDrawer from './ActivationDrawer.svelte';

	interface Director {
		id: number;
		name: string;
		aadhaar: string;
		pan: string;
		email: string;
		phone: string;
	}

	interface Props {
		documents: OrgDocument[];
		directors?: Director[];
		businessType?: string;
		agreementFile?: File | null;
		agreementUploaded?: boolean;
		showAgreementSection?: boolean;
		showActivateButton?: boolean;
		isPartner?: boolean;
		onopenconfiguration?: () => void;
		onactivate?: () => Promise<void>;
		onviewdoc?: (doc: OrgDocument) => void;
		ondownloaddoc?: (doc: OrgDocument) => void;
	}

	let {
		documents,
		directors = [],
		businessType = '',
		agreementFile = $bindable<File | null>(null),
		agreementUploaded = false,
		showAgreementSection = false,
		showActivateButton = false,
		isPartner = false,
		onopenconfiguration,
		onactivate,
		onviewdoc,
		ondownloaddoc
	}: Props = $props();

	let showActivationDrawer = $state(false);
	let isEditingDocuments = $state(false);
	let directorDocFiles = $state<Record<number, { aadhaar: File | null; pan: File | null }>>({});

	$effect(() => {
		for (const director of directors) {
			if (!directorDocFiles[director.id]) {
				directorDocFiles[director.id] = { aadhaar: null, pan: null };
			}
		}
	});

	interface DocumentSlot {
		id: string;
		label: string;
		typeKey: string;
		required: boolean;
		description: string;
	}

	const DOCUMENT_SLOTS: DocumentSlot[] = [
		{
			id: 'incorporation',
			label: 'Certificate of Incorporation',
			typeKey: 'Incorporation',
			required: true,
			description: 'Official certificate of company registration'
		},
		{
			id: 'tax',
			label: 'Tax Registration',
			typeKey: 'Tax',
			required: true,
			description: 'Tax identification or GST / VAT certificate'
		},
		{
			id: 'director-id',
			label: 'Director ID',
			typeKey: 'ID Proof',
			required: true,
			description: 'Government-issued ID of primary director'
		},
		{
			id: 'bank-statement',
			label: 'Bank Statement',
			typeKey: 'Bank Proof',
			required: false,
			description: 'Recent bank statement (last 3 months)'
		}
	];

	function docStatusConfig(status: string) {
		if (status === 'Approved')
			return {
				cls: 'border-success/25 bg-success/8 text-success',
				icon: CheckCircle2,
				label: 'Approved'
			};
		if (status === 'In Review')
			return {
				cls: 'border-primary/25 bg-primary/8 text-primary',
				icon: AlertCircle,
				label: 'In Review'
			};
		if (status === 'Rejected')
			return {
				cls: 'border-destructive/25 bg-destructive/8 text-destructive',
				icon: XIcon,
				label: 'Rejected'
			};
		return {
			cls: 'border-border bg-muted/30 text-muted-foreground',
			icon: AlertCircle,
			label: status
		};
	}

	function isImageFile(name: string): boolean {
		return /\.(png|jpg|jpeg|gif|webp)$/i.test(name);
	}

	function fileIconClasses(name: string): string {
		return isImageFile(name) ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary';
	}

	const approvedCount = $derived(documents.filter((d) => d.status === 'Approved').length);

	const slotDocs = $derived(
		DOCUMENT_SLOTS.map((slot) => ({
			slot,
			doc: documents.find((d) => d.type === slot.typeKey) ?? null
		}))
	);

	const showActivateSection = $derived(showActivateButton && agreementUploaded);
	const showConfigurationSection = $derived(!isPartner && agreementUploaded);
</script>

<div class="space-y-5">
	{#if isEditingDocuments}
		<DocumentUploadFields
			{directors}
			bind:directorDocFiles
			{businessType}
			onsaved={() => (isEditingDocuments = false)}
			oncancel={() => (isEditingDocuments = false)}
		/>
	{:else}
		<div class="flex flex-wrap items-start justify-between gap-3">
			<div>
				<p class="text-base font-semibold">Documents</p>
				<p class="mt-0.5 text-xs text-muted-foreground/60">
					{approvedCount}/{DOCUMENT_SLOTS.length} verified
				</p>
			</div>
			<Button
				size="sm"
				variant="outline"
				onclick={() => (isEditingDocuments = true)}
				class="shrink-0"
			>
				<Pencil class="size-4" />
				Edit Documents
			</Button>
		</div>

		{#if showAgreementSection}
			<div
				class={cn(
					'relative overflow-hidden rounded-2xl border shadow-sm transition-all',
					agreementUploaded ? 'border-success/40 bg-success/5' : 'border-border/60 bg-card'
				)}
				in:fade={{ duration: 200 }}
			>
				<div
					class={cn(
						'absolute inset-y-0 left-0 w-1',
						agreementUploaded ? 'bg-success' : 'bg-success/80'
					)}
				></div>
				<div class="space-y-4 px-4 py-4 pl-5 sm:px-5 sm:pl-6">
					<div class="flex items-start gap-3">
						<div
							class={cn(
								'flex size-10 shrink-0 items-center justify-center rounded-xl',
								agreementUploaded ? 'bg-success/12 text-success' : 'bg-success/10 text-success'
							)}
						>
							{#if agreementUploaded}
								<CheckCircle2 class="size-5" />
							{:else}
								<FileText class="size-5" />
							{/if}
						</div>
						<div class="min-w-0 flex-1">
							<p class="text-sm font-semibold text-foreground">Agreement Document</p>
							<p class="mt-0.5 text-sm text-muted-foreground">
								Upload the agreement document to enable organization activation.
							</p>
						</div>
					</div>

					<FileUpload
						bind:file={agreementFile}
						placeholder="Click to upload agreement or drag & drop"
						accept=".pdf,.png,.jpg,.jpeg"
					/>
				</div>
			</div>

			{#if showActivateSection}
				<div class="overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 shadow-xs">
					<div class="gradient-primary h-0.5"></div>
					<div class="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
						<div class="flex items-center gap-3">
							<div
								class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary"
							>
								<ShieldCheck class="size-4.5" />
							</div>
							<div>
								<p class="text-sm font-semibold">Activate Profile</p>
								<p class="mt-0.5 text-xs text-muted-foreground/60">
									Agreement uploaded. Ready to activate this partner profile.
								</p>
							</div>
						</div>
						<button
							type="button"
							onclick={() => (showActivationDrawer = true)}
							class="gradient-primary flex items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 sm:whitespace-nowrap"
						>
							<ShieldCheck class="size-4" />
							Activate Profile
						</button>
					</div>
				</div>
			{/if}

			{#if showConfigurationSection}
				<div class="overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 shadow-xs">
					<div class="gradient-primary h-0.5"></div>
					<div class="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
						<div class="flex items-center gap-3">
							<div
								class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary"
							>
								<Settings class="size-4.5" />
							</div>
							<div>
								<p class="text-sm font-semibold">Configuration</p>
								<p class="mt-0.5 text-xs text-muted-foreground/60">
									Agreement uploaded. Continue setup in the Configuration tab.
								</p>
							</div>
						</div>
						<button
							type="button"
							onclick={onopenconfiguration}
							class="gradient-primary flex items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 sm:whitespace-nowrap"
						>
							<Settings class="size-4" />
							Open Configuration
						</button>
					</div>
				</div>
			{/if}
		{/if}

		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
			{#each slotDocs as { slot, doc } (slot.id)}
				<div
					class={cn(
						'flex flex-col overflow-hidden rounded-2xl border shadow-xs transition-all duration-200',
						doc
							? 'border-border/60 bg-card hover:-translate-y-0.5 hover:shadow-sm'
							: 'border-dashed border-border/50 bg-muted/8'
					)}
				>
					<div class="flex items-start gap-3 p-4">
						<div
							class={cn(
								'flex size-10 shrink-0 items-center justify-center rounded-xl',
								doc ? fileIconClasses(doc.name) : 'bg-muted/30 text-muted-foreground/35'
							)}
						>
							<FileText class="size-5" />
						</div>
						<div class="min-w-0 flex-1">
							<p class="text-sm leading-snug font-semibold">{slot.label}</p>
							<p class="mt-0.5 text-xs text-muted-foreground/55">{slot.description}</p>
						</div>
						{#if slot.required}
							<span
								class="mt-0.5 shrink-0 rounded-md border border-border/50 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground/50 uppercase"
							>
								Required
							</span>
						{/if}
					</div>

					{#if doc}
						{@const cfg = docStatusConfig(doc.status)}
						{@const StatusIcon = cfg.icon}
						<div class="flex items-center justify-between border-t border-border/30 px-4 py-2.5">
							<div
								class={cn(
									'flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
									cfg.cls
								)}
							>
								<StatusIcon class="size-3" />
								{cfg.label}
							</div>
							<p class="text-xs text-muted-foreground/50">Uploaded {doc.uploadedDate}</p>
						</div>

						<div class="flex items-center gap-1 border-t border-border/25 px-4 py-2.5">
							<button
								type="button"
								onclick={() => onviewdoc?.(doc)}
								class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
							>
								<Eye class="size-3.5" />
								View
							</button>
							<button
								type="button"
								onclick={() => ondownloaddoc?.(doc)}
								class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
							>
								<Download class="size-3.5" />
								Download
							</button>
						</div>
					{:else}
						<div
							class="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-6 text-center"
						>
							<p class="text-xs text-muted-foreground/50">No document uploaded yet</p>
							<p class="text-[11px] text-muted-foreground/40">Use Edit Documents to upload</p>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<ActivationDrawer
	open={showActivationDrawer}
	onclose={() => (showActivationDrawer = false)}
	onconfirm={async () => {
		await onactivate?.();
	}}
/>
