import { SubModuleTags } from "./SubModuleTags";
export declare type SubModuleInfo = {
    name: string;
    dllName: string;
    assemblies: readonly string[];
    subModuleClassType: string;
    tags: {
        [index: string]: SubModuleTags;
    };
};
