const STORAGE_KEY = 'app-theme';

let isDark = $state(false);

function applyTheme(dark: boolean) {
	if (typeof document === 'undefined') return;
	document.documentElement.classList.toggle('dark', dark);
}

export const theme = {
	get isDark() {
		return isDark;
	},

	// Call once on app mount. Reads the user's saved preference; falls back to
	// light mode (never auto-follows system preference — user has explicit control).
	init() {
		if (typeof window === 'undefined') return;
		isDark = localStorage.getItem(STORAGE_KEY) === 'dark';
		applyTheme(isDark);
	},

	toggle() {
		isDark = !isDark;
		applyTheme(isDark);
		if (typeof window !== 'undefined') {
			localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
		}
	}
};
