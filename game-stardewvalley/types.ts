export interface ISDVModManifest {
  Name: string;
  Author: string;
  Version: string;
  Description: string;
  UniqueID: string;
  EntryDll: string;
  MinimumApiVersion: string;
  UpdateKeys: string[];
  ContentPackFor?: ISDVDependency;
  Dependencies: ISDVDependency[]
}

export interface ISDVDependency {
  UniqueID: string;
  MinimumVersion?: string;
  IsRequired?: boolean;
}
