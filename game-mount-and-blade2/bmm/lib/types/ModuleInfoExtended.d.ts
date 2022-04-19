import { DependentModuleMetadata } from "./DependentModuleMetadata";
import { ModuleInfo } from "./ModuleInfo";
export interface ModuleInfoExtended extends ModuleInfo {
    url: string;
    dependentModuleMetadatas: readonly DependentModuleMetadata[];
}
