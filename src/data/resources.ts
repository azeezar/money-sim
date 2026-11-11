/** Reference material shown in the trading simulator's Resources panel. Education only. */
export interface Resource {
  term: string;
  body: string;
}

export interface ResourceSection {
  id: string;
  title: string;
  items: Resource[];
}

export const RESOURCES: ResourceSection[] = [
  {
    id: 'candles',
    title: 'Candles and charts',
    items: [
      { term: 'Candlestick', body: 'Shows open, high, low and close (OHLC) for one period. Body = open to close. Wicks = high and low. Green closed higher than it opened, red closed lower.' },
      { term: 'Timeframe', body: 'How much time each candle covers: 1m, 5m, 15m, 1H, 4H, 1D, 1W. Short timeframes are noisier. Check a higher timeframe to see the bigger trend.' },
      { term: 'Heikin Ashi', body: 'Averaged candles that smooth noise. Good for spotting trends, but the prices shown are not real traded prices.' },
      { term: 'Line / area chart', body: 'Connects closing prices only. Clean for spotting the overall direction.' },
      { term: 'Volume', body: 'How much traded in each period. Moves on high volume are taken more seriously than moves on thin volume.' },
      { term: 'Doji', body: 'Open and close nearly equal. Buyers and sellers are balanced: indecision.' },
      { term: 'Hammer', body: 'Small body near the top, long lower wick, after a fall. Sellers pushed down but buyers pushed back.' },
      { term: 'Shooting star', body: 'Small body near the bottom, long upper wick, after a rise. Buyers pushed up but sellers took over.' },
      { term: 'Engulfing', body: 'A candle whose body completely covers the previous one in the opposite colour. Bullish engulfing is green over red, bearish is red over green.' },
    ],
  },
  {
    id: 'trend',
    title: 'Trends and patterns',
    items: [
      { term: 'Uptrend / downtrend', body: 'Uptrend: higher highs and higher lows. Downtrend: lower highs and lower lows. Sideways: a range.' },
      { term: 'Support', body: 'A level where falling prices have stopped before because buyers stepped in. Use the H-line tool to mark it.' },
      { term: 'Resistance', body: 'A level where rising prices have stalled before. Once broken, it often becomes support.' },
      { term: 'Breakout', body: 'Price pushes through support or resistance, ideally on rising volume. Many fail, so plan your stop.' },
      { term: 'Double top / bottom', body: 'Price tests the same high (or low) twice and fails. Often read as a possible reversal.' },
      { term: 'Head and shoulders', body: 'Three peaks with the middle highest. A break of the "neckline" is read as a bearish reversal.' },
      { term: 'Flag', body: 'A short, tight pause after a sharp move. Often resolves in the direction of the original move.' },
    ],
  },
  {
    id: 'indicators',
    title: 'Indicators',
    items: [
      { term: 'SMA', body: 'Simple moving average: the average of the last N closes. SMA 20 = short-term, 50 = medium, 200 = long-term trend.' },
      { term: 'EMA', body: 'Exponential moving average: like an SMA but reacts faster because recent prices count more.' },
      { term: 'Golden / death cross', body: 'Golden: a shorter average crosses above a longer one (e.g. 50 over 200). Death: crosses below.' },
      { term: 'Bollinger Bands', body: 'A 20-period average with bands 2 standard deviations above and below. Narrow bands = quiet market, often before a big move.' },
      { term: 'VWAP', body: 'Volume-weighted average price. Big traders compare their fills with it. Price above VWAP = buyers in control.' },
      { term: 'RSI', body: 'Relative Strength Index, 0 to 100. Above 70 often called overbought, below 30 oversold. Strong trends can stay there a long time.' },
      { term: 'MACD', body: 'The gap between the 12 and 26 EMAs (the MACD line), its 9 EMA (signal) and their difference (histogram). Line crossing above signal = momentum turning up.' },
      { term: 'ATR', body: 'Average true range: how far price typically moves per candle. Useful for placing stops outside normal noise.' },
    ],
  },
  {
    id: 'orders',
    title: 'Order types',
    items: [
      { term: 'Market order', body: 'Trade now at the current price. Certain to fill, price not guaranteed in fast markets.' },
      { term: 'Buy limit', body: 'Buy only at your price or lower. Placed below the current price.' },
      { term: 'Sell limit', body: 'Sell only at your price or higher. Placed above the current price. A take profit is a sell limit.' },
      { term: 'Buy stop', body: 'Buy once price rises to your level. Used to join a breakout.' },
      { term: 'Sell stop', body: 'Sell once price falls to your level. A stop loss is a sell stop.' },
      { term: 'OCO', body: 'One cancels the other. Your stop loss and take profit are linked: when one fills, the other is cancelled.' },
      { term: 'Commission', body: `This simulator charges 0.1% of each trade's value, to show how costs add up for frequent traders.` },
    ],
  },
  {
    id: 'risk',
    title: 'Risk management',
    items: [
      { term: 'The 1% rule', body: 'Risk no more than about 1 to 2% of your account on one trade. Ten losses in a row then cost about 10%, not everything.' },
      { term: 'Position sizing', body: 'Units = (account × risk %) ÷ (entry − stop). Use the calculator below.' },
      { term: 'Reward-to-risk', body: 'Potential gain ÷ potential loss. At 2:1 you can be wrong more often than right and still come out ahead.' },
      { term: 'Drawdown', body: 'The fall from a peak in your account. A 50% drawdown needs a 100% gain to recover.' },
      { term: 'Trading journal', body: 'Write down why you entered, where your stop is, and what happened. Your History tab is a start.' },
      { term: 'Revenge trading', body: 'Trading bigger to win back a loss. One of the fastest ways to empty an account.' },
    ],
  },
  {
    id: 'fundamentals',
    title: 'Fundamentals',
    items: [
      { term: 'EPS', body: 'Earnings per share: company profit ÷ number of shares.' },
      { term: 'P/E ratio', body: 'Price ÷ EPS. How many years of current profit you pay for. Compare within the same industry.' },
      { term: 'Earnings yield', body: 'EPS ÷ price: the P/E flipped. A P/E of 20 is an earnings yield of 5%.' },
      { term: 'Market cap', body: 'Share price × shares in issue: what the market values the whole company at.' },
      { term: 'Dividend yield', body: 'Yearly dividend ÷ price. A very high yield can mean the market doubts the dividend.' },
      { term: '52-week range', body: 'Lowest and highest price in the last year. Shows where today sits in that range.' },
      { term: 'OCF', body: 'For funds: the ongoing charges figure, the yearly cost of running the fund.' },
    ],
  },
  {
    id: 'mind',
    title: 'Psychology',
    items: [
      { term: 'FOMO', body: 'Fear of missing out. Chasing a move that already happened usually means buying late.' },
      { term: 'Loss aversion', body: 'Losses hurt about twice as much as gains feel good, so people hold losers too long and sell winners too early.' },
      { term: 'Overtrading', body: 'Trading because you are bored, not because you have a plan. Fees and bad entries pile up.' },
      { term: 'Confirmation bias', body: 'Only noticing information that agrees with your trade. Ask: what would prove me wrong?' },
      { term: 'Reality check', body: 'Most people who day-trade with real money lose money over time. This simulator is for learning how markets behave, safely.' },
    ],
  },
];
