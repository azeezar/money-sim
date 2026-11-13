import { card, cur, match, mc, tf, unit, type Lesson } from './kit';

/**
 * The four-tier curriculum: 16 units, 32 lessons. Each lesson names an interactive mechanic
 * (played inside the lesson) and an arcade game (in the Games tab).
 * Draft content for a prototype; have it reviewed before real users see it. Education, not advice.
 */

/* ============================================================ Tier 1: Novice — Financial Foundations */
export const NOVICE: Lesson[] = [
  ...unit('Unit 1: Money In vs. Money Out', [
    cur('1.1', 'Net Income & Cash Leaks', 7, ['swipe-sorter', 'Swipe-Sorter', 'Sort a live bank feed into Needs, Wants and Stealth Leaks.'], ['leak-dodger', 'Leak Dodger', 'Dodge subscription fireballs while you grab your pay.'], [
      card('Gross vs. net income', 'Gross income is your pay before anything comes off. Net income is what actually lands in your account after Income Tax, National Insurance and pension contributions. Budget with net income, because that is the money you can spend.'),
      card('Cash leaks', 'A cash leak is a small, regular cost you barely notice: a forgotten subscription, daily coffees, delivery fees. £8 a month feels like nothing, but it is £96 a year, and five of them is close to £500.'),
      match([['Gross income', 'Pay before deductions'], ['Net income', 'Take-home pay after deductions'], ['Stealth leak', 'A small regular cost you forget about'], ['Need', 'Something you must pay to live and work']]),
      mc('Your payslip shows £2,400 gross and £1,900 net. Which number should your budget use?', ['£1,900', '£2,400', '£2,150', '£4,300'], 'Only net income reaches your account, so that is what you can actually spend.'),
      mc('Which of these is most likely a stealth leak?', ['A £7.99 app subscription you last opened in March', 'Your rent', 'Your weekly food shop', 'Your bus pass to work'], 'Leaks are small, regular and forgotten. The others are needs you use.'),
      mc('Five £9-a-month subscriptions cost how much a year?', ['£540', '£45', '£108', '£900'], '5 × £9 = £45 a month, × 12 = £540 a year.'),
      tf('Small costs do not matter because they are small.', false, 'Small regular costs add up fast. A year of them is often a surprise.'),
    ]),
    cur('1.2', 'The 50/30/20 Rule', 8, ['pie-slider', 'Pie Slider', 'Drag the budget sliders to rescue a breaking monthly budget.'], ['budget-balancer', 'Budget Balancer', 'Steer falling coins into the 50/30/20 buckets.'], [
      card('A simple split', 'The 50/30/20 rule splits net income three ways: about 50% for needs (rent, bills, food, travel), 30% for wants (eating out, hobbies, streaming) and 20% for saving or paying off debt. It is a starting point, not a law.'),
      card('When it breaks', 'If needs take 70% because rent is high, something else must shrink. Cut wants first, then look for cheaper needs. Saving even 10% is far better than nothing, and you can raise it later.'),
      match([['50%', 'Needs: rent, bills, food'], ['30%', 'Wants: fun and treats'], ['20%', 'Saving and paying debt'], ['Budget', 'A plan for where your money goes']]),
      mc('Net income is £2,000. How much goes to saving under 50/30/20?', ['£400', '£200', '£600', '£1,000'], '20% of £2,000 is £400.'),
      mc('Which belongs in the 30% wants bucket?', ['Concert tickets', 'Electricity bill', 'Rent', 'Minimum loan repayment'], 'You could live without concert tickets. The others are needs or debt.'),
      mc('Your needs come to 65%. What is the most sensible first fix?', ['Trim wants so saving still gets something', 'Stop saving entirely', 'Borrow to cover wants', 'Ignore it'], 'Wants are the most flexible part of a budget.'),
      tf('Paying off a credit card counts towards the 20% bucket.', true, 'Paying down debt and saving both improve your position, so they share the 20%.'),
    ]),
  ]),
  ...unit('Unit 2: Saving & Emergency Buffers', [
    cur('2.1', 'High-Yield Savings & APY', 7, ['time-lapse', 'Time-Lapse Calculator', 'Compare £1,000 at 0.01% with 4.5% over 10 years.'], ['yield-stack', 'Yield Stack', 'Stack high-APY blocks to build a compounding tower.'], [
      card('What APY means', 'APY (annual percentage yield) is what your savings earn in a year once interest on interest is included. In the UK it is shown as AER, the annual equivalent rate. A higher APY means your money grows faster.'),
      card('Why the rate matters', 'Big high-street accounts can pay almost nothing, while high-yield (often app-based or online) accounts pay much more for the same safety. In the UK, deposits are protected up to £85,000 per person per bank by the FSCS.'),
      match([['APY / AER', 'Yearly growth including interest on interest'], ['High-yield account', 'Savings that pays a strong rate'], ['FSCS', 'UK protection for deposits up to £85,000'], ['Compounding', 'Earning interest on your interest']]),
      mc('£1,000 sits for a year at 4.5% APY. Roughly what do you have?', ['£1,045', '£1,004.50', '£1,450', '£1,000.10'], '4.5% of £1,000 is £45.'),
      mc('Two accounts are equally safe. One pays 0.01%, the other 4.5%. Which is better for savings?', ['The 4.5% account', 'The 0.01% account', 'They are the same', 'Neither, keep it as cash at home'], 'Same safety, far more growth.'),
      mc('Which tells you the true yearly growth of a savings account?', ['APY (AER)', 'The bank’s logo', 'The minimum deposit', 'The app rating'], 'APY/AER folds in compounding, so you can compare accounts fairly.'),
      tf('UK bank deposits are protected up to £85,000 per person per bank.', true, 'That is the FSCS limit, so spreading very large sums across banks keeps them protected.'),
    ]),
    cur('2.2', 'Building the Emergency Shield', 8, ['expense-stripper', 'Expense Stripper', 'Strip out non-essentials to reveal your true 3-month survival number.'], ['shield-defense', 'Shield Defense', 'Tap away surprise-expense asteroids before they hit your savings.'], [
      card('What an emergency fund is', 'An emergency fund is cash set aside for surprises: a broken boiler, a vet bill, losing your job. Aim for 3 to 6 months of essential spending, kept somewhere safe and easy to reach, not invested.'),
      card('Your survival number', 'Work it out from essentials only: rent, bills, food, travel, minimum debt payments. Strip out wants, because in an emergency you would cut them. Multiply that monthly figure by 3 for a starter shield.'),
      match([['Emergency fund', 'Cash for surprises'], ['Essential spending', 'Costs you cannot cut'], ['3–6 months', 'Usual size of an emergency fund'], ['Easy access', 'Money you can withdraw quickly']]),
      mc('Essentials are £1,100 a month. What is a 3-month emergency fund?', ['£3,300', '£1,100', '£6,600', '£2,200'], '£1,100 × 3 = £3,300.'),
      mc('Where should an emergency fund usually live?', ['An easy-access savings account', 'Shares in one company', 'Crypto', 'A 5-year fixed bond'], 'It must be stable and quick to reach.'),
      mc('Which cost would you strip out when working out your survival number?', ['A streaming subscription', 'Rent', 'Energy bills', 'Food'], 'Wants go first in an emergency.'),
      tf('You should invest your emergency fund in shares to make it grow faster.', false, 'Emergencies do not wait for markets to recover. Keep it stable.'),
    ]),
  ]),
  ...unit('Unit 3: Debt Management Tactics', [
    cur('3.1', 'Good Debt vs. Bad Debt & APR', 7, ['apr-scale', 'APR Severity Scale', 'Sort debts onto an APR scale, then see how long each takes to pay off.'], ['interest-crusher', 'Interest Crusher', 'Whack the high-APR debts first.'], [
      card('APR', 'APR (annual percentage rate) is the yearly cost of borrowing, including interest and most fees. The higher the APR, the faster the debt grows. Credit cards are often 20–30%; payday loans can be several hundred percent.'),
      card('Good vs. bad debt', '“Good” debt usually has a low rate and buys something that can grow in value or raise your income, like a mortgage or a student loan. “Bad” debt is high-rate borrowing for things that lose value, like a credit card balance for a holiday.'),
      match([['APR', 'Yearly cost of borrowing'], ['Mortgage', 'Low-rate loan secured on a home'], ['Payday loan', 'Very high-APR short-term loan'], ['Credit card debt', 'High-rate balance carried month to month']]),
      mc('Which debt usually has the highest APR?', ['A payday loan', 'A mortgage', 'A UK student loan', 'A car loan'], 'Payday loans can charge hundreds of percent a year.'),
      mc('Which is usually called “good” debt?', ['A low-rate mortgage on a home you live in', 'A credit card balance for a holiday', 'A payday loan for a phone', 'A buy-now-pay-later on clothes you missed paying'], 'Low rate, and it buys an asset that may hold its value.'),
      mc('£1,000 at 25% APR versus 5% APR, both unpaid for a year. Roughly how much more does the 25% one cost?', ['About £200 more', 'About £20 more', 'The same', 'About £2,000 more'], '25% is £250 of interest, 5% is £50: a £200 gap.'),
      tf('Two loans with the same monthly payment always cost the same overall.', false, 'APR and length change the total a lot. Always compare total cost.'),
    ]),
    cur('3.2', 'Avalanche vs. Snowball Method', 8, ['dual-race', 'Dual-Race Simulator', 'Race the Snowball and Avalanche methods side by side.'], ['debt-runner', 'Debt Runner', 'Switch lanes for Snowball and Avalanche power-ups.'], [
      card('Two ways to clear debt', 'Pay the minimum on everything, then put every spare pound on one debt. The Avalanche method targets the highest APR first. The Snowball method targets the smallest balance first.'),
      card('Maths vs. motivation', 'Avalanche always pays the least interest. Snowball clears whole debts sooner, and those quick wins keep many people going. The best method is the one you will actually stick to.'),
      match([['Avalanche', 'Highest APR first'], ['Snowball', 'Smallest balance first'], ['Minimum payment', 'The least you must pay each month'], ['Quick win', 'A whole debt cleared early']]),
      mc('Debts: £300 at 10%, £2,000 at 29%, £900 at 18%. Which does Avalanche pay first?', ['£2,000 at 29%', '£300 at 10%', '£900 at 18%', 'All equally'], 'Avalanche goes for the highest rate.'),
      mc('Same debts. Which does Snowball pay first?', ['£300 at 10%', '£2,000 at 29%', '£900 at 18%', 'The newest one'], 'Snowball goes for the smallest balance.'),
      mc('Which method pays the least total interest?', ['Avalanche', 'Snowball', 'They always tie', 'Paying minimums only'], 'Hitting the highest rate first cuts the most interest.'),
      tf('With both methods you keep paying the minimum on every other debt.', true, 'Missing minimums brings fees and harms your credit score.'),
    ]),
  ]),
  ...unit('Unit 4: Intro to Wealth Building', [
    cur('4.1', 'Inflation Drag & Purchasing Power', 7, ['power-shrink', 'Purchasing Power Shrink', 'Turn the inflation knob and watch £100 buy less and less.'], ['inflation-escape', 'Inflation Escape', 'Jump up the inflation staircase before prices catch you.'], [
      card('Inflation', 'Inflation is the general rise in prices over time. The Bank of England aims for 2% a year. At 3% inflation, something that costs £100 today costs about £134 in ten years.'),
      card('Purchasing power', 'Purchasing power is how much your money can buy. Cash that earns less than inflation loses purchasing power every year, even though the number in your account stays the same. That is inflation drag.'),
      match([['Inflation', 'Prices rising over time'], ['Purchasing power', 'What your money can buy'], ['Inflation drag', 'Cash losing value after inflation'], ['Real return', 'Growth after inflation']]),
      mc('Your savings earn 1%. Inflation is 4%. What is your real return?', ['About −3%', 'About +5%', 'About +1%', 'About +4%'], 'Real return ≈ interest minus inflation: 1% − 4% = −3%.'),
      mc('What does the Bank of England target for inflation?', ['2% a year', '0% a year', '10% a year', 'Whatever the government wants that week'], 'The target is 2%, measured by CPI.'),
      mc('Prices rise 3% a year. Roughly what does £100 buy after 10 years, in today’s money?', ['About £74', 'About £97', 'About £100', 'About £130'], '£100 ÷ 1.03¹⁰ ≈ £74.'),
      tf('If the number in your account does not go down, you cannot lose money.', false, 'Inflation can shrink what that number buys.'),
    ]),
    cur('4.2', 'First Steps to Investing', 8, ['asset-drag', 'Asset Drag', 'Place cash, property and shares on a risk-vs-reward grid.'], ['capital-catcher', 'Capital Catcher', 'Catch productive assets and dodge cash-decay traps.'], [
      card('Risk and reward', 'Investments that can grow more usually swing more. Cash is steady but grows slowly. Bonds sit in the middle. Shares can grow most over long periods but can fall sharply along the way.'),
      card('Before you invest', 'Have an emergency fund, clear high-rate debt, and only invest money you will not need for five years or more. A low-cost, diversified fund is a common first step.'),
      match([['Cash', 'Low risk, low growth'], ['Bonds', 'Middle risk, steady income'], ['Shares', 'Higher risk, higher long-run growth'], ['Diversify', 'Spread money across many investments']]),
      mc('Which usually has the highest risk and highest long-run reward?', ['Shares', 'Cash', 'Premium Bonds', 'A current account'], 'Share prices swing more, but have grown most over long periods.'),
      mc('What should come before investing?', ['An emergency fund and clearing high-rate debt', 'Buying the most popular share', 'Taking out a loan', 'Checking prices daily'], 'A cushion stops a surprise forcing you to sell at a bad time.'),
      mc('How long should invested money usually be left?', ['Five years or more', 'One week', 'One month', 'Until the first dip'], 'Time helps ride out falls.'),
      tf('A diversified fund spreads your money across many companies.', true, 'That way one company’s bad news hurts less.'),
    ]),
  ]),
];

