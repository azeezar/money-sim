import type { ComponentType } from 'react';
import { NOVICE_MECHS, type MechProps } from './novice';

export type { MechProps } from './novice';

/** Interactive lesson mechanics by id. A lesson whose mechanic is not here yet simply skips that step. */
export const MECHS: Record<string, ComponentType<MechProps>> = { ...NOVICE_MECHS };
