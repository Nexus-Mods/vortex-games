import { CONFIG_MATRIX_REL_PATH } from './common';
import { types } from 'vortex-api';

export function testTL(instructions: types.IInstruction[]) {
  const menuModFiles = instructions.filter(instr => !!instr.destination
    && instr.destination.indexOf(CONFIG_MATRIX_REL_PATH) !== -1);
  if (menuModFiles.length > 0) {
    return Promise.resolve(false);
  }

  return Promise.resolve(instructions.find(
    instruction => !!instruction.destination && instruction.destination.toLowerCase().startsWith('mods' + path.sep),
  ) !== undefined);
}

export function testDLC(instructions: types.IInstruction[]) {
  return Promise.resolve(instructions.find(
    instruction => !!instruction.destination && instruction.destination.toLowerCase().startsWith('dlc' + path.sep)) !== undefined);
}