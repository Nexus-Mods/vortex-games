import { ApplicationVersion, ModuleInfoExtended, ModuleSorterOptions } from "./types";
export declare class BannerlordModuleManager {
    static createAsync(): Promise<BannerlordModuleManager>;
    private init;
    sort(unsorted: ModuleInfoExtended[]): ModuleInfoExtended[];
    sortWithOptions(unsorted: ModuleInfoExtended[], options: ModuleSorterOptions): ModuleInfoExtended[];
    areAllDependenciesOfModulePresent(unsorted: ModuleInfoExtended[], module: ModuleInfoExtended): boolean;
    getDependentModulesOf(source: ModuleInfoExtended[], module: ModuleInfoExtended): ModuleInfoExtended[];
    getDependentModulesOfWithOptions(source: ModuleInfoExtended[], module: ModuleInfoExtended, options: ModuleSorterOptions): ModuleInfoExtended[];
    getModuleInfo(xml: string): ModuleInfoExtended;
    getSubModuleInfo(xml: string): ModuleInfoExtended;
    compareVersions(x: ApplicationVersion, y: ApplicationVersion): number;
    dispose(): Promise<void>;
}
