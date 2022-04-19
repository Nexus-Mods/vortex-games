import { ApplicationVersion } from "./ApplicationVersion";
import { DependentModule } from "./DependentModule";
import { SubModuleInfo } from "./SubModuleInfo";
export declare type ModuleInfo = {
    id: string;
    name: string;
    isOfficial: boolean;
    version: ApplicationVersion;
    isSingleplayerModule: boolean;
    isMultiplayerModule: boolean;
    subModules: readonly SubModuleInfo[];
    dependentModules: readonly DependentModule[];
};
