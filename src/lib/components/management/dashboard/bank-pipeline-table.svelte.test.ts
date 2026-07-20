import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import BankPipelineTable, { type BankPipelineRow } from './bank-pipeline-table.svelte';

const rows: BankPipelineRow[] = [
	{
		pipelineId: 'HDFC Bank',
		processedVolume: 18200000,
		successRate: 98.4,
		cbRatioActual: 0.28,
		cbRatioThreshold: 1.0,
		avgTat: 98.4,
		turnaround: '2.1 hrs',
		status: 'healthy'
	},
	{
		pipelineId: 'Axis Bank',
		processedVolume: 9800000,
		successRate: 94.8,
		cbRatioActual: 0.72,
		cbRatioThreshold: 1.0,
		avgTat: 91.2,
		turnaround: '3.4 hrs',
		status: 'delayed'
	},
	{
		pipelineId: 'State Bank of India',
		processedVolume: 11400000,
		successRate: 92.3,
		cbRatioActual: 0.95,
		cbRatioThreshold: 1.0,
		avgTat: 84.6,
		turnaround: '4.8 hrs',
		status: 'degraded'
	}
];

describe('BankPipelineTable', () => {
	it('renders the title and partner bank count', async () => {
		const screen = render(BankPipelineTable, { title: 'Bank pipeline breakdown', rows });

		await expect.element(screen.getByText('Bank pipeline breakdown')).toBeVisible();
		await expect.element(screen.getByText('3 partner banks')).toBeVisible();
	});

	it('renders a row per pipeline with its turnaround and success rate', async () => {
		const screen = render(BankPipelineTable, { title: 'Pipelines', rows });

		for (const row of rows) {
			await expect.element(screen.getByText(row.pipelineId)).toBeVisible();
			await expect.element(screen.getByText(row.turnaround)).toBeVisible();
			await expect
				.element(screen.getByText(`${row.successRate.toFixed(1)}%`).first())
				.toBeVisible();
		}
	});

	it('maps status to the correct badge label', async () => {
		const screen = render(BankPipelineTable, { title: 'Pipelines', rows });

		await expect.element(screen.getByText('Healthy')).toBeVisible();
		await expect.element(screen.getByText('Delayed')).toBeVisible();
		await expect.element(screen.getByText('Degraded')).toBeVisible();
	});

	it('formats processed volume using the provided formatter', async () => {
		const screen = render(BankPipelineTable, {
			title: 'Pipelines',
			rows,
			formatValue: (v: number) => `₹${v.toLocaleString('en-IN')}`
		});

		await expect.element(screen.getByText('₹1,82,00,000')).toBeVisible();
	});
});
