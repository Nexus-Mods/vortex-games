import { IFileInfo } from '@nexusmods/nexus-api';
import * as https from 'https';
import { ILookupResult, IQuery } from 'modmeta-db';
import { types } from 'vortex-api';
import { GAME_ID } from './common';

const SMAPI_HOST = 'smapi.io';

export interface ISMAPIResult {
  id: string;
  metadata: {
    id: string[],
    name: string,
    nexusID?: number,
    chucklefishID?: number,
    curseForgeID?: number,
    curseForkeKey?: string,
    modDropID?: number,
    gitHubRepo: string,
    customSourceUrl: string,
    customUrl: string,
    main: {
      version?: string,
      url?: string,
    },
    compatibilityStatus: string,
    compatibilitySummary: string,
  },
  "errors": []
}
 
class SMAPIProxy {
  private mAPI: types.IExtensionApi;
  private mOptions: https.RequestOptions;
  constructor(api: types.IExtensionApi) {
    this.mAPI = api;
    this.mOptions = {
      host: SMAPI_HOST,
      method: 'POST',
      protocol: 'https:',
      path: '/api/v3.0/mods',
      headers: {
        'Content-Type': 'application/json',
      },
    };
  }

  public async find(query: IQuery): Promise<ILookupResult[]> {
    if (query.name !== undefined) {
      const res = await this.findByName(query.name);
      if ((res.length === 0) || (res[0].metadata?.main === undefined)) {
        return [];
      }
      const key = this.makeKey(query);
      if (res[0].metadata.nexusID !== undefined) {
        return await this.lookupOnNexus(
          query, res[0].metadata.nexusID, res[0].metadata.main.version);
      } else {
        console.log('returning third-party dependency info');
        return [
          { key, value: {
            gameId: GAME_ID,
            fileMD5: undefined,
            fileName: query.name,
            fileSizeBytes: 0,
            fileVersion: '',
            sourceURI: res[0].metadata.main?.url,
          } },
        ];
      }

     
    } else {
      throw new Error('only lookup by logical name supported at this time');
    }
  }

  private makeKey(query: IQuery): string {
    return `smapio:${query.name}:${query.versionMatch}`;    
  }

  private async lookupOnNexus(query: IQuery,
                              nexusId: number,
                              version: string)
                              : Promise<ILookupResult[]> {
    const file: IFileInfo = (await this.mAPI.emitAndAwait('get-latest-file', nexusId, GAME_ID, `>=${version}`))[0];
    if (file === undefined) {
      throw new Error('no file found');
    }
    return [{
      key: this.makeKey(query),
      value: {
        fileMD5: undefined,
        fileName: file.file_name,
        fileSizeBytes: file.size * 1024,
        fileVersion: file.version,
        gameId: GAME_ID,
        sourceURI: `nxm://${GAME_ID}/mods/${nexusId}/files/${file.file_id}`,
        logicalFileName: query.name,
        source: 'nexus',
        domainName: GAME_ID,
        details: {
          category: file.category_id.toString(),
          description: file.description,
          modId: nexusId.toString(),
          fileId: file.file_id.toString(),
        }
      },
    }];
  }

  private async findByName(name: string): Promise<ISMAPIResult[]> {
    return new Promise((resolve, reject) => {
      const req = https.request(this.mOptions, res => {
        let body = Buffer.from([]);
        res
          .on('error', err => reject(err))
          .on('data', chunk => {
            body = Buffer.concat([body, chunk]);
          })
          .on('end', () => resolve(JSON.parse(body.toString('utf8'))));
      })
        .on('error', err => reject(err))
      req.write(JSON.stringify({
        mods: [{ "id": name }],
        "includeExtendedMetadata": true,
      }));
      req.end();
    });
  }
}

export default SMAPIProxy;