/* ============================================================ Tier 2: Intermediate — Core Investor */
export const INTERMEDIATE: Lesson[] = [
  ...unit('Unit 5: Asset Class Fundamentals', [
    cur('5.1', 'Fractional Equity & Stocks', 8, ['corporate-tap', 'Corporate Tap', 'Tap a balance sheet to claim fractional ownership of a company.'], ['share-slicers', 'Share Slicers', 'Slice falling stock certificates into fractional shares.'], [
      card('What a share is', 'A share (or stock) is a tiny slice of ownership in a company. Shareholders may get dividends from profits, and the share price moves with how investors view the company’s future.'),
      card('Fractional shares', 'Some platforms let you buy part of a share, so £10 can buy 0.05 of a £200 share. You get the same proportion of any gain, loss or dividend. This makes it easier to spread small amounts widely.'),
      match([['Share', 'A slice of company ownership'], ['Fractional share', 'Part of one share'], ['Dividend', 'Profit paid to shareholders'], ['Market cap', 'Share price × number of shares']]),
      mc('A share costs £200. You invest £50. How much of a share do you own?', ['0.25', '0.5', '4', '2.5'], '£50 ÷ £200 = 0.25 of a share.'),
      mc('A company has 1 million shares at £30. What is its market cap?', ['£30 million', '£30,000', '£1 million', '£300 million'], '1,000,000 × £30 = £30,000,000.'),
      mc('You own 0.5 of a share. The company pays a £2 dividend per share. What do you get?', ['£1', '£2', '£4', 'Nothing'], 'Fractional owners get their proportion: 0.5 × £2.'),
      tf('Owning a share makes you a part-owner of the company.', true, 'That is what equity means.'),
    ]),
    cur('5.2', 'Fixed Income & Bond Mechanics', 8, ['bond-seesaw', 'Bond Seesaw', 'Pivot interest rates and watch bond prices move the other way.'], ['yield-seesaw', 'Yield Seesaw', 'Keep the beam level as rates and bond prices shift.'], [
      card('How a bond works', 'A bond is a loan to a government or company. It pays a fixed interest (the coupon) and returns the face value at maturity. UK government bonds are called gilts.'),
      card('The seesaw', 'Bond prices move opposite to interest rates. If new bonds pay 5%, an old bond paying 3% is less attractive, so its price falls until its yield matches. When rates fall, existing bonds rise in price.'),
      match([['Coupon', 'The bond’s fixed interest payment'], ['Maturity', 'When the loan is repaid'], ['Gilt', 'A UK government bond'], ['Yield', 'The return based on today’s price']]),
      mc('Interest rates rise. What usually happens to existing bond prices?', ['They fall', 'They rise', 'They stay fixed', 'They double'], 'Older, lower coupons look worse next to new ones, so their price drops.'),
      mc('A £1,000 bond pays a 4% coupon. What is the yearly interest?', ['£40', '£4', '£400', '£104'], '4% of £1,000.'),
      mc('Which bonds carry the most risk of not being repaid?', ['High-yield bonds from shaky companies', 'UK gilts', 'Bonds from very large stable governments', 'Savings bonds backed by the government'], 'Higher yields usually pay you for higher default risk.'),
      tf('Long-dated bonds swing more when rates change than short-dated ones.', true, 'More years of fixed payments means more sensitivity to rates.'),
    ]),
  ]),
  ...unit('Unit 6: Fund Investing & Fees', [
    cur('6.1', 'Index Funds & ETFs', 8, ['etf-basket', 'ETF Basket Builder', 'Drag the biggest companies into an index bucket.'], ['basket-builder', 'Basket Builder', 'Collect diversified stocks and dodge single-stock volatility bombs.'], [
      card('Index funds', 'An index fund buys every company in a market index, such as the FTSE 100 or S&P 500, so you own a little of all of them. It follows the market rather than trying to beat it, which keeps costs low.'),
      card('ETFs', 'An exchange-traded fund (ETF) is a fund that trades on a stock exchange like a share. Many ETFs track an index. One purchase can spread your money across hundreds of companies.'),
      match([['Index', 'A list that measures a market'], ['Index fund', 'Buys everything in an index'], ['ETF', 'A fund traded like a share'], ['Passive investing', 'Following the market, not picking stocks']]),
      mc('What does a FTSE 100 tracker hold?', ['The 100 largest companies on the London Stock Exchange', '100 random shares', 'Only UK banks', 'Government bonds'], 'It follows the FTSE 100 index.'),
      mc('Why do index funds usually have low fees?', ['No team is paid to pick stocks', 'They are run by the government', 'They never trade', 'They are not regulated'], 'Following an index is cheap to run.'),
      mc('One company in a 500-company index halves. What is the rough effect?', ['A small dip in the fund', 'The fund halves', 'The fund closes', 'Nothing at all ever'], 'Each company is a small slice, so one fall barely moves the whole.'),
      tf('An ETF can be bought and sold during the trading day like a share.', true, 'That is the “exchange-traded” part.'),
    ]),
    cur('6.2', 'Expense Ratio Drag', 8, ['fee-decay', 'Fee Decay Graph', 'Drag the expense ratio from 0.03% to 1.5% and see 30 years of fees.'], ['fee-eater', 'Fee Eater', 'Steer through a maze while dodging high-fee ghosts.'], [
      card('Expense ratio', 'The expense ratio, called the ongoing charges figure (OCF) in the UK, is the yearly fee a fund takes as a percentage of your money. It comes out quietly whether the fund rises or falls.'),
      card('Why small fees matter', 'Fees compound against you. Over 30 years, a 1.5% fee can eat roughly a third of the pot that a 0.1% fee would have left you. Platform fees stack on top, so check both.'),
      match([['Expense ratio / OCF', 'Yearly fund fee as a %'], ['Platform fee', 'What the app charges to hold your funds'], ['Fee drag', 'Fees shrinking long-run growth'], ['Active fund', 'Managers pick stocks, usually for higher fees']]),
      mc('£10,000 in a fund with a 0.75% OCF. Roughly what is the yearly fee?', ['£75', '£7.50', '£750', '£0.75'], '0.75% of £10,000 is £75.'),
      mc('Two funds track the same index. One charges 0.1%, the other 1%. Which should you expect to return more?', ['The 0.1% fund', 'The 1% fund', 'They are the same', 'Whichever has the nicer website'], 'Same holdings, so the cheaper one keeps more of the return.'),
      mc('Where in the UK do you find a fund’s yearly charge?', ['The ongoing charges figure (OCF)', 'The risk rating', 'Last year’s return', 'The fund’s logo'], 'The OCF is shown on every UK fund factsheet.'),
      tf('A 1% difference in fees barely matters over 30 years.', false, 'It compounds. Over decades it can cost tens of thousands of pounds.'),
    ]),
  ]),
  ...unit('Unit 7: Portfolio Architecture & Accounts', [
    cur('7.1', 'Asset Allocation & Risk Profiles', 8, ['risk-mixer', 'Risk Profile Mixer', 'Set your age and nerves to get a matching shares/bonds mix.'], ['mix-master', 'Portfolio Mix Master', 'Match target asset ratios while the market wobbles.'], [
      card('Asset allocation', 'Asset allocation is how you split money between shares, bonds and cash. It drives most of a portfolio’s ups and downs, more than which individual funds you pick.'),
      card('Your risk profile', 'Your mix should fit your time horizon and how you handle falls. A rough old rule is “hold your age in bonds”, so a 30-year-old might hold 70% shares and 30% bonds. Longer timelines can usually take more shares.'),
      match([['Asset allocation', 'Your split between asset types'], ['Risk profile', 'How much ups and downs you can handle'], ['Time horizon', 'How long until you need the money'], ['60/40', 'A classic mix: 60% shares, 40% bonds']]),
      mc('Who can usually take the most shares in their mix?', ['A 25-year-old saving for retirement', 'Someone needing the money next year', 'A retiree living off the pot', 'Someone saving for a deposit in 6 months'], 'A long horizon gives time to recover from falls.'),
      mc('Under “age in bonds”, what might a 40-year-old hold?', ['60% shares, 40% bonds', '40% shares, 60% bonds', '100% shares', '100% bonds'], '40 in bonds, the rest in shares.'),
      mc('What drives most of a portfolio’s ups and downs?', ['Its asset allocation', 'The day you bought', 'The fund’s name', 'The colour of the app'], 'The split between shares, bonds and cash matters most.'),
      tf('Your asset allocation should usually get more cautious as you near your goal.', true, 'Less time to recover means less room for big falls.'),
    ]),
    cur('7.2', 'Tax-Advantaged Accounts', 8, ['tax-router', 'Tax Router', 'Route income into ISA, pension and taxable accounts.'], ['tax-maze', 'Tax Shield Maze', 'Steer income streams into tax-free buckets before tax day.'], [
      card('UK tax wrappers', 'An ISA lets you save or invest up to £20,000 a year with no tax on interest, dividends or gains. A pension (workplace or SIPP) gets tax relief on the way in, so £80 from you becomes £100 for a basic-rate taxpayer, but it is locked until 57.'),
      card('Other countries', 'The US has similar ideas: a 401(k) is like a workplace pension with pre-tax money; a Roth IRA is like an ISA: taxed going in, tax-free coming out. Whatever the country, filling tax-free space first keeps more of your growth.'),
      match([['ISA', '£20,000 a year, tax-free growth'], ['Pension / SIPP', 'Tax relief in, locked until later life'], ['401(k)', 'US workplace pension'], ['Roth IRA', 'US account taxed in, tax-free out']]),
      mc('What is the yearly ISA allowance?', ['£20,000', '£2,000', '£100,000', 'No limit'], 'You can put in up to £20,000 a year across your ISAs.'),
      mc('A basic-rate taxpayer pays £80 into a pension. With tax relief, how much goes in?', ['£100', '£80', '£96', '£120'], 'The government adds 20% relief on the gross amount.'),
      mc('Which is the closest UK match to a Roth IRA?', ['A Stocks and Shares ISA', 'A current account', 'A credit card', 'A mortgage'], 'Both are funded from taxed money and grow tax-free.'),
      tf('Money in a pension can usually be taken out at any age.', false, 'UK pensions are locked until at least 55, rising to 57 in 2028.'),
    ]),
  ]),
  ...unit('Unit 8: Credit & Discipline', [
    cur('8.1', 'Credit Cards & Card Debt', 8, ['card-payoff', 'Minimum Payment Trap', 'Set your monthly repayment and watch how long a £1,500 card balance takes to clear.'], ['card-sense', 'Card Sense', 'Catch smart card habits and dodge the debt traps.'], [
      card('How a credit card works', 'A credit card lets you borrow up to a set limit and pay later. Each month you get a statement. Pay the full balance by the due date and you usually pay no interest on purchases: that gap, often up to 56 days, is the interest-free period.'),
      card('The minimum payment trap', 'Pay only part of the balance and interest, often 20–30% APR, is added to the rest. £1,500 at 24.9% APR, paid off at £40 a month, takes about 6 years and costs about £1,430 in interest: almost double what you borrowed. At £140 a month it is gone in about a year for around £210.'),
      card('Using a card well', 'Set a direct debit to pay the full balance. Keep your spending well under your limit, never take cash out on a credit card (fees and interest start straight away), and always pay on time to build your credit score. In the UK, Section 75 makes the card company jointly responsible for purchases from £100 to £30,000.'),
      match([['Credit limit', 'The most you can borrow on the card'], ['Minimum payment', 'The smallest amount you must pay each month'], ['Interest-free period', 'Time to repay purchases before interest is added'], ['Credit utilisation', 'How much of your limit you are using']]),
      mc('Which habit means you pay no interest on card purchases?', ['Paying the full balance every month', 'Paying the minimum on time', 'Paying half the balance', 'Paying whenever you remember'], 'Clearing the full statement balance by the due date keeps purchases interest-free.'),
      mc('You owe £1,500 at 24.9% APR and pay £40 a month. Roughly how long until it is cleared?', ['About 6 years', 'About 1 year', 'About 3 years', 'About 10 months'], 'Most of each £40 goes on interest at first, so it takes about 74 months.'),
      mc('Why avoid taking cash out on a credit card?', ['Fees and interest usually start straight away', 'It is always free', 'It boosts your credit score', 'It earns you cashback'], 'Cash withdrawals skip the interest-free period and often carry a fee too.'),
      tf('Using a small part of your limit and paying on time can help your credit score.', true, 'Lenders like to see borrowing kept low and repaid reliably.'),
      tf('With £3,000 on a card at 25% APR and £5,000 in savings at 4%, keeping both is usually cheapest.', false, 'The card costs far more than the savings earn. Clearing it, while keeping some emergency cash, usually saves money.'),
    ]),
    cur('8.2', 'Portfolio Rebalancing', 8, ['drift-corrector', 'Drift Corrector', 'Bring a drifted 85/15 portfolio back to its 70/30 target.'], ['target-rebalancer', 'Target Rebalancer', 'Keep your mix on target through wild market spikes.'], [
      card('Drift', 'Over time, the parts of your portfolio grow at different speeds. A 70/30 shares/bonds mix can drift to 85/15 after a strong run in shares, which means you are now taking more risk than you planned.'),
      card('Rebalancing', 'Rebalancing means selling some of what has grown and buying what has lagged to get back to your target. Many people do it once a year or when a part drifts more than 5%. It is a built-in “sell high, buy low”.'),
      match([['Drift', 'Your mix moving away from target'], ['Rebalance', 'Trade back to your target mix'], ['Target allocation', 'The mix you planned'], ['Threshold', 'How far drift goes before you act']]),
      mc('Your target is 70/30. You are at 85/15. What does rebalancing do?', ['Sell some shares, buy bonds', 'Buy more shares', 'Sell all bonds', 'Nothing'], 'Shares are overweight, so trim them and top up bonds.'),
      mc('A £10,000 portfolio is 85% shares. How much should be in shares at a 70% target?', ['£7,000', '£8,500', '£1,500', '£3,000'], '70% of £10,000.'),
      mc('Why rebalance at all?', ['To keep your risk where you planned it', 'To guarantee higher returns', 'To avoid all fees', 'To time the market'], 'It is about controlling risk.'),
      tf('Rebalancing often means selling what has done best recently.', true, 'That is why it feels hard, and why it works as a discipline.'),
    ]),
  ]),
];

