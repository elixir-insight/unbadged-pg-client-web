<script lang="ts">
	import { STAGES, type StageKey } from './stages';
	import StageProgress from './stage-progress.svelte';

	let {
		currentStage,
		currentTabLabel
	}: {
		currentStage: StageKey;
		currentTabLabel: string;
	} = $props();

	const stageIndex = $derived(STAGES.findIndex((item) => item.key === currentStage));
</script>

<div class="border-b border-border bg-sidebar px-4 py-4">
	<StageProgress currentIndex={stageIndex} total={STAGES.length} label={currentTabLabel} />
</div>
