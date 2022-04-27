import path from 'path';
import turbowalk, { IEntry } from 'turbowalk';
import { fs, log, selectors, types, util } from 'vortex-api';

import { GAME_ID, SUBMOD_FILE } from './common';
import { IDependency, IProps, ISubModule } from './types';
import { genProps, getCleanVersion, getXMLData } from './util';

const DEP_XML_LIST = 'DependedModuleMetadatas';
const DEP_XML_ELEMENT = 'DependedModuleMetadata';

// This component aims to cater for the community developed metadata
//  sorting methodology.
class ComMetadataManager {
  private mApi: types.IExtensionApi;
  private mDependencyMap: { [subModId: string]: ISubModule };
  constructor(api: types.IExtensionApi) {
    this.mApi = api;
    this.mDependencyMap = undefined;
  }

  public isOptional(subModId: string, depId: string) {
    const dependency: IDependency =
      (this.mDependencyMap[subModId]?.dependencies || []).find(dep => dep.id === depId);
    if (dependency === undefined) {
      return false;
    }
    return dependency.optional;
  }

  public getDependencies(subModId: string): IDependency[] {
    return [].concat(
      (this.mDependencyMap[subModId]?.dependencies || []).filter(dep => dep.order === 'LoadBeforeThis'),
      Object.keys(this.mDependencyMap).reduce((accum, iter) => {
      const subModule: ISubModule = this.mDependencyMap[iter];
      const deps = subModule.dependencies.filter(dep => dep.id === subModId && dep.order === 'LoadAfterThis');
      if (deps.length > 0) {
        const newDep: IDependency = {
          id: subModule.id,
          incompatible: deps[0].incompatible,
          optional: deps[0].optional,
          order: 'LoadAfterThis',
          version: getCleanVersion(subModule.id, deps[0].version),
        };
        accum = [].concat(accum, newDep);
      }
      return accum;
    }, []));
  }

  public async updateDependencyMap(profileId?: string) {
    const props: IProps = genProps(this.mApi, profileId);
    if (props === undefined) {
      this.mApi.showErrorNotification('Failed to update Dependency map',
        'Game is not discovered and/or profile is invalid', { allowReport: false });
      return;
    }
    this.mDependencyMap = await this.genDependencyMap(props);
  }

  private async parseSubModFile(filePath: string): Promise<ISubModule> {
    const getAttrValue = (node, attr, optional = true) => {
      try {
        const value = node?.$?.[attr];
        return Promise.resolve(value);
      } catch (err) {
        return optional
          ? Promise.resolve(undefined)
          : Promise.reject(new Error(`missing ${attr}`));
      }
    };

    let subModId;
    const dependencies: IDependency[] = [];
    try {
      const data = await getXMLData(filePath);
      subModId = data?.Module?.Id?.[0]?.$?.value;
      const depNodes = data?.Module?.DependedModuleMetadatas?.[0]?.DependedModuleMetadata || [];
      for (const node of depNodes) {
        try {
          const id = await getAttrValue(node, 'id', false);
          let version = await getAttrValue(node, 'version');
          version = getCleanVersion(id, version);
          const dep: IDependency = {
            id,
            optional: await getAttrValue(node, 'optional') === 'true',
            order: await getAttrValue(node, 'order'),
            version,
            incompatible: await getAttrValue(node, 'incompatible') === 'true',
          };
          dependencies.push(dep);
        } catch (err) {
          log('error', 'unable to parse community dependency', err);
        }
      }
    } catch (err) {
      // We're simply going to log at this stage; too many
      //  mods have had invalid subModule files in the past
      log('error', 'failed to parse SubModule.xml', err);
      return;
    }

    return { id: subModId, dependencies };
  }

  private async findSubModFiles(modPath: string) {
    let fileEntries: IEntry[] = [];

    try {
      await turbowalk(modPath, entries => {
        const filtered = entries.filter(entry => !entry.isDirectory
          && path.basename(entry.filePath).toLowerCase() === SUBMOD_FILE);
        fileEntries = fileEntries.concat(filtered);
      }).catch(err => ['ENOENT', 'ENOTFOUND'].includes(err.code)
        ? Promise.resolve()
        : Promise.reject(err));
    } catch (err) {
      // The ability to sort the user's mods using the community
      //  developed metadata is a nice to have - but not a big deal if
      //  we can't do it for whatever reason.
      log('error', 'unable to find submodule files', err);
      return fileEntries;
    }

    return fileEntries;
  }

  private async genDependencyMap(props: IProps): Promise<{ [subModId: string]: ISubModule; }> {
    const { state, enabledMods } = props;
    const stagingFolder = selectors.installPathForGame(state, GAME_ID);
    const depMap: { [subModId: string]: ISubModule } = {};
    for (const modId of Object.keys(enabledMods)) {
      const mod = enabledMods[modId];
      if (mod?.installationPath === undefined) {
        continue;
      }

      const modFolder = path.join(stagingFolder, mod.installationPath);
      const subModFiles = await this.findSubModFiles(modFolder);
      for (const subModFile of subModFiles) {
        const subModData: ISubModule = await this.parseSubModFile(subModFile.filePath);
        if (subModData?.id !== undefined) {
          depMap[subModData.id] = subModData;
        }
      }
    }

    return depMap;
  }
}

export default ComMetadataManager;
