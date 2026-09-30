import { describe, expect, it } from 'vitest';
import {
	communicationFromSaved,
	effectiveRegisteredAddress,
	emptyAddress,
	joinAddress,
	parseAddress
} from './onboarding-address';

const address = {
	line1: 'no 234 a.v kovil street',
	line2: '',
	city: 'chennai',
	state: 'tamil nadu',
	pincode: '600090'
};

describe('joinAddress', () => {
	it('joins the non-empty parts with the pincode after a dash', () => {
		expect(joinAddress(address)).toBe('no 234 a.v kovil street, chennai, tamil nadu - 600090');
		expect(joinAddress({ ...address, line2: ' Floor 2 ' })).toBe(
			'no 234 a.v kovil street, Floor 2, chennai, tamil nadu - 600090'
		);
	});

	it('leaves no stray separators', () => {
		expect(joinAddress({ ...address, pincode: '' })).toBe(
			'no 234 a.v kovil street, chennai, tamil nadu'
		);
		expect(joinAddress({ ...emptyAddress(), pincode: '600090' })).toBe('600090');
		expect(joinAddress(emptyAddress())).toBe('');
	});
});

describe('parseAddress', () => {
	it('splits a joined address back into its parts', () => {
		expect(parseAddress('no 234 a.v kovil street, chennai, tamil nadu - 600090')).toEqual(address);
	});

	it('keeps extra leading parts in line 1', () => {
		expect(parseAddress('12, MG Road, Bengaluru, Karnataka - 560001')).toEqual({
			line1: '12, MG Road',
			line2: '',
			city: 'Bengaluru',
			state: 'Karnataka',
			pincode: '560001'
		});
	});

	it('puts an old free-text address into line 1', () => {
		expect(parseAddress('no 234 main street')).toEqual({
			...emptyAddress(),
			line1: 'no 234 main street'
		});
	});
});

describe('communicationFromSaved', () => {
	it('ticks "Same as" when nothing is saved yet', () => {
		expect(communicationFromSaved('', emptyAddress())).toEqual({
			communicationAddress: emptyAddress(),
			sameAsCommunication: true
		});
	});

	it('ticks "Same as" and copies the registered parts when the saved string matches', () => {
		const registered = { ...address, line2: 'Floor 2', country: 'India' };
		expect(communicationFromSaved(joinAddress(registered), registered)).toEqual({
			communicationAddress: { ...address, line2: 'Floor 2' },
			sameAsCommunication: true
		});
	});

	it('parses a different saved string and leaves "Same as" unticked', () => {
		expect(
			communicationFromSaved('no 234 a.v kovil street, chennai, tamil nadu - 600090', {
				...address,
				line1: 'besant nagar'
			})
		).toEqual({ communicationAddress: address, sameAsCommunication: false });
	});
});

describe('effectiveRegisteredAddress', () => {
	const registered = { ...address, line1: 'besant nagar', country: 'India' };

	it('mirrors the communication address while ticked, keeping the registered country', () => {
		expect(
			effectiveRegisteredAddress({
				address: registered,
				communicationAddress: address,
				sameAsCommunication: true
			})
		).toEqual({ ...address, country: 'India' });
	});

	it("uses the user's own registered values while unticked", () => {
		expect(
			effectiveRegisteredAddress({
				address: registered,
				communicationAddress: address,
				sameAsCommunication: false
			})
		).toBe(registered);
	});
});
