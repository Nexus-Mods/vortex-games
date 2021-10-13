import * as xml from 'libxmljs';
import path from 'path';
import turbowalk, { IEntry } from 'turbowalk';
import { fs, log, selectors, types, util } from 'vortex-api';

import { GAME_ID, SUBMOD_FILE } from './common';
import { IDependency, IProps, ISubModule } from './types';
import { genProps, getXMLData } from './util';

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

  public sort(loadOrder: string[]): string[] {
    const sorted = [ ...loadOrder ].sort((lhs, rhs) => {
      const testDeps = (deps: IDependency[], subModId: string): number => {
        if (deps !== undefined) {
          const match = deps.find(dep => dep.id === subModId);
          if (match !== undefined) {
            return (match.order !== undefined)
              ? match.order === 'LoadAfterThis'
                ? -1 : 1
              : 0;
          } else {
            return 0;
          }
        }
      };
      const lhsDeps = this.mDependencyMap[lhs]?.dependencies;
      const rhsDeps = this.mDependencyMap[rhs]?.dependencies;
      const lhsRes = testDeps(lhsDeps, rhs);
      if (lhsRes !== 0) {
        return lhsRes;
      }
      const rhsRes = testDeps(rhsDeps, lhs);
      if (rhsRes !== 0) {
        return rhsRes;
      }
      return 0;
    });
    return sorted;
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
    const getAttributeValue = async (node: any, attrib: string, optional: boolean = true) => {
      try {
        const value = node.attr(attrib).value();
        return Promise.resolve(value);
      } catch (err) {
        return optional
          ? Promise.resolve(undefined)
          : Promise.reject(new Error(`missing ${attrib}`));
      }
    };

    let subModId;
    let dependencies: IDependency[] = [];
    try {
      const data = await getXMLData(filePath);
      subModId = data.get<xml.Element>('//Id').attr('value').value();
      const depNodes = data.find(`//${DEP_XML_ELEMENT}`);
      dependencies = await depNodes.reduce(async (accumP: any, node: any) => {
        const accum = await accumP;
        try {
          const dep: IDependency = {
            id: await getAttributeValue(node, 'id', false),
            optional: await getAttributeValue(node, 'optional') === 'true',
            order: await getAttributeValue(node, 'order'),
            version: await getAttributeValue(node, 'version'),
            incompatible: await getAttributeValue(node, 'incompatible') === 'true',
          };
          accum.push(dep);
        } catch (err) {
          log('error', 'unable to parse community dependency', err);
        }
        return accum;
      }, []);
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
