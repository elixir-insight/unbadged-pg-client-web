// ─── CSS Color Token types ────────────────────────────────────────────────────
// All color values reference CSS custom properties defined in layout.css.

export type CssColorToken = {
	label: string;
	cssVar: string; // e.g. '--primary'
	value: string; // e.g. 'var(--primary)'
	isLight: boolean; // true = light background, needs dark overlay text
};

export type ColorGroup = {
	id: string;
	label: string;
	usage: string;
	tokens: CssColorToken[];
};

export const colorGroups: ColorGroup[] = [
	{
		id: 'brand',
		label: 'Brand',
		usage: 'Primary CTAs, action buttons, links, and keyboard focus rings',
		tokens: [
			{ label: 'Primary', cssVar: '--primary', value: 'var(--primary)', isLight: false },
			{
				label: 'Primary Foreground',
				cssVar: '--primary-foreground',
				value: 'var(--primary-foreground)',
				isLight: true
			},
			{ label: 'Secondary', cssVar: '--secondary', value: 'var(--secondary)', isLight: true },
			{
				label: 'Secondary Foreground',
				cssVar: '--secondary-foreground',
				value: 'var(--secondary-foreground)',
				isLight: false
			}
		]
	},
	{
		id: 'surface',
		label: 'Surface',
		usage: 'Page backgrounds, card surfaces, popovers, and muted sections',
		tokens: [
			{ label: 'Background', cssVar: '--background', value: 'var(--background)', isLight: true },
			{ label: 'Foreground', cssVar: '--foreground', value: 'var(--foreground)', isLight: false },
			{ label: 'Card', cssVar: '--card', value: 'var(--card)', isLight: true },
			{
				label: 'Card Foreground',
				cssVar: '--card-foreground',
				value: 'var(--card-foreground)',
				isLight: false
			},
			{ label: 'Popover', cssVar: '--popover', value: 'var(--popover)', isLight: true },
			{
				label: 'Popover Foreground',
				cssVar: '--popover-foreground',
				value: 'var(--popover-foreground)',
				isLight: false
			},
			{ label: 'Muted', cssVar: '--muted', value: 'var(--muted)', isLight: true },
			{
				label: 'Muted Foreground',
				cssVar: '--muted-foreground',
				value: 'var(--muted-foreground)',
				isLight: true
			}
		]
	},
	{
		id: 'accent',
		label: 'Accent',
		usage: 'Hover states, selected rows in transaction tables, highlighted items',
		tokens: [
			{ label: 'Accent', cssVar: '--accent', value: 'var(--accent)', isLight: true },
			{
				label: 'Accent Foreground',
				cssVar: '--accent-foreground',
				value: 'var(--accent-foreground)',
				isLight: false
			}
		]
	},
	{
		id: 'semantic',
		label: 'Semantic',
		usage: 'Failed payments, declined cards, error alerts, destructive actions',
		tokens: [
			{
				label: 'Destructive',
				cssVar: '--destructive',
				value: 'var(--destructive)',
				isLight: false
			},
			{
				label: 'Destructive Foreground',
				cssVar: '--destructive-foreground',
				value: 'var(--destructive-foreground)',
				isLight: true
			}
		]
	},
	{
		id: 'structural',
		label: 'Structural',
		usage: 'Input borders, dividers, and focus outlines',
		tokens: [
			{ label: 'Border', cssVar: '--border', value: 'var(--border)', isLight: true },
			{ label: 'Input', cssVar: '--input', value: 'var(--input)', isLight: true },
			{ label: 'Ring', cssVar: '--ring', value: 'var(--ring)', isLight: false }
		]
	},
	{
		id: 'chart',
		label: 'Chart',
		usage: 'Transaction volume bars, pie charts, and payment trend lines',
		tokens: [
			{ label: 'Chart 1', cssVar: '--chart-1', value: 'var(--chart-1)', isLight: false },
			{ label: 'Chart 2', cssVar: '--chart-2', value: 'var(--chart-2)', isLight: false },
			{ label: 'Chart 3', cssVar: '--chart-3', value: 'var(--chart-3)', isLight: true },
			{ label: 'Chart 4', cssVar: '--chart-4', value: 'var(--chart-4)', isLight: true },
			{ label: 'Chart 5', cssVar: '--chart-5', value: 'var(--chart-5)', isLight: true }
		]
	},
	{
		id: 'sidebar',
		label: 'Sidebar',
		usage: 'Navigation sidebar surfaces, text, and interactive states',
		tokens: [
			{ label: 'Sidebar', cssVar: '--sidebar', value: 'var(--sidebar)', isLight: true },
			{
				label: 'Sidebar Foreground',
				cssVar: '--sidebar-foreground',
				value: 'var(--sidebar-foreground)',
				isLight: false
			},
			{
				label: 'Sidebar Primary',
				cssVar: '--sidebar-primary',
				value: 'var(--sidebar-primary)',
				isLight: false
			},
			{
				label: 'Sidebar Accent',
				cssVar: '--sidebar-accent',
				value: 'var(--sidebar-accent)',
				isLight: true
			},
			{
				label: 'Sidebar Border',
				cssVar: '--sidebar-border',
				value: 'var(--sidebar-border)',
				isLight: true
			}
		]
	}
];

// ─── Typography types ─────────────────────────────────────────────────────────

export type TypographySizes = {
	xs: string;
	sm: string;
	base: string;
	md: string;
	lg: string;
	xl: string;
	'2xl': string;
	'3xl': string;
};

export type TypographyWeights = {
	regular: number;
	medium: number;
	semibold: number;
};

export type LineHeights = {
	tight: number;
	normal: number;
	relaxed: number;
};

export type AppTypography = {
	sizes: TypographySizes;
	weights: TypographyWeights;
	lineHeights: LineHeights;
};

// ─── Other token types ────────────────────────────────────────────────────────

export type AppRadii = {
	none: string;
	sm: string;
	md: string;
	lg: string;
	xl: string;
	full: string;
};

export type AppShadows = {
	sm: string;
	md: string;
	lg: string;
};

export type AppTokens = {
	typography: AppTypography;
	spacing: number[];
	radii: AppRadii;
	shadows: AppShadows;
};

// ─── Token values ─────────────────────────────────────────────────────────────

export const tokens: AppTokens = {
	typography: {
		sizes: {
			xs: '12px',
			sm: '13px',
			base: '14px',
			md: '15px',
			lg: '16px',
			xl: '18px',
			'2xl': '22px',
			'3xl': '28px'
		},
		weights: {
			regular: 400,
			medium: 500,
			semibold: 600
		},
		lineHeights: {
			tight: 1.3,
			normal: 1.6,
			relaxed: 1.8
		}
	},
	spacing: [4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96],
	radii: {
		none: '0',
		sm: 'var(--radius-sm)',
		md: 'var(--radius-md)',
		lg: 'var(--radius-lg)',
		xl: 'var(--radius-xl)',
		full: '9999px'
	},
	shadows: {
		sm: 'var(--shadow-sm)',
		md: 'var(--shadow-md)',
		lg: 'var(--shadow-lg)'
	}
};
