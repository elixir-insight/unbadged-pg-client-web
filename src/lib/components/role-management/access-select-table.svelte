<script lang="ts">
	import { Chip } from '$lib/components/reusable';
	import { Button } from '$lib/components/reusable';
	import { Checkbox } from '$lib/components/reusable';
	import { cn } from '$lib/utils';
	import type {
		ModuleDef,
		PermKey,
		PermissionsState
	} from '$lib/stores/role-management/role-management';
	import type { PermissionOption } from '$lib/stores/role-management/permissions-mapper';
	import { Shield } from '$lib/assets/icons';

	let {
		modules,
		title,
		permissions,
		permKeys,
		permLabels,
		description,
		optionsByModule,
		allSelected = false,
		onToggle,
		onToggleAll
	}: {
		modules: ModuleDef[];
		title: string;
		description: string;
		permissions: PermissionsState;
		permKeys: PermKey[];
		permLabels: Record<string, string>;
		/** When provided, only API-available permissions are shown per module. */
		optionsByModule?: Record<string, PermissionOption[]>;
		allSelected?: boolean;
		onToggle: (moduleId: string, key: PermKey) => void;
		onToggleAll?: () => void;
	} = $props();

	let activeModuleId = $state('');
	let activeModule = $derived(
		(activeModuleId ? modules.find((m) => m.id === activeModuleId) : undefined) ?? modules[0]
	);

	type DisplayOption = {
		key: PermKey;
		label: string;
	};

	let activeOptions = $derived.by((): DisplayOption[] => {
		if (!activeModule) return [];

		if (optionsByModule) {
			const apiOptions = optionsByModule[activeModule.id] ?? [];
			const rows: DisplayOption[] = apiOptions.map((o) => ({
				key: o.key,
				label: o.label
			}));
			if (apiOptions.length > 0) {
				rows.push({ key: 'fullAccess', label: permLabels.fullAccess ?? 'Full access' });
			}
			return rows;
		}

		return permKeys.map((key) => ({
			key,
			label: permLabels[key] ?? key
		}));
	});

	function moduleCount(moduleId: string): number {
		const perms = permissions[moduleId];
		if (!perms) return 0;
		if (optionsByModule) {
			const options = optionsByModule[moduleId] ?? [];
			return options.filter((o) => perms[o.key]).length;
		}
		return permKeys.filter((k) => k !== 'fullAccess' && perms[k]).length;
	}
</script>

<div class="rounded-xl border border-border bg-card shadow">
	<!-- Card header -->
	<div class="flex items-center justify-between border-b border-border px-5 py-4">
		<div>
			<h2 class="text-sm font-semibold text-foreground">{title}</h2>
		</div>
		{#if onToggleAll}
			<Button variant="outline" size="sm" onclick={onToggleAll} class="shadow">
				{allSelected ? 'Deselect all' : 'Select all'}
			</Button>
		{/if}
	</div>

	<!-- Two-panel body -->
	<div class="flex h-96">
		<!-- Left: module list -->
		<div class="w-70 shrink-0 overflow-y-auto border-r border-border">
			{#each modules as mod (mod.id)}
				{@const count = moduleCount(mod.id)}
				<button
					type="button"
					class={cn(
						'flex w-full items-center gap-3 border-l-2 px-4 py-3 text-left transition-colors hover:bg-accent/60',
						activeModule.id === mod.id
							? 'border-primary bg-accent/60 dark:bg-accent/40'
							: 'border-transparent'
					)}
					onclick={() => (activeModuleId = mod.id)}
				>
					<div
						class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
					>
						<mod.icon class="h-4 w-4" />
					</div>
					<span class="min-w-0 flex-1 truncate text-sm text-foreground">{mod.name}</span>
					{#if count > 0}
						<Chip class="h-5 shrink-0 rounded-full px-1.5 text-xs">{count}</Chip>
					{/if}
				</button>
			{/each}
		</div>

		<!-- Right: permissions for active module -->
		<div class="flex-1 overflow-y-auto p-5">
			{#if activeModule}
				<!-- Module header -->
				<div class="mb-5 flex items-center gap-3">
					<div
						class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
					>
						<activeModule.icon class="h-5 w-5" />
					</div>
					<div>
						<p class="text-sm font-semibold text-foreground">{activeModule.name}</p>
						<p class="text-xs text-muted-foreground">{description}</p>
					</div>
				</div>

				<!-- Permission rows -->
				<div class="flex flex-col gap-2">
					{#each activeOptions as option (option.key)}
						<button
							type="button"
							class="flex w-full cursor-pointer items-center justify-between gap-4 rounded-lg border-2 border-border/60 px-4 py-3 text-left transition-all hover:border-primary hover:bg-accent/40 focus-visible:border-primary focus-visible:outline-none"
							onclick={() => onToggle(activeModule.id, option.key)}
						>
							<div class="flex items-center gap-2.5 text-sm text-foreground">
								<Shield class="w-3.5 shrink-0" />
								{option.label}
							</div>
							<div class="pointer-events-none shrink-0">
								<Checkbox checked={permissions[activeModule.id]?.[option.key] ?? false} />
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
