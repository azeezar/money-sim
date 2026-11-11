/**
 * Two builds from one codebase:
 *  - regular (`npm run dev`, `npm run build`): what users get.
 *  - admin   (`npm run dev:admin`, `npm run build:admin`): every tier and lesson open,
 *    the trading simulator unlocked, and an Admin tab that edits any part of the saved state.
 */
export const ADMIN: boolean = import.meta.env.MODE === 'admin';
export const APP_NAME = 'Money Sim';
