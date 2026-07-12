<script module lang="ts">
	export interface OnboardingStage {
		stage: string;
		count: number;
		color: string;
	}

	export interface OrgProfileStatusItem {
		status: string;
		count: number;
		percentage: number;
		color: string;
	}

	interface DonutDatum {
		label: string;
		count: number;
		percentage: number;
		color: string;
	}
</script>

<script lang="ts">
	import * as Chart from '$lib/components/ui/chart';
	import * as Card from '$lib/components/ui/card';
	import * as Tabs from '$lib/components/ui/tabs';
	import { PieChart } from 'layerchart';
	import { cn } from '$lib/utils';

	let {
		onboardingStages,
		totalInPipeline,
		orgProfileStatus,
		class: className
	}: {
		onboardingStages: OnboardingStage[];
		totalInPipeline: number;
		orgProfileStatus: OrgProfileStatusItem[];
		class?: string;
	} = $props();

	let activeTab = $state<'onboarding' | 'profile'>('onboarding');

	const onboardingData = $derived<DonutDatum[]>(
		onboardingStages.map((item) => ({
			label: item.stage,
			count: item.count,
			percentage: Math.round((item.count / totalInPipeline) * 100),
			color: item.color
		}))
	);

	const orgProfileData = $derived<DonutDatum[]>(
		orgProfileStatus.map((item) => ({
			label: item.status,
			count: item.count,
			percentage: item.percentage,
			color: item.color
		}))
	);

	const activeData = $derived(activeTab === 'onboarding' ? onboardingData : orgProfileData);

	const leadDatum = $derived(
		activeData.reduce((max, item) => (item.percentage > max.percentage ? item : max), activeData[0])
	);

	const chartConfig = $derived(
		Object.fromEntries(
			activeData.map((item) => [
				item.label.toLowerCase().replace(/\s+/g, '_'),
				{ label: item.label, color: item.color }
			])
		) as Chart.ChartConfig
	);
</script>

<Card.Root size="sm" class={cn('flex h-full min-h-0 flex-col', className)}>
	<Card.Header>
		<Tabs.Root bind:value={activeTab}>
			<Tabs.List class="w-fit">
				<Tabs.Trigger value="onboarding">Onboarding status</Tabs.Trigger>
				<Tabs.Trigger value="profile">Org profile status</Tabs.Trigger>
			</Tabs.List>
		</Tabs.Root>
		<Card.Description class="text-xs tabular-nums">
			{#if activeTab === 'onboarding'}
				{totalInPipeline.toLocaleString()} total in pipeline
			{:else}
				Distribution by state
			{/if}
		</Card.Description>
	</Card.Header>

	<Card.Content class="flex min-h-0 flex-1 flex-col">
		<div class="flex min-h-0 flex-1 flex-col items-center gap-4 sm:flex-row sm:justify-center">
			<div class="relative flex size-60 shrink-0 items-center justify-center">
				<Chart.Container config={chartConfig} class="h-full w-full">
					<PieChart
						data={activeData}
						key="label"
						value="count"
						c="color"
						innerRadius={72}
						padding={22}
						props={{ pie: { motion: 'tween' } }}
					>
						{#snippet tooltip()}
							<Chart.Tooltip hideLabel />
						{/snippet}
					</PieChart>
				</Chart.Container>
				<div class="pointer-events-none absolute flex flex-col items-center">
					<span class="text-3xl font-bold tabular-nums text-foreground"
						>{leadDatum.percentage}%</span
					>
					<span class="text-xs font-medium text-muted-foreground">{leadDatum.label}</span>
				</div>
			</div>

			<ul
				class="flex w-full flex-col gap-2 sm:w-auto"
				aria-label={activeTab === 'onboarding'
					? 'Onboarding stage breakdown'
					: 'Organization status breakdown'}
			>
				{#each activeData as item (item.label)}
					<li class="flex items-center gap-2 text-xs">
						<span
							class="size-2.5 shrink-0 rounded-full"
							style:background-color={item.color}
							aria-hidden="true"
						></span>
						<span class="text-muted-foreground">{item.label}</span>
						<span class="ml-auto font-semibold tabular-nums text-foreground sm:ml-4"
							>{item.percentage}%</span
						>
					</li>
				{/each}
			</ul>
		</div>
	</Card.Content>
</Card.Root>
