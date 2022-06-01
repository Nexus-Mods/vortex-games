export interface IDeployment { [modTypeId: string]: IDeployedFile[]; }
export interface IDeployedFile {
  relPath: string;
  source: string;
  merged?: string[];
  target?: string;
  time: number;
}