/* ============================================================ Tier 3: Advanced — Market Analyst */
export const ADVANCED: Lesson[] = [
  ...unit('Unit 9: Financial Statement Analysis', [
    cur('9.1', 'Income Statement & Profitability', 9, ['line-item', 'Line-Item Inspector', 'Work out gross and net margin on a live earnings report.'], ['margin-hero', 'Margin Hero', 'Tap the right profit lines as statements scroll past.'], [
      card('The income statement', 'The income statement shows a company’s performance over a period. It starts with revenue (sales), takes off cost of goods sold to get gross profit, then operating costs, interest and tax to get net profit (the bottom line).'),
      card('Margins', 'Gross margin = gross profit ÷ revenue. Net margin = net profit ÷ revenue. Margins let you compare companies of different sizes. Rising margins usually mean a business is getting more efficient or has pricing power.'),
      match([['Revenue', 'Total sales'], ['Gross profit', 'Revenue minus cost of goods sold'], ['Net profit', 'What is left after every cost and tax'], ['Net margin', 'Net profit ÷ revenue']]),
      mc('Revenue £500m, cost of goods £300m. What is gross margin?', ['40%', '60%', '30%', '200%'], 'Gross profit £200m ÷ £500m = 40%.'),
      mc('Revenue £500m, net profit £50m. What is net margin?', ['10%', '50%', '5%', '1%'], '£50m ÷ £500m = 10%.'),
      mc('Which line is called “the bottom line”?', ['Net profit', 'Revenue', 'Gross profit', 'Cost of goods sold'], 'It sits at the bottom of the statement.'),
      tf('A company with rising revenue is always becoming more profitable.', false, 'Costs can rise faster than sales. Check the margins.'),
    ]),
    cur('9.2', 'Balance Sheets & Free Cash Flow', 9, ['fcf-waterfall', 'FCF Waterfall', 'Trace cash from operations through CapEx to true free cash flow.'], ['cashflow-plumber', 'Cash Flow Plumber', 'Connect pipes to route cash into the free cash flow tank.'], [
      card('The balance sheet', 'The balance sheet is a snapshot of what a company owns (assets) and owes (liabilities) on one day. Assets minus liabilities is shareholders’ equity. Lots of debt against few assets is a warning sign.'),
      card('Free cash flow', 'Profit can be flattered by accounting. Cash is harder to fake. Operating cash flow minus capital expenditure (CapEx, spending on equipment and buildings) is free cash flow: the cash a company could return to shareholders or use to grow.'),
      match([['Assets', 'What a company owns'], ['Liabilities', 'What a company owes'], ['Equity', 'Assets minus liabilities'], ['Free cash flow', 'Operating cash flow minus CapEx']]),
      mc('Assets £800m, liabilities £500m. What is equity?', ['£300m', '£1,300m', '£500m', '£800m'], '£800m − £500m.'),
      mc('Operating cash flow £120m, CapEx £45m. What is free cash flow?', ['£75m', '£165m', '£45m', '£120m'], '£120m − £45m.'),
      mc('Why do analysts watch free cash flow?', ['Cash is harder to dress up than profit', 'It is always bigger than profit', 'It ignores spending', 'It sets the share price by law'], 'It shows real money coming in after reinvestment.'),
      tf('A profitable company can still run out of cash.', true, 'If customers pay late or spending is heavy, profit does not equal cash.'),
    ]),
  ]),
  ...unit('Unit 10: Valuation Metrics', [
    cur('10.1', 'Relative Valuation Multiples', 9, ['peer-multiples', 'Peer Multiples Benchmarking', 'Spot the undervalued stock using P/E and PEG.'], ['valuation-matchmaker', 'Valuation Matchmaker', 'Match market caps with earnings multiples against the clock.'], [
      card('P/E ratio', 'The price-to-earnings (P/E) ratio is share price ÷ earnings per share. It says how many pounds investors pay for £1 of yearly profit. A lower P/E than similar companies can mean cheap, or it can mean trouble.'),
      card('PEG ratio', 'The PEG ratio is P/E ÷ expected earnings growth (%). It adjusts for growth: a P/E of 30 with 30% growth gives a PEG of 1. Around 1 is often seen as fair; under 1 may be good value for the growth.'),
      match([['P/E', 'Price ÷ earnings per share'], ['PEG', 'P/E ÷ earnings growth'], ['EPS', 'Profit per share'], ['Peers', 'Similar companies to compare against']]),
      mc('Share price £60, earnings per share £3. What is the P/E?', ['20', '180', '3', '63'], '£60 ÷ £3 = 20.'),
      mc('P/E of 24 and expected growth of 12%. What is the PEG?', ['2', '0.5', '12', '288'], '24 ÷ 12 = 2.'),
      mc('Why compare P/E with peers rather than across all stocks?', ['Different industries normally trade at different multiples', 'All P/Es are the same', 'Peers set the price', 'It is the law'], 'Fast-growing tech and steady utilities naturally differ.'),
      tf('A low P/E always means a stock is a bargain.', false, 'It might reflect falling profits or real risks.'),
    ]),
    cur('10.2', 'Intrinsic Value & DCF Basics', 9, ['discount-slider', 'Discount Rate Slider', 'Tweak growth and discount rates to recalculate present value.'], ['discount-machine', 'Discount Machine', 'Catch future cash flows and pass them through discount tunnels.'], [
      card('Money now beats money later', '£100 next year is worth less than £100 today, because today’s £100 could be invested. Discounting turns future cash into today’s value: £110 next year at a 10% discount rate is worth £100 now.'),
      card('Discounted cash flow (DCF)', 'A DCF estimates a company’s intrinsic value by forecasting its future free cash flows and discounting each back to today. Small changes to the growth or discount rate swing the answer a lot, so treat it as a range, not a fact.'),
      match([['Present value', 'Future money in today’s terms'], ['Discount rate', 'The return you require, used to shrink future cash'], ['Intrinsic value', 'What a business is worth from its cash flows'], ['Terminal value', 'Value of cash flows beyond the forecast']]),
      mc('£121 arrives in two years. At a 10% discount rate, what is it worth today?', ['£100', '£121', '£110', '£99'], '£121 ÷ 1.1² = £100.'),
      mc('You raise the discount rate in a DCF. What happens to the value?', ['It falls', 'It rises', 'It stays the same', 'It doubles'], 'Future cash is shrunk more heavily.'),
      mc('Why treat a DCF result with caution?', ['Small input changes swing it a lot', 'It is always wrong', 'It ignores cash', 'It only works for banks'], 'It is only as good as its assumptions.'),
      tf('Higher interest rates tend to lower the present value of far-off profits.', true, 'Higher rates mean higher discount rates.'),
    ]),
  ]),
  ...unit('Unit 11: Macroeconomics & Central Banks', [
    cur('11.1', 'Federal Reserve & Interest Rate Cycles', 9, ['bank-console', 'Central Bank Console', 'Set the base rate in response to inflation and jobs data.'], ['fed-chair', 'Fed Chair Simulator', 'Keep inflation and unemployment in the green zone.'], [
      card('What central banks do', 'The Federal Reserve in the US (and the Bank of England in the UK) sets a base interest rate to keep inflation near target, around 2%. Raising rates cools spending and inflation; cutting rates encourages borrowing and growth.'),
      card('Rate cycles', 'Rates move in cycles. When inflation is high, banks hike; when the economy weakens, they cut. Rate changes ripple into mortgages, savings rates, bond prices and share prices, often with a delay of a year or more.'),
      match([['Base rate', 'The central bank’s key interest rate'], ['Rate hike', 'Raising rates to cool inflation'], ['Rate cut', 'Lowering rates to boost the economy'], ['CPI', 'The main measure of inflation']]),
      mc('Inflation is 6% and rising. What would a central bank usually do?', ['Raise interest rates', 'Cut interest rates', 'Print a new currency', 'Ban borrowing'], 'Higher rates cool spending and price rises.'),
      mc('The bank cuts rates. What usually happens to savings rates?', ['They fall', 'They rise', 'They stay the same forever', 'They become negative overnight'], 'Banks pass lower rates on to savers.'),
      mc('Who sets UK interest rates?', ['The Bank of England’s Monetary Policy Committee', 'The Prime Minister', 'High-street banks', 'The FTSE 100'], 'The MPC meets about every six weeks.'),
      tf('Rate changes affect the economy instantly.', false, 'They work with long delays, often a year or more.'),
    ]),
    cur('11.2', 'Market Cycles & Yield Curves', 9, ['yield-curve', 'Yield Curve Inversion Plotter', 'Plot short vs. long yields and flag recession signals.'], ['recession-rider', 'Recession Rider', 'Ride a coaster that twists with the yield curve.'], [
      card('The business cycle', 'Economies move through expansion, peak, contraction (recession) and recovery. Shares often move ahead of the economy, falling before a recession is official and recovering before it ends.'),
      card('The yield curve', 'The yield curve plots bond yields from short to long maturities. Normally long bonds pay more. When short yields rise above long ones, the curve is “inverted”, which has often come before recessions.'),
      match([['Expansion', 'The economy growing'], ['Recession', 'The economy shrinking'], ['Yield curve', 'Yields plotted by maturity'], ['Inversion', 'Short yields above long yields']]),
      mc('2-year yield 4.8%, 10-year yield 4.1%. What shape is the curve?', ['Inverted', 'Normal', 'Flat at zero', 'Vertical'], 'Short above long means inverted.'),
      mc('What has an inverted curve often signalled?', ['A coming recession', 'A guaranteed boom', 'Higher inflation forever', 'Nothing at all'], 'It is a warning sign, not a certainty.'),
      mc('When do share prices often start recovering?', ['Before the recession officially ends', 'Only years after it ends', 'Never', 'At the exact peak'], 'Markets look ahead.'),
      tf('An inverted yield curve guarantees a recession.', false, 'It has a strong record as a signal, but not a perfect one.'),
    ]),
  ]),
  ...unit('Unit 12: Behavioral Finance & Market Crashes', [
    cur('12.1', 'Psychological Biases', 9, ['bias-spotter', 'Bias Spotter', 'Spot FOMO, loss aversion and anchoring in mock trader chats.'], ['mind-over-market', 'Mind Over Market', 'Tap emotional traps before they trigger impulse trades.'], [
      card('Your brain vs. the market', 'Biases are mental shortcuts that lead to poor money choices. FOMO makes you chase what has already soared. Loss aversion makes losses hurt about twice as much as equal gains feel good. Anchoring fixes you on a past price.'),
      card('Fighting back', 'Write rules before you act: what you buy, why, and when you would sell. Automate regular investing. Avoid checking prices constantly. Ask: “Would I buy this today at this price if I didn’t own it?”'),
      match([['FOMO', 'Fear of missing out'], ['Loss aversion', 'Losses hurt more than gains please'], ['Anchoring', 'Fixating on an old number'], ['Herding', 'Following the crowd']]),
      mc('“It was £50 last year, so £30 must be cheap.” Which bias?', ['Anchoring', 'FOMO', 'Herding', 'Overconfidence'], 'The £50 is an anchor; it says nothing about value today.'),
      mc('“Everyone’s buying this coin, I can’t miss out!” Which bias?', ['FOMO', 'Loss aversion', 'Anchoring', 'Hindsight bias'], 'Fear of missing out.'),
      mc('You refuse to sell a falling share “until it gets back to what I paid”. Which bias?', ['Loss aversion', 'FOMO', 'Herding', 'Recency bias'], 'Selling would make the loss real, so you avoid it.'),
      tf('Writing your rules before investing helps against biases.', true, 'Decisions made calmly beat decisions made in the moment.'),
    ]),
    cur('12.2', 'Navigating Market Crashes', 9, ['crash-tree', '35% Crash Decision Tree', 'Live through a crash and test panic-selling against buying the dip.'], ['dip-buyer', 'Dip Buyer', 'Stock up on quality assets through a crash without running out of cash.'], [
      card('Crashes happen', 'Big falls are normal for shares: drops of 30% or more have happened several times a generation (2000, 2008, 2020). Historically, broad markets have recovered, though it has sometimes taken years.'),
      card('What not to do', 'Selling after a crash locks in the loss and often means missing the rebound: many of the best days come soon after the worst. Holding, or buying more steadily with spare cash, has usually done better than panic selling.'),
      match([['Crash', 'A sudden, deep fall in prices'], ['Bear market', 'A fall of 20% or more'], ['Panic selling', 'Selling in fear after a fall'], ['Buying the dip', 'Buying more after prices fall']]),
      mc('Your £10,000 falls 35%. What is it worth?', ['£6,500', '£3,500', '£9,650', '£13,500'], '£10,000 × 0.65.'),
      mc('After a 35% fall, what gain gets you back to where you started?', ['About 54%', '35%', '17%', '100%'], '£6,500 needs to grow £3,500: 3,500 ÷ 6,500 ≈ 54%.'),
      mc('What usually helps most in a crash?', ['A cash buffer and a plan written beforehand', 'Checking prices every hour', 'Following social media tips', 'Borrowing to buy more'], 'A buffer means you are never forced to sell.'),
      tf('Many of the market’s best days come soon after its worst days.', true, 'Which is why panic sellers often miss the recovery.'),
    ]),
  ]),
];

