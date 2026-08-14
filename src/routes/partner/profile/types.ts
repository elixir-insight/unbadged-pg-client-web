export type PartnerProfile = {
	name: string;
	company: string;
	email: string;
	phone: string;
	website: string;
	city: string;
};

export type PartnerProfileFieldErrors = {
	email?: string;
	phone?: string;
	website?: string;
};

export type FetchPartnerProfileResponse = PartnerProfile;

export type SavePartnerProfilePayload = PartnerProfile;

export type SavePartnerProfileResponse = PartnerProfile;
