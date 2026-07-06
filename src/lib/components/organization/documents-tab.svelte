<script lang="ts">
	import {
		Eye,
		Download,
		FileText,
		CheckCircle2,
		AlertCircle,
		XIcon,
		Pencil
	} from '$lib/assets/icons';
	import { Button } from '$lib/components/reusable';
	import DocumentUploadFields from './document-upload-fields.svelte';
	import AgreementActivationPanel from './agreement-activation-panel.svelte';
	import type { OrgDocument } from './types';
	import { cn } from '$lib/utils';
	import { buildDocumentFormState, type DocumentFormKey } from '$lib/utils/document-upload-form';

	interface Director {
		id: number;
		name: string;
		aadhaar: string;
		pan: string;
		email: string;
		phone: string;
	}

	interface Props {
		orgName?: string;
		documents: OrgDocument[];
		directors?: Director[];
		businessType?: string;
		agreementUploaded?: boolean;
		showProfileActivation?: boolean;
		onactivate?: () => Promise<void>;
		onagreementchange?: (file: File | null) => void;
		onviewdoc?: (doc: OrgDocument) => void;
		ondownloaddoc?: (doc: OrgDocument) => void;
	}

	let {
		orgName = 'this organization',
		documents,
		directors = [],
		businessType = '',
		agreementUploaded = false,
		showProfileActivation = false,
		onactivate,
		onagreementchange,
		onviewdoc,
		ondownloaddoc
	}: Props = $props();
	let isEditingDocuments = $state(false);
	let formInitialized = $state(false);

	let docFiles = $state<Record<DocumentFormKey, File | null>>({
		bizCert: null,
		proofOfFunds: null,
		rentalAgreement: null,
		gstCert: null,
		proprietorPhoto: null,
		bizPan: null,
		bizTan: null,
		aoaCert: null,
		moaCert: null
	});
	let bizCertType = $state('incorporation_certificate');
	let proofOfFundsType = $state('last_3_months_bank_statements');
	let rentalAgreementType = $state('');
	let directorDocFiles = $state<Record<number, { aadhaar: File | null; pan: File | null }>>({});

	function initializeDocumentForm() {
		const initial = buildDocumentFormState(documents, directors);
		docFiles = initial.docFiles;
		bizCertType = initial.bizCertType;
		proofOfFundsType = initial.proofOfFundsType;
		rentalAgreementType = initial.rentalAgreementType;
		directorDocFiles = initial.directorDocFiles;
		formInitialized = true;
	}

	function openDocumentEditor() {
		if (!formInitialized) {
			initializeDocumentForm();
		}
		isEditingDocuments = true;
	}

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

	const AGREEMENT_SLOT: DocumentSlot = {
		id: 'agreement',
		label: 'Agreement Document',
		typeKey: 'Agreement',
		required: true,
		description: 'Signed organization agreement for profile activation'
	};

	const approvedCount = $derived(documents.filter((d) => d.status === 'Approved').length);

	const slotDocs = $derived(
		DOCUMENT_SLOTS.map((slot) => ({
			slot,
			doc: documents.find((d) => d.type === slot.typeKey) ?? null
		}))
	);

	const agreementDoc = $derived(documents.find((d) => d.type === 'Agreement') ?? null);

	const displayDocs = $derived([
		...slotDocs,
		...(agreementDoc ? [{ slot: AGREEMENT_SLOT, doc: agreementDoc }] : [])
	]);
</script>

<div class="space-y-5">
	{#if showProfileActivation}
		<AgreementActivationPanel
			variant="profile"
			{orgName}
			{agreementUploaded}
			onAgreementChange={onagreementchange}
			{onactivate}
		/>
	{/if}

	{#if isEditingDocuments}
		<DocumentUploadFields
			{directors}
			bind:directorDocFiles
			bind:docFiles
			bind:bizCertType
			bind:proofOfFundsType
			bind:rentalAgreementType
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
			<Button size="sm" variant="outline" onclick={openDocumentEditor} class="shrink-0">
				<Pencil class="size-4" />
				Edit Documents
			</Button>
		</div>

		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
			{#each displayDocs as { slot, doc } (slot.id)}
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
