<script lang="ts">
	import { onMount } from 'svelte';
	import { theme } from '$lib/stores/theme.svelte';

	let { children } = $props();

	let videoEl = $state<HTMLVideoElement | null>(null);
	let videoReady = $state(false);
	let videoFailed = $state(false);

	$effect(() => {
		const el = videoEl;
		if (!el || videoFailed) return;

		const reveal = () => {
			videoReady = true;
		};

		const fail = () => {
			videoFailed = true;
		};

		const startPlayback = () => {
			void el.play().then(reveal).catch(fail);
		};

		// Reveal on first decoded frame — canplay waits for a large buffer and feels slow.
		el.addEventListener('loadeddata', startPlayback);
		el.addEventListener('playing', reveal);
		el.addEventListener('error', fail);

		if (el.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
			startPlayback();
		}

		return () => {
			el.removeEventListener('loadeddata', startPlayback);
			el.removeEventListener('playing', reveal);
			el.removeEventListener('error', fail);
		};
	});

	onMount(() => {
		theme.init();
	});
</script>

<div class="flex h-dvh w-full overflow-hidden p-0 lg:gap-3 lg:p-4">
	<!-- Left Panel — desktop / large tablet only -->
	<div class="relative hidden h-full w-1/2 overflow-hidden rounded-2xl shadow lg:block">
		{#if !videoFailed}
			<video
				bind:this={videoEl}
				src="/video/LoginVid.mp4"
				class="absolute inset-0 h-full w-full object-cover"
				preload="auto"
				autoplay
				muted
				loop
				playsinline
				aria-hidden="true"
			></video>
		{/if}
		<img
			src="/images/LoginImage.jpg"
			alt=""
			class="absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-out {videoReady
				? 'pointer-events-none opacity-0'
				: 'opacity-100'}"
			aria-hidden="true"
		/>
	</div>

	<!-- Right Panel — page content -->
	<div class="relative flex min-h-0 w-full flex-1 flex-col bg-background lg:w-1/2">
		{@render children()}
	</div>
</div>
