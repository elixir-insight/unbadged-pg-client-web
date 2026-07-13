<script lang="ts">
	import { beforeNavigate, goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button, Input } from '$lib/components/reusable';
	import type { OrganizationIntegration } from '$lib/data/mockData';
	import { cloneOrganization, getAdjacentFlowSteps, previewPath } from '../../helpers';

	let { data } = $props();

	const organization = $derived(data.organization);
	const orgId = $derived(organization.id);

	let editableIntegration = $state<OrganizationIntegration>(
		cloneOrganization(
			data.organization.integration ?? {
				callbackUrl: '',
				whitelistedIp: ''
			}
		)
	);
	let lastOrgId = $state(data.organization.id);
	let draftSaved = $state(false);
	let savedClearTimer = $state<ReturnType<typeof setTimeout> | null>(null);

	$effect(() => {
		if (organization.id !== lastOrgId) {
			editableIntegration = cloneOrganization(
				organization.integration ?? {
					callbackUrl: '',
					whitelistedIp: ''
				}
			);
			lastOrgId = organization.id;
			clearSavedConfirmation();
		}
	});

	$effect(() => {
		if (organization.category !== 'MERCHANT') {
			goto(resolve('/management/organizations/[orgId]/kyb', { orgId: organization.id }), {
				replaceState: true
			});
		}
	});

	$effect(() => {
		return () => {
			if (savedClearTimer) clearTimeout(savedClearTimer);
		};
	});

	const adjacent = $derived(getAdjacentFlowSteps(organization.category, 'integration'));
	const canContinue = $derived(
		Boolean(editableIntegration.callbackUrl.trim() && editableIntegration.whitelistedIp.trim())
	);

	beforeNavigate(({ to }) => {
		if (!to || to.route.id === '/management/organizations') return;
		if (organization.category !== 'MERCHANT') return;
		saveIntegration();
	});

	function clearSavedConfirmation() {
		draftSaved = false;
		if (savedClearTimer) {
			clearTimeout(savedClearTimer);
			savedClearTimer = null;
		}
	}

	function saveIntegration() {
		if (!organization.integration) {
			organization.integration = cloneOrganization(editableIntegration);
		} else {
			Object.assign(organization.integration, cloneOrganization(editableIntegration));
		}
	}

	function saveAsDraft() {
		saveIntegration();
		draftSaved = true;
		if (savedClearTimer) clearTimeout(savedClearTimer);
		savedClearTimer = setTimeout(() => {
			draftSaved = false;
			savedClearTimer = null;
		}, 3000);
	}

	function navigateAfterSave(href: string) {
		saveIntegration();
		goto(resolve(href as '/'));
	}

	function goNext() {
		if (!canContinue) return;
		if (adjacent.next) {
			navigateAfterSave(adjacent.next.href(orgId));
			return;
		}
		navigateAfterSave(previewPath(orgId));
	}
</script>

{#snippet textField(
	label: string,
	value: string,
	onChange: (value: string) => void,
	placeholder = '',
	type: 'text' | 'email' | 'tel' | 'url' = 'text'
)}
	<label class="space-y-2">
		<span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
		<Input
			{type}
			{value}
			oninput={(event) => {
				clearSavedConfirmation();
				onChange((event.currentTarget as HTMLInputElement).value);
			}}
			{placeholder}
		/>
	</label>
{/snippet}

{#if organization.category === 'MERCHANT'}
	<div class="space-y-6">
		<div>
			<h2 class="text-base font-semibold">Integration</h2>
			<p class="mt-1 text-sm text-muted-foreground">
				Configure the callback URL and whitelisted IP.
			</p>
		</div>

		<div class="grid gap-4 md:grid-cols-2">
			{@render textField(
				'Callback URL',
				editableIntegration.callbackUrl,
				(value) => {
					editableIntegration.callbackUrl = value;
				},
				'https://merchant.example.com/callback',
				'url'
			)}
			{@render textField(
				'IP Address',
				editableIntegration.whitelistedIp,
				(value) => {
					editableIntegration.whitelistedIp = value;
				},
				'203.0.113.10'
			)}
		</div>

		<div class="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
			<Button variant="outline" href="/management/organizations">Cancel</Button>
			<div class="flex flex-wrap items-center gap-3">
				{#if draftSaved}
					<span class="text-sm text-muted-foreground">Saved</span>
				{/if}
				<Button variant="outline" onclick={saveAsDraft}>Save as draft</Button>
				<Button disabled={!canContinue} onclick={goNext}>
					{adjacent.next?.key === 'review' || !adjacent.next ? 'Review & approve' : 'Next step'}
				</Button>
			</div>
		</div>
	</div>
{/if}
