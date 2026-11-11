export const QUESTS = [
  { id: 'lesson', label: 'Finish a lesson' },
  { id: 'budget', label: 'Log a spend in your budget' },
  { id: 'game', label: 'Play a minigame' },
] as const;

export type QuestId = (typeof QUESTS)[number]['id'];
