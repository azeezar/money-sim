import type { ComponentType } from 'react';
import { ADVANCED_ARCADE } from './advanced';
import type { ArcadeProps } from './engine';
import { INTERMEDIATE_ARCADE } from './intermediate';
import { INVESTOR_ARCADE } from './investor';
import { NOVICE_ARCADE } from './novice';

/** Arcade games by id, as named in the curriculum. */
export const ARCADE: Record<string, ComponentType<ArcadeProps>> = { ...NOVICE_ARCADE, ...INTERMEDIATE_ARCADE, ...ADVANCED_ARCADE, ...INVESTOR_ARCADE };
