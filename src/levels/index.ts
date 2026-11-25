import { ACT1 } from './act1-transit';
import { ACT2 } from './act2-office';
import { ACT3 } from './act3-rooftops';

export const LEVELS = [...ACT1, ...ACT2, ...ACT3];
export const ACT_NAMES = {
  1: "TRANSIT",
  2: "OFFICE TOWER",
  3: "ROOFTOPS"
};
