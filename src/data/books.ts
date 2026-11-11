/** Suggested reading. Suggestions only: not endorsements, and none of them is personal advice. */
export interface Book {
  id: string;
  title: string;
  author: string;
  shelf: 'Saving and money habits' | 'Investing basics' | 'Investor and trader';
  why: string;
}

export const BOOKS: Book[] = [
  { id: 'psych', title: 'The Psychology of Money', author: 'Morgan Housel', shelf: 'Saving and money habits', why: 'Short stories about why behaviour matters more than maths. A great first read.' },
  { id: 'iwt', title: 'I Will Teach You to Be Rich', author: 'Ramit Sethi', shelf: 'Saving and money habits', why: 'A practical system for automating savings, bills and investing.' },
  { id: 'ymyl', title: 'Your Money or Your Life', author: 'Vicki Robin and Joe Dominguez', shelf: 'Saving and money habits', why: 'Thinks about money as hours of your life. Good for spending less without misery.' },
  { id: 'babylon', title: 'The Richest Man in Babylon', author: 'George S. Clason', shelf: 'Saving and money habits', why: 'Old parables with timeless rules: pay yourself first, avoid bad debt.' },
  { id: 'mnd', title: 'The Millionaire Next Door', author: 'Thomas J. Stanley and William D. Danko', shelf: 'Saving and money habits', why: 'Research on how quiet, steady savers build wealth.' },
  { id: 'simple', title: 'The Simple Path to Wealth', author: 'JL Collins', shelf: 'Investing basics', why: 'Clear, friendly case for low-cost index funds and staying the course.' },
  { id: 'bogle', title: 'The Little Book of Common Sense Investing', author: 'John C. Bogle', shelf: 'Investing basics', why: 'From the founder of the index fund: why costs matter so much.' },
  { id: 'random', title: 'A Random Walk Down Wall Street', author: 'Burton G. Malkiel', shelf: 'Investing basics', why: 'A tour of how markets work and why beating them is hard.' },
  { id: 'smarter', title: 'Smarter Investing', author: 'Tim Hale', shelf: 'Investing basics', why: 'A UK-focused guide to building a sensible, low-cost portfolio.' },
  { id: 'owntheworld', title: 'How to Own the World', author: 'Andrew Craig', shelf: 'Investing basics', why: 'UK-based introduction to ISAs, pensions and owning a slice of global markets.' },
  { id: 'intelligent', title: 'The Intelligent Investor', author: 'Benjamin Graham', shelf: 'Investor and trader', why: 'The classic on value investing and Mr Market. Read a modern annotated edition.' },
  { id: 'lynch', title: 'One Up On Wall Street', author: 'Peter Lynch', shelf: 'Investor and trader', why: 'How to research companies you already understand, with P/E and growth explained.' },
  { id: 'fisher', title: 'Common Stocks and Uncommon Profits', author: 'Philip A. Fisher', shelf: 'Investor and trader', why: 'What makes a great business worth holding for years.' },
  { id: 'nison', title: 'Japanese Candlestick Charting Techniques', author: 'Steve Nison', shelf: 'Investor and trader', why: 'The book that brought candlestick charts to the West.' },
  { id: 'murphy', title: 'Technical Analysis of the Financial Markets', author: 'John J. Murphy', shelf: 'Investor and trader', why: 'A thorough reference on trends, patterns and indicators.' },
  { id: 'zone', title: 'Trading in the Zone', author: 'Mark Douglas', shelf: 'Investor and trader', why: 'Trading psychology: thinking in probabilities and handling losses.' },
];

export const SHELVES = ['Saving and money habits', 'Investing basics', 'Investor and trader'] as const;
