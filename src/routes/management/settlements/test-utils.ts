/** Polls a condition until it's true — for waiting out the hooks' simulated fetch latency in tests. */
export function waitFor(predicate: () => boolean, timeout = 2000, interval = 20): Promise<void> {
	return new Promise((resolve, reject) => {
		const start = Date.now();
		const tick = () => {
			if (predicate()) {
				resolve();
				return;
			}
			if (Date.now() - start > timeout) {
				reject(new Error('waitFor timed out'));
				return;
			}
			setTimeout(tick, interval);
		};
		tick();
	});
}
