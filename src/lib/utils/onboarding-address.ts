import type { Address, BusinessDetails } from '$lib/types/onboarding';

// The backend keeps the communication address as one string (`kyb.communicationAddress`) but the
// registered address structured (`addressDetails`). The wizard collects both structured, joins the
// communication one on save, and parses it back — best-effort — on load.

export function emptyAddress(): Address {
	return { line1: '', line2: '', city: '', state: '', pincode: '' };
}

export function trimAddress(address: Address): Address {
	return {
		...address,
		line1: address.line1.trim(),
		line2: address.line2.trim(),
		city: address.city.trim(),
		state: address.state.trim(),
		pincode: address.pincode.trim()
	};
}

export function isAddressEmpty(address: Address): boolean {
	return [address.line1, address.line2, address.city, address.state, address.pincode].every(
		(part) => part.trim() === ''
	);
}

/** "line1, line2, city, state - pincode", skipping empty parts. */
export function joinAddress(address: Address): string {
	const parts = [address.line1, address.line2, address.city, address.state]
		.map((part) => part.trim())
		.filter(Boolean);
	const pincode = address.pincode.trim();
	return parts.join(', ') + (pincode ? (parts.length ? ' - ' : '') + pincode : '');
}

/**
 * Best-effort inverse of joinAddress: pincode from a trailing " - 123456", then the last two
 * comma-separated parts are state and city, and everything before them is line 1 (line 2 can't be
 * told apart from line 1, so it stays empty). Old free-text addresses land mostly in line 1.
 */
export function parseAddress(value: string): Address {
	let rest = value.trim();
	let pincode = '';
	const pinMatch = /(?:^|\s*-\s*)(\d{6})$/.exec(rest);
	if (pinMatch) {
		pincode = pinMatch[1];
		rest = rest.slice(0, pinMatch.index).trim();
	}
	const parts = rest
		.split(',')
		.map((part) => part.trim())
		.filter(Boolean);
	const state = parts.length >= 3 ? (parts.pop() ?? '') : '';
	const city = parts.length >= 2 ? (parts.pop() ?? '') : '';
	return { line1: parts.join(', '), line2: '', city, state, pincode };
}

/**
 * The structured communication address and checkbox state for a saved record. Ticked when the
 * saved string is exactly the registered address joined (or nothing is saved yet); otherwise the
 * string is parsed and the checkbox left unticked so the user can check the split.
 */
export function communicationFromSaved(
	saved: string,
	registered: Address
): Pick<BusinessDetails, 'communicationAddress' | 'sameAsCommunication'> {
	if (saved.trim() === '' && isAddressEmpty(registered)) {
		return { communicationAddress: emptyAddress(), sameAsCommunication: true };
	}
	if (saved.trim() === joinAddress(registered)) {
		const { line1, line2, city, state, pincode } = registered;
		return {
			communicationAddress: { line1, line2, city, state, pincode },
			sameAsCommunication: true
		};
	}
	return { communicationAddress: parseAddress(saved), sameAsCommunication: false };
}

/** The registered address in effect: the communication one while "Same as" is ticked. */
export function effectiveRegisteredAddress(
	details: Pick<BusinessDetails, 'address' | 'communicationAddress' | 'sameAsCommunication'>
): Address {
	if (!details.sameAsCommunication) return details.address;
	return { ...details.communicationAddress, country: details.address.country };
}
