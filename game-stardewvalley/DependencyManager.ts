import { ISDVDependency, ISDVModManifest } from './types';
import turbowalk from 'turbowalk';
import { fs, log, types, selectors, util } from 'vortex-api';
import { GAME_ID } from './common';

import { parseManifest } from './util';

import path from 'path';
import { coerce, gte } from 'semver';

type ManifestMap = { [modId: string]: ISDVModManifest[] };
export default class DependencyManager {
  private mApi: types.IExtensionApi;
  private mManifests: ManifestMap;
  private mLoading: boolean = false;

  constructor(api: types.IExtensionApi) {
    this.mApi = api;
  }

  public async getManifests(): Promise<ManifestMap> {
    await this.scanManifests();
    return this.mManifests;
  }

  public async refresh(): Promise<void> {
    if (this.mLoading) {
      return;
    }
    this.mLoading = true;
    await this.scanManifests(true);
    this.mLoading = false;
  }

  public async scanManifests(force?: boolean): Promise<void> {
    if (!force && this.mManifests !== undefined) {
      return;
    }
    const state = this.mApi.getState();
    const staging = selectors.installPathForGame(state, GAME_ID);
    const profileId = selectors.lastActiveProfileForGame(state, GAME_ID);
    const profile = selectors.profileById(state, profileId);
    const isActive = (modId: string) => util.getSafe(profile, ['modState', modId, 'enabled'], false);
    const mods: { [modId: string]: types.IMod } = util.getSafe(state, ['persistent', 'mods', GAME_ID], {});
    const manifests = await Object.values(mods).reduce(async (accumP, iter) => {
      const accum = await accumP;      
      if (!isActive(iter.id)) {
        return Promise.resolve(accum);
      }
      const modPath = path.join(staging, iter.installationPath);
      return turbowalk(modPath, async entries => {
      for (const entry of entries) {
        if (path.basename(entry.filePath) === 'manifest.json') {
          let manifest;
          try {
            manifest = await parseManifest(entry.filePath);
          } catch (err) {
            log('error', 'failed to parse manifest', { error: err.message, manifest: entry.filePath });
            continue;
          }
          const list = accum[iter.id] ?? [];
          list.push(manifest);
          accum[iter.id] = list;
        }
      }
      }, { skipHidden: false, recurse: true, skipInaccessible: true, skipLinks: true})
      .then(() => Promise.resolve(accum));
    }, {});
    this.mManifests = manifests;
    return Promise.resolve();
  }

  public findMissingDependencies(deps?: string[]): ISDVDependency[] {
    const state = this.mApi.getState();
    const profileId = selectors.lastActiveProfileForGame(state, GAME_ID);
    const profile = selectors.profileById(state, profileId);
    const isActive = (modId: string) => util.getSafe(profile, ['modState', modId, 'enabled'], false);
    const mods: { [modId: string]: types.IMod } = util.getSafe(state, ['persistent', 'mods', GAME_ID], {});
    const modIds = Object.keys(mods);
    const activeMods = modIds.filter(isActive);
    const activeManifests: ISDVModManifest[] = activeMods.reduce((accum, iter) =>
      this.mManifests?.[iter] !== undefined
        ? accum.concat(this.mManifests[iter])
        : accum, []);
    const dependencies: ISDVDependency[] = (deps?.length ?? 0 > 0)
      ? deps
      : activeManifests.reduce((accum, iter) =>
        (iter?.Dependencies?.length ?? 0 > 0)
          ? accum.concat(iter.Dependencies)
          : accum, []);

    const depSatisfied = (dep: ISDVDependency) => {
      const found = activeManifests.find(man => {
        const idMatch = man.UniqueID === dep.UniqueID;
        const versionMatch = dep.MinimumVersion
          ? gte(coerce(man.Version ?? '0.0.0'), coerce(dep.MinimumVersion ?? '0.0.0'))
          : true;
        return idMatch && versionMatch;
      });
      return found ? true : dep.IsRequired === false;
    };

    const missingDeps = dependencies.filter(dep => !depSatisfied(dep));
    return missingDeps;
  }
}
