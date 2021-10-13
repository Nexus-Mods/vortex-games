export interface IPakInfo {
  type: string;
  uuid: string;
  md5: string;
  version: string;
  name: string;
  folder: string;
  author: string;
  description: string;
  isListed: boolean;
}

export interface ILoadOrderEntry {
  pos: number;
  enabled: boolean;
  prefix?: string;
  data?: IPakInfo;
}

export interface IXmlNode<AttributeT extends object> {
  $: AttributeT;
}

export interface IAttribute extends IXmlNode<{ id: string, type: string, value: string }> {}

export interface IModNode extends IXmlNode<{ id: 'Module' | 'ModuleShortDesc' }> {
  attribute: IAttribute[];
}

export interface IRootNode extends IXmlNode<{ id: 'Mods' | 'ModOrder' }> {
  children?: [{ node: IModNode[] }];
  attribute?: IAttribute[];
}

export interface IRegionNode extends IXmlNode<{ id: 'root' }> {
  children: [{ node: IRootNode[] }];
}

export interface IRegion extends IXmlNode<{ id: 'ModuleSettings' | 'Config' }> {
  node: IRegionNode[];
}

export interface IModSettings {
  save: {
    header: IXmlNode<{ version: string }>;
    version: IXmlNode<{ major: string, minor: string, revision: string, build: string }>;
    region: IRegion[];
  };
}
