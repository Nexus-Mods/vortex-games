import { parse } from 'relaxed-json';
import * as semver from 'semver';
import { fs, util } from 'vortex-api';
import { ISDVModManifest } from './types';

export async function parseManifest(manifestFilePath: string): Promise<ISDVModManifest> {
  try {
    const manifestData = await fs.readFileAsync(manifestFilePath, { encoding: 'utf-8' });
    const manifest: ISDVModManifest = parse(util.deBOM(manifestData)) as ISDVModManifest;
    if (!manifest) {
      throw new util.DataInvalid('Manifest file is invalid');
    }
    return manifest;
  } catch (err) {
    return Promise.reject(err);
  }
}

/**
 * semver.coerce drops pre-release information from a
 * perfectly valid semantic version string, don't want that
 */
export function coerce(input: string): semver.SemVer {
  try {
    return new semver.SemVer(input);
  } catch (err) {
    return semver.coerce(input);
  }
}

export function semverCompare(lhs: string, rhs: string): number {
  const l = coerce(lhs);
  const r = coerce(rhs);
  if ((l !== null) && (r !== null)) {
    return semver.compare(l, r);
  } else {
    return lhs.localeCompare(rhs, 'en-US');
  }
}
