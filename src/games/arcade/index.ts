import type { ComponentType } from 'react';
import type { ArcadeProps } from './engine';
import { INTERMEDIATE_ARCADE } from './intermediate';
import { NOVICE_ARCADE } from './novice';

/** Arcade games by id, as named in the curriculum. Ids not here yet show as coming soon. */
export const ARCADE: Record<string, ComponentType<ArcadeProps>> = { ...NOVICE_ARCADE, ...INTERMEDIATE_ARCADE };