/* ============================================================ Tier 4: Investor — Sophisticated Strategist */
export const INVESTOR: Lesson[] = [
  ...unit('Unit 13: Options & Derivatives', [
    cur('13.1', 'Call & Put Options Mechanics', 10, ['payoff-plotter', 'Payoff Plotter', 'Drag the strike and stock price to build a profit and loss diagram.'], ['strike-zone', 'Option Strike Zone', 'Launch trades into target strike-price zones.'], [
      card('Calls and puts', 'An option is a contract giving the right, not the duty, to buy or sell a share at a set price (the strike) before a set date (expiry). A call is the right to buy: it gains when the price rises. A put is the right to sell: it gains when the price falls.'),
      card('Premium and payoff', 'You pay a premium for the option. If the share ends past your strike, the option has value; if not, it expires worthless and you lose the premium. A buyer’s loss is capped at the premium; a seller’s can be much bigger.'),
      match([['Call option', 'Right to buy at the strike'], ['Put option', 'Right to sell at the strike'], ['Strike price', 'The agreed price in an option'], ['Premium', 'The price paid for an option']]),
      mc('You buy a £100-strike call for £5. The share ends at £120. What is your profit per share?', ['£15', '£20', '£25', '£5'], 'Worth £20 at expiry, minus the £5 premium.'),
      mc('You buy a £100-strike put for £4. The share ends at £110. What happens?', ['It expires worthless and you lose £4', 'You make £10', 'You make £6', 'You lose £110'], 'Nobody sells at £100 when the market pays £110.'),
      mc('What is the most an option buyer can lose?', ['The premium paid', 'Unlimited', 'The strike price', 'Twice the premium'], 'The buyer can just let it expire.'),
      tf('A put option gains value when the share price falls.', true, 'The right to sell at a fixed price becomes more valuable.'),
    ]),
    cur('13.2', 'Options Strategies & Theta Decay', 10, ['decay-clock', 'Time Decay Clock', 'Fast-forward to expiry and watch the option premium melt.'], ['theta-crunch', 'Theta Time Crunch', 'Manage option positions before the decay clock hits zero.'], [
      card('Time value and theta', 'An option’s premium is intrinsic value (how far it is in the money) plus time value (the chance it gets there). Time value melts as expiry approaches, faster in the final weeks. That daily melt is called theta.'),
      card('Common strategies', 'A covered call means owning a share and selling a call on it to earn premium, giving up gains above the strike. A protective put means owning a share and buying a put as insurance. Sellers of options collect theta; buyers pay it.'),
      match([['Theta', 'Daily loss of time value'], ['Intrinsic value', 'How far an option is in the money'], ['Covered call', 'Own the share, sell a call on it'], ['Protective put', 'Own the share, buy a put as insurance']]),
      mc('Share at £50. A £45-strike call costs £7. What is its time value?', ['£2', '£5', '£7', '£45'], 'Intrinsic value is £5, so £2 is time value.'),
      mc('When does time decay usually speed up?', ['In the last few weeks before expiry', 'In the first week after buying', 'Never, it is constant', 'Only on weekends'], 'Time value collapses near expiry.'),
      mc('Which strategy works like insurance on shares you own?', ['A protective put', 'A covered call', 'Buying more shares', 'Selling a put'], 'The put pays out if the price falls.'),
      tf('Theta works in favour of option sellers.', true, 'They collect premium that melts away over time.'),
    ]),
  ]),
  ...unit('Unit 14: Real Estate & Real Assets', [
    cur('14.1', 'Cap Rates & Commercial RE', 10, ['cap-rate', 'Cap Rate Calculator', 'Enter NOI, price and vacancy to solve the cap rate.'], ['reit-tycoon', 'REIT Tycoon', 'Buy commercial properties using live NOI and cap rates.'], [
      card('Net operating income', 'Net operating income (NOI) is a property’s yearly rent after running costs (maintenance, insurance, management, empty units), but before mortgage payments and tax.'),
      card('Cap rate', 'The capitalisation rate is NOI ÷ purchase price. It is a property’s yield if bought with cash. A higher cap rate means more income per pound, but often more risk. REITs let you invest in property through a share.'),
      match([['NOI', 'Rent minus running costs'], ['Cap rate', 'NOI ÷ price'], ['Vacancy rate', 'Share of units standing empty'], ['REIT', 'A listed company that owns property']]),
      mc('NOI £60,000, price £1,000,000. What is the cap rate?', ['6%', '60%', '0.6%', '16%'], '£60,000 ÷ £1,000,000.'),
      mc('Rent £100,000, costs £30,000, 10% vacancy on the rent. What is NOI?', ['£60,000', '£70,000', '£90,000', '£40,000'], '£100,000 − £10,000 vacancy − £30,000 costs.'),
      mc('Two buildings: cap rates 4% and 9%. What might the 9% signal?', ['Higher risk or a weaker location', 'Guaranteed better value', 'Lower risk', 'A mistake'], 'Higher yields usually pay you for risk.'),
      tf('A REIT lets you invest in property without buying a whole building.', true, 'You buy shares in a company that owns many buildings.'),
    ]),
    cur('14.2', 'Real Estate Leverage & Risk', 10, ['ltv', 'LTV Adjuster', 'Tweak loan-to-value to see returns expand and default risk grow.'], ['leverage-tightrope', 'Leverage Tightrope', 'Balance high returns against default risk on a tightrope.'], [
      card('Loan-to-value', 'Loan-to-value (LTV) is the mortgage as a share of the property price. A £200,000 loan on a £250,000 property is 80% LTV. Higher LTV means less of your own money in, and usually a higher interest rate.'),
      card('Leverage cuts both ways', 'Borrowing magnifies returns on your equity. If a £250,000 property with £50,000 of your cash rises 10%, your equity rises 50%. But a 20% fall wipes your equity out, and you still owe the loan.'),
      match([['LTV', 'Loan ÷ property value'], ['Equity', 'Your share of the property'], ['Negative equity', 'Owing more than it is worth'], ['Return on equity', 'Gain ÷ your own money put in']]),
      mc('Property £300,000, mortgage £240,000. What is the LTV?', ['80%', '20%', '60%', '125%'], '£240,000 ÷ £300,000.'),
      mc('You put £50,000 into a £250,000 property. It rises 10%. What is your return on equity, ignoring costs?', ['50%', '10%', '25%', '5%'], 'A £25,000 gain on £50,000.'),
      mc('Same property falls 20%. What happens to your £50,000 equity?', ['It is wiped out', 'It falls 20%', 'It rises', 'It halves'], 'A £50,000 fall equals all your equity.'),
      tf('Higher leverage increases both potential gains and potential losses.', true, 'That is the trade-off of borrowing.'),
    ]),
  ]),
  ...unit('Unit 15: Alternative Assets & Private Markets', [
    cur('15.1', 'Private Equity & VC Dynamics', 10, ['j-curve', 'VC J-Curve Simulator', 'Track a startup fund’s value dip before the exits arrive.'], ['unicorn-hunter', 'Unicorn Hunter', 'Spread capital across startups to survive high failure rates.'], [
      card('Private markets', 'Private equity buys stakes in companies not listed on a stock exchange, often to improve and sell them. Venture capital (VC) backs young startups. Money is usually locked up for 7–10 years.'),
      card('Power law and the J-curve', 'Most startups fail; a few huge winners pay for all the losses. Early on, fees and write-offs push a fund’s value down before successful exits lift it, tracing a J shape. Only spread, patient capital survives that.'),
      match([['Private equity', 'Buying stakes in unlisted companies'], ['Venture capital', 'Funding young startups'], ['J-curve', 'Early losses before later gains'], ['Exit', 'A sale or listing that returns cash']]),
      mc('A VC backs 10 startups at £1m each. Seven fail, two return £1m, one returns £20m. What is the total returned?', ['£22m', '£10m', '£20m', '£3m'], '£1m + £1m + £20m.'),
      mc('Why does a VC fund’s value dip early on?', ['Fees and early failures come before exits', 'It is a scam', 'Shares always fall at first', 'Taxes are charged up front'], 'That is the bottom of the J.'),
      mc('What is a key drawback of private markets for normal investors?', ['Money is locked up for years', 'They are always low risk', 'There are no fees', 'Returns are guaranteed'], 'You usually cannot sell when you want.'),
      tf('In venture capital, a few big winners usually make up for many losses.', true, 'Returns follow a “power law”.'),
    ]),
    cur('15.2', 'Commodities & Asset Correlation', 10, ['frontier', 'Efficient Frontier Plotter', 'Mix gold, shares and property to maximise the Sharpe ratio.'], ['sharpe-shooter', 'Sharpe Shooter', 'Tune uncorrelated asset weights for the best risk-adjusted score.'], [
      card('Correlation', 'Correlation measures how two assets move together, from +1 (in lockstep) to −1 (opposite). Mixing assets that do not move together, like shares and gold, can lower a portfolio’s swings without cutting its return as much.'),
      card('Sharpe ratio and the efficient frontier', 'The Sharpe ratio is return above the risk-free rate, divided by volatility: reward per unit of risk. The efficient frontier is the set of mixes giving the best return for each level of risk.'),
      match([['Correlation', 'How two assets move together'], ['Commodity', 'A raw material like gold or oil'], ['Sharpe ratio', 'Extra return per unit of risk'], ['Efficient frontier', 'Best return for each level of risk']]),
      mc('Return 8%, risk-free rate 3%, volatility 10%. What is the Sharpe ratio?', ['0.5', '0.8', '1.1', '5'], '(8 − 3) ÷ 10.'),
      mc('Which pair helps diversification most?', ['Two assets with correlation near −0.2', 'Two with correlation +0.95', 'Two shares in the same industry', 'The same fund twice'], 'Low or negative correlation smooths the mix.'),
      mc('Gold is often held because it…', ['Has tended to hold up in some crises', 'Pays big dividends', 'Never falls', 'Is a type of bond'], 'It pays no income but can diversify.'),
      tf('Adding an uncorrelated asset can lower risk without lowering return by the same amount.', true, 'That is the core idea behind diversification.'),
    ]),
  ]),
  ...unit('Unit 16: Tax-Loss Harvesting & Wealth Transfer', [
    cur('16.1', 'Tax-Loss Harvesting & Wash-Sale Rules', 10, ['harvest-matrix', 'Harvesting Matrix', 'Harvest losing positions and pick valid proxy funds.'], ['wash-sale', 'Wash-Sale Evasion', 'Swap losers for proxies without touching the 30-day zone.'], [
      card('Tax-loss harvesting', 'Outside an ISA or pension, gains can be taxed (Capital Gains Tax in the UK). Selling an investment at a loss can offset gains elsewhere, cutting your tax bill. You can then buy something similar to stay invested.'),
      card('The 30-day rule', 'You cannot sell and instantly buy the same thing back just to book a loss. The US “wash-sale” rule and the UK “bed and breakfasting” rule both look 30 days around the sale. Buying a similar but not identical fund (a proxy) is the usual way round it.'),
      match([['Capital Gains Tax', 'Tax on profits from selling'], ['Tax-loss harvesting', 'Selling at a loss to offset gains'], ['Wash-sale / B&B rule', 'Blocks rebuying the same asset within 30 days'], ['Proxy', 'A similar, not identical, replacement']]),
      mc('Gains £8,000, harvested losses £3,000. What gain is left to tax (before allowances)?', ['£5,000', '£11,000', '£8,000', '£3,000'], '£8,000 − £3,000.'),
      mc('You sell a FTSE 100 tracker at a loss. Which buy keeps the loss usable?', ['A FTSE All-Share tracker', 'The same FTSE 100 tracker the next day', 'The same fund two weeks later', 'The same fund the same afternoon'], 'Similar exposure, but not the identical holding.'),
      mc('Does tax-loss harvesting matter inside an ISA?', ['No, ISA gains are already tax-free', 'Yes, always', 'Only on Mondays', 'Only for bonds'], 'There is no gains tax to offset inside an ISA.'),
      tf('Rebuying the identical fund within 30 days lets you keep the tax loss.', false, 'The 30-day rules match the sale with the rebuy.'),
    ]),
    cur('16.2', 'Sequence of Returns & Decumulation', 10, ['stress-test', 'Retirement Stress Test', 'Run 30 years of withdrawals starting in a bull or a bear market.'], ['safe-withdrawal', 'Safe Withdrawal Survival', 'Adjust withdrawals through bad years to survive 30 cycles.'], [
      card('Decumulation', 'Decumulation is drawing money out of your pot, usually in retirement. A common rule of thumb is the “4% rule”: take 4% of the starting pot in year one, then raise it with inflation, aiming to last about 30 years.'),
      card('Sequence of returns risk', 'The order of returns matters when you withdraw. A crash in the first years forces you to sell more units at low prices, and the pot may never recover. The same returns in reverse order can leave a much bigger pot.'),
      match([['Decumulation', 'Drawing money out of a pot'], ['4% rule', 'Withdraw 4% of the starting pot, then inflation-adjust'], ['Sequence risk', 'Bad returns early do the most damage'], ['Guardrails', 'Cutting withdrawals after bad years']]),
      mc('A £500,000 pot under the 4% rule gives what first-year income?', ['£20,000', '£4,000', '£50,000', '£2,000'], '4% of £500,000.'),
      mc('When does a market crash hurt a retiree most?', ['In the first few years of withdrawals', 'In the last year', 'It makes no difference', 'Only before retirement'], 'Early losses plus withdrawals shrink the base that has to last.'),
      mc('Which habit helps a pot survive a bad start?', ['Taking a bit less after bad years', 'Taking more to make up for losses', 'Selling everything to cash', 'Ignoring it'], 'Flexible withdrawals protect the pot.'),
      tf('Two retirees with the same average return always end with the same pot.', false, 'The order of returns changes the outcome when money is being withdrawn.'),
    ]),
  ]),
];
