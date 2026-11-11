/**
 * Easter egg: Vermany plc (VRMNY). Everything about it is set by hand here, not by the random model.
 *
 *  - prices: the chart passes exactly through each point. Between points it wiggles a little;
 *    after the last point it carries on randomly from there. Add a point to move the price.
 *  - news:   your own headlines, shown in the Trade tab's News feed on that date (from 07:00 UK).
 *
 * Dates are YYYY-MM-DD. Save the file and the dev server updates the app straight away.
 */
export const VERMANY = {
  sym: 'VRMNY',
  name: 'Vermany plc',
  sector: 'Conglomerate',
  desc: 'A mysterious conglomerate with interests in everything. Its share price seems to follow a will of its own.',
  /** How much it wiggles between your price points (yearly volatility). */
  vol: 0.25,
  prices: [
    { date: '2026-01-02', price: 100 },
    { date: '2026-06-01', price: 13 },
    { date: '2026-11-14', price: 100 },
    { date: '2026-12-14', price: 300 }
  ],
  news: [
    { date: '2026-11-11', headline: 'Vermany plc lists on the Money Sim exchange', body: 'Nobody is quite sure what Vermany does, but the shares are now available to trade.' },
  ] as { date: string; headline: string; body?: string }[],
};
