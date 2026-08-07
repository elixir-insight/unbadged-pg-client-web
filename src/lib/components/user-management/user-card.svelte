<script lang="ts">
	import { Hash, MailIcon, User } from '$lib/assets/icons';
	import { Chip } from '$lib/components/reusable';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import type { BadgeVariant } from '$lib/components/ui/badge';
	import { cn } from '$lib/utils';
	import type { UserItem } from '$lib/stores/user-management/user-management';

	function statusBadgeVariant(status: UserItem['status']): BadgeVariant {
		return status === 'Active' ? 'success' : 'info';
	}

	let {
		user,
		selected = false,
		onclick
	}: {
		user: UserItem;
		selected?: boolean;
		onclick?: () => void;
	} = $props();

	const ICON_COLORS = [
		{ bg: 'bg-chart-1/20', text: 'text-chart-1', border: 'border-chart-1/30' },
		{ bg: 'bg-chart-2/20', text: 'text-chart-2', border: 'border-chart-2/30' },
		{ bg: 'bg-success/20', text: 'text-success', border: 'border-success/30' },
		{ bg: 'bg-warning/20', text: 'text-warning', border: 'border-warning/30' },
		{ bg: 'bg-destructive/20', text: 'text-destructive', border: 'border-destructive/30' },
		{ bg: 'bg-chart-3/20', text: 'text-chart-3', border: 'border-chart-3/30' },
		{ bg: 'bg-chart-4/20', text: 'text-chart-4', border: 'border-chart-4/30' },
		{ bg: 'bg-primary/20', text: 'text-primary', border: 'border-primary/30' }
	];

	const colorIndex = $derived(Number(user.id) % ICON_COLORS.length);
	const color = $derived(ICON_COLORS[colorIndex]);
	const visibleRoles = $derived(user.roles.slice(0, 3));
	const hiddenRoles = $derived(user.roles.slice(2));
</script>

<div
	id={user.id}
	class={cn(
		'group/card flex w-full flex-col overflow-hidden rounded-xl border bg-card shadow transition-all duration-200 hover:border-primary/40 hover:shadow-md',
		selected ? 'border-primary bg-primary/5' : 'border-border'
	)}
>
	<Tooltip.TooltipProvider delayDuration={200}>
		<button class=" h-full cursor-pointer" {onclick} tabindex="0">
			<div class="flex flex-col gap-3 p-4 text-left">
				<div class="flex items-start gap-3">
					<div
						class={cn(
							'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border shadow',
							color.bg,
							color.border
						)}
					>
						<User class={cn('h-5 w-5', color.text)} />
					</div>

					<div class="min-w-0 flex-1">
						<div class="flex items-start justify-between gap-2">
							<p class="truncate text-sm leading-tight font-semibold text-foreground">
								{user.name}
							</p>
							<Chip
								variant={statusBadgeVariant(user.status)}
								class="shrink-0 text-[10px] tracking-wide"
							>
								{user.status}
							</Chip>
						</div>

						<div class="mt-2 space-y-1">
							<div class="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
								<Hash class="h-3.5 w-3.5 shrink-0" />
								<span class="truncate">{user.employeeId}</span>
							</div>
							<div class="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
								<MailIcon class="h-3.5 w-3.5 shrink-0" />
								<span class="truncate">{user.email}</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div class="border-t border-border"></div>

			<div class="flex flex-col gap-2 px-4 py-3">
				{#if user.roles.length > 0}
					<div class="flex flex-wrap items-center gap-1.5">
						{#each visibleRoles as role (role)}
							<Chip variant="outline" class="block max-w-full truncate text-[10px]">
								{role}
							</Chip>
						{/each}

						{#if hiddenRoles.length > 0}
							<Tooltip.Root>
								<Tooltip.Trigger>
									<Chip variant="secondary" class="text-[10px]">+{hiddenRoles.length}</Chip>
								</Tooltip.Trigger>
								<Tooltip.Content side="top" class="max-w-xs p-2 text-left">
									<ul class="space-y-1">
										{#each hiddenRoles as role (role)}
											<li class="text-xs leading-snug">{role}</li>
										{/each}
									</ul>
								</Tooltip.Content>
							</Tooltip.Root>
						{/if}
					</div>
				{/if}
			</div>
		</button>
	</Tooltip.TooltipProvider>
</div>
