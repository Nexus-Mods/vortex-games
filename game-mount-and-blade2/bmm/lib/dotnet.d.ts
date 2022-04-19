export declare const invoke: <T>(assembly: string, method: string, ...args: any[]) => T;
export declare const invokeAsync: <T>(assembly: string, method: string, ...args: any[]) => Promise<T>;
export declare const createObjectReference: (object: any) => any;
export declare const disposeObjectReference: (objectReference: any) => void;
export declare const createStreamReference: (buffer: Uint8Array | any) => any;
export interface Assembly {
    name: string;
    data: Uint8Array | string;
}
export interface BootData {
    wasm: Uint8Array | string;
    assemblies: Assembly[];
    entryAssemblyName: string;
}
export declare enum BootStatus {
    Standby = "Standby",
    Booting = "Booting",
    Terminating = "Terminating",
    Booted = "Booted"
}
export declare function getBootStatus(): BootStatus;
export declare function boot(): Promise<void>;
export declare function terminate(): Promise<void>;
export declare const BannerlordModuleManager: {
    Sort: (source: any) => any,
    SortWithOptions: (source: any, options: any) => any,
    AreAllDependenciesOfModulePresent: (source: any, module: any) => boolean,
    GetDependentModulesOf: (source: any, module: any) => any,
    GetDependentModulesOfWithOptions: (source: any, module: any, options: any) => any,
    GetModuleInfo: (xmlContent: string) => any,
    GetSubModuleInfo: (xmlContent: string) => any,
    CompareVersions: (x: any, y: any) => number,
};
