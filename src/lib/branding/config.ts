import type { Component } from 'svelte';
import favicon from '$lib/assets/favicon.svg';
// import CompanyLogo from '$lib/assets/icons/company-logo.svelte';
// import CompanyLogoMark from '$lib/assets/icons/company-logo-mark.svelte';

export type BrandLogoComponent = Component<{
	width?: string;
	height?: string;
	class?: string;
}>;

/**
 * Public branding configuration — the single source of truth for brand
 * identity (name, URLs, copy, assets). This is *not* a place for secrets
 * or deployment configuration; those stay in environment variables.
 *
 * To rebrand the app, change values here and in `./theme.css`.
 */
const BRAND_NAME = 'Payment Gateway';
const COPYRIGHT_YEAR = 2026;

export type BrandTrustBadge = {
	title: string;
	subtitle: string;
};

export type BrandingConfig = {
	name: string;
	tagline: string;
	meta: {
		description: string;
		siteName: string;
		titleTemplate: (pageTitle: string) => string;
	};
	urls: {
		terms: string;
		privacy: string;
		marketing: string;
		website: string;
	};
	emails: {
		support: string;
		demo: string;
		placeholder: string;
	};
	copy: {
		copyright: string;
		footer: string;
		termsLabel: string;
		privacyLabel: string;
		pipelineFeeSubtitle: string;
		trustBadges: readonly BrandTrustBadge[];
	};
	assets: {
		favicon: string;
		// logoLight: BrandLogoComponent;
		// logoMark: BrandLogoComponent;
		// loginVideo: string;
		// loginFallbackImage: string;
		onboarding: {
			merchant: string;
			partner: string;
		};
	};
};

export const branding: BrandingConfig = {
	name: BRAND_NAME,
	tagline: 'Secure Payment Gateway Platform',
	meta: {
		description: `${BRAND_NAME} — Payment Gateway Management Platform`,
		siteName: BRAND_NAME,
		titleTemplate: (pageTitle) => `${pageTitle} | ${BRAND_NAME}`
	},
	urls: {
		terms: '',
		privacy: '',
		marketing: '',
		website: ''
	},
	emails: {
		support: 'admin@paymentgateway.com',
		demo: 'merchant@paymentgateway.com',
		placeholder: 'name@company.com'
	},
	copy: {
		copyright: `© ${COPYRIGHT_YEAR} ${BRAND_NAME}`,
		footer: `© ${COPYRIGHT_YEAR} ${BRAND_NAME} • Secure Payment Gateway Platform`,
		termsLabel: 'Terms and Conditions',
		privacyLabel: 'Privacy Policy',
		pipelineFeeSubtitle: `Pipeline fee ${BRAND_NAME} earns — negotiated per organization.`,
		trustBadges: [
			{ title: '256-bit SSL', subtitle: 'Encryption' },
			{ title: 'PCI DSS', subtitle: 'Certified' },
			{ title: 'RBI Guidelines', subtitle: 'Followed' }
		]
	},
	assets: {
		favicon,
		// logoLight: CompanyLogo,
		// logoMark: CompanyLogoMark,
		// loginVideo: '/images/login-img.png',
		// loginFallbackImage: '/images/login-img.png',
		onboarding: {
			merchant: '/images/MerchantCategory.png',
			partner: '/images/handShaking.png'
		}
	}
};

/** Build a branded email for fixtures/tests from a local-part. */
export function brandEmail(localPart: string): string {
	const domain = branding.emails.support.split('@')[1] ?? 'example.com';
	return `${localPart}@${domain}`;
}
