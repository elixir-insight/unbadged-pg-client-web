import { browser } from '$app/environment';

const DESKTOP_QUERY = '(min-width: 1024px)';

export function createIsDesktop() {
	let isDesktop = $state(browser ? window.matchMedia(DESKTOP_QUERY).matches : true);

	$effect(() => {
		if (!browser) return;

		const media = window.matchMedia(DESKTOP_QUERY);
		const onChange = (event: MediaQueryListEvent) => {
			isDesktop = event.matches;
		};

		isDesktop = media.matches;
		media.addEventListener('change', onChange);
		return () => media.removeEventListener('change', onChange);
	});

	return {
		get current() {
			return isDesktop;
		}
	};
}
