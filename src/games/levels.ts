/** Risk Lab runs more years as it levels up. */
export const riskYears = (level: number): number => Math.min(10, 5 + level);

/** What a level changes, for the game header. Arcade games speed up 12% per level (see engine `pace`). */
export const perk = (id: string, level: number): string => (id === 'risk' ? `${riskYears(level)} years` : `${Math.round(100 + 12 * level)}% speed`);
