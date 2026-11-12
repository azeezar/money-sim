import type { ComponentType } from 'react';
import { ADVANCED_MECHS } from './advanced';
import { INTERMEDIATE_MECHS } from './intermediate';
import { INVESTOR_MECHS } from './investor';
import { NOVICE_MECHS, type MechProps } from './novice';

export type { MechProps } from './novice';

/** Interactive lesson mechanics by id, as named in the curriculum. */
export const MECHS: Record<string, ComponentType<MechProps>> = { ...NOVICE_MECHS, ...INTERMEDIATE_MECHS, ...ADVANCED_MECHS, ...INVESTOR_MECHS };
