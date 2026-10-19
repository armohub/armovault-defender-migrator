// Stage 1, Prepare. Split into three files so each stays readable.
import { PREPARE_1 } from './stage-prepare-1.mjs';
import { PREPARE_2 } from './stage-prepare-2.mjs';
import { PREPARE_3 } from './stage-prepare-3.mjs';

export const PREPARE = [...PREPARE_1, ...PREPARE_2, ...PREPARE_3];
