import { IncomingHttpHeaders } from 'http';

export interface IDeployment { [modTypeId: string]: IDeployedFile[]; }
export interface IDeployedFile {
  relPath: string;
  source: string;
  merged?: string[];
  target?: string;
  time: number;
}

export interface IIncomingGithubHttpHeaders extends IncomingHttpHeaders {
  "x-ratelimit-reset": string;
  "x-ratelimit-remaining": string;
}