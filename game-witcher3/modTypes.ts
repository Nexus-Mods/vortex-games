import { CONFIG_MATRIX_REL_PATH } from './common';
import path from 'path';
import { types } from 'vortex-api';

const destHasRootDir = (instruction: types.IInstruction, dir: string) => {
  if (!instruction?.destination) {
    return false;
  }
  const segments = instruction.destination.split(path.sep);
  return segments[0].toLowerCase() === dir.toLowerCase();
}

export function testTL(instructions: types.IInstruction[]) {
  const menuModFiles = instructions.filter(instr => !!instr.destination
    && instr.destination.indexOf(CONFIG_MATRIX_REL_PATH) !== -1);
  if (menuModFiles.length > 0) {
    return Promise.resolve(false);
  }

  const hasModsDir = instructions.some(instr => destHasRootDir(instr, 'mods'));
  const hasInvalidStructure = instructions.some(instr => !destHasRootDir(instr, 'mods'));
  return Promise.resolve(hasModsDir && !hasInvalidStructure);
}

export function testDLC(instructions: types.IInstruction[]) {
  return Promise.resolve(instructions.find(
    instruction => !!instruction.destination && instruction.destination.toLowerCase().startsWith('dlc' + path.sep)) !== undefined);
}