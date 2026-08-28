import { describe, expect, it } from 'vitest';
import { mapPartnerKpis } from './kpis';
import { mapCommissionTrend } from './commission-trend';
import { mapCommissionChart } from './commission-chart';

describe('mapPartnerKpis', () => {
	it('maps swagger KPI fields onto dashboard cards', () => {
		expect(
			mapPartnerKpis({
				totalCommission: { amount: 0, changePercent: -100 },
				totalVolume: { amount: 0, changePercent: -100 },
				successRate: 0,
				activeMerchants: 1
			})
		).toEqual([
			{
				label: 'Total Commission',
				value: '₹0',
				trend: 'down',
				trendLabel: '-100.0%'
			},
			{
				label: 'Total Volume',
				value: '₹0',
				trend: 'down',
				trendLabel: '-100.0%'
			},
			{
				label: 'Success Rate',
				value: '0%',
				subText: 'Captured transactions'
			},
			{
				label: 'Active Merchants',
				value: '1',
				subText: 'Current count'
			}
		]);
	});
});

describe('mapCommissionTrend', () => {
	it('maps swagger trend points onto chart values', () => {
		expect(
			mapCommissionTrend([
				{ date: '2024-08-19T00:00:00+05:30', commissionAmount: 0 },
				{ date: '2024-08-24T00:00:00+05:30', commissionAmount: 42000 }
			])
		).toEqual([
			{ label: '19-08', value: 0 },
			{ label: '24-08', value: 42000 }
		]);
	});
});

describe('mapCommissionChart', () => {
	it('keeps an empty swagger chart empty', () => {
		expect(mapCommissionChart({ transactionTypes: [], totalCommission: 0 })).toEqual([]);
	});

	it('maps transaction types into payment-mix chart items', () => {
		expect(
			mapCommissionChart({
				transactionTypes: [
					{ label: 'PAYIN', value: 700 },
					{ label: 'PAYOUT', value: 300 }
				],
				totalCommission: 1000
			})
		).toEqual([
			{
				label: 'Pay-In',
				amount: 700,
				percentage: 70,
				color: 'var(--chart-1)'
			},
			{
				label: 'Payout',
				amount: 300,
				percentage: 30,
				color: 'var(--chart-2)'
			}
		]);
	});
});
