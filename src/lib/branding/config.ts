import type { Component } from 'svelte';
import favicon from '$lib/assets/favicon.svg';
// import CompanyLogoAlt from '$lib/assets/icons/company-logo-alt.svelte';
// import CompanyLogoDark from '$lib/assets/icons/company-logo-dark.svelte';
// import CompanyLogoLight from '$lib/assets/icons/company-logo-light.svelte';
import CompanyLogo from '$lib/assets/icons/company-logo.svelte';

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
		logoLight: Component;
		// logoDark: Component;
		// logoAlt: Component;
		loginVideo: string;
		loginFallbackImage: string;
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
		terms: 'https://PaymentGateway.in/terms',
		privacy: 'https://PaymentGateway.in/privacy',
		marketing: 'https://PaymentGateway.in',
		website: 'https://PaymentGateway.com'
	},
	emails: {
		support: 'admin@paywave.com',
		demo: 'merchant@paywave.com',
		placeholder: 'name@company.com'
	},
	copy: {
		copyright: `© ${COPYRIGHT_YEAR} ${BRAND_NAME}`,
		footer: `© ${COPYRIGHT_YEAR} ${BRAND_NAME} • Secure Payment Gateway Platform`,
		termsLabel: 'Terms and Conditions',
		privacyLabel: 'Privacy Policy',
		pipelineFeeSubtitle: 'Pipeline fee PayWave pay earns — negotiated per organization.',
		trustBadges: [
			{ title: '256-bit SSL', subtitle: 'Encryption' },
			{ title: 'PCI DSS', subtitle: 'Certified' },
			{ title: 'RBI Guidelines', subtitle: 'Followed' }
		]
	},
	assets: {
		favicon,
		logoLight: CompanyLogo,
		// logoDark: CompanyLogoDark,
		// logoAlt: CompanyLogoAlt,5
		loginVideo: '/images/login-img.png',
		loginFallbackImage: '/images/login-img.png',
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
