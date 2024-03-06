/* eslint-disable */
import * as path from 'path';
import { fs, log, selectors, types, util } from 'vortex-api';

import { GAME_ID } from './common';
import { listPackage } from './divineWrapper';
import { IPakInfo } from './types';
import { extractPakInfoImpl } from './util';

export interface ICacheEntry {
  lastModified: number;
  info: IPakInfo;
  fileName: string;
  packageList: string[];
  isListed: boolean;
  mod?: types.IMod;
}

type IPakMap = { [filePath: string]: ICacheEntry };
export default class PakInfoCache {
  private static instance: PakInfoCache = null;
  public static getInstance(): PakInfoCache {
    if (!PakInfoCache.instance) {
      PakInfoCache.instance = new PakInfoCache();
    }

    return PakInfoCache.instance;
  }

  private mCache: IPakMap;
  constructor() {
    this.mCache = null;
  }

  public async getCacheEntry(api: types.IExtensionApi,
                             filePath: string,
                             mod?: types.IMod): Promise<ICacheEntry> {
    if (!this.mCache) { 
      this.mCache = await this.load(api);
    }
    const id = this.fileId(filePath);
    let mtime: number;
    try {
      const stat = fs.statSync(filePath);
      mtime = Number(stat.mtimeMs);
    } catch (err) {
      mtime = Date.now();
    }
    if ((this.mCache[id] === undefined)
        || (mtime !== this.mCache[id].lastModified)) {
      const packageList = await listPackage(api, filePath);
      const isListed = this.isLOListed(api, filePath, packageList);
      const info = await extractPakInfoImpl(api, filePath, mod, isListed);
      this.mCache[id] = {
        fileName: path.basename(filePath),
        lastModified: mtime,
        info,
        packageList,
        mod,
        isListed,
      };
    }
    return this.mCache[id];
  }

  public reset() {
    this.mCache = null;
  }

  public async save(api: types.IExtensionApi) {
    if (!this.mCache) {
      // Nothing to save.
      return;
    }
    const state = api.getState();
    const profileId = selectors.lastActiveProfileForGame(state, GAME_ID);
    const staging = selectors.installPathForGame(state, GAME_ID);
    const cachePath = path.join(path.dirname(staging), 'cache', profileId + '.json');
    try {
      await fs.ensureDirWritableAsync(path.dirname(cachePath));
      await util.writeFileAtomic(cachePath, JSON.stringify(this.mCache));
    } catch (err) {
      log('error', 'failed to save cache', err);
      return;
    }
  }

  private async load(api: types.IExtensionApi): Promise<IPakMap> {
    const state = api.getState();
    const profileId = selectors.lastActiveProfileForGame(state, GAME_ID);
    const staging = selectors.installPathForGame(state, GAME_ID);
    const cachePath = path.join(path.dirname(staging), 'cache', profileId + '.json');
    try {
      await fs.ensureDirWritableAsync(path.dirname(cachePath));
      const data = await fs.readFileAsync(cachePath, { encoding: 'utf8' });
      return JSON.parse(data);
    } catch (err) {
      if (!['ENOENT'].includes(err.code)) {
        log('error', 'failed to load cache', err);
      }
      return {};
    }
  }

  private isLOListed(api: types.IExtensionApi, pakPath: string, packageList: string[]): boolean {
    try {
      // look at the end of the first bit of data to see if it has a meta.lsx file
      // example 'Mods/Safe Edition/meta.lsx\t1759\t0'
      const containsMetaFile = packageList.find(line => path.basename(line.split('\t')[0]).toLowerCase() === 'meta.lsx') !== undefined ? true : false;

      // invert result as 'listed' means it doesn't contain a meta file.
      return !containsMetaFile;
    } catch (err) {
      api.sendNotification({
        type: 'error',
        message: `${path.basename(pakPath)} couldn't be read correctly. This mod be incorrectly locked/unlocked but will default to unlocked.`,
      });
      return false;    
    }
  }

  private fileId(filePath: string): string {
    return path.basename(filePath).toUpperCase();
  }
}
