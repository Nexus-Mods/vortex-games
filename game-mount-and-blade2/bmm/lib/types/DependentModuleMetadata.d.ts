import { ApplicationVersion } from "./ApplicationVersion";
import { ApplicationVersionRange } from "./ApplicationVersionRange";
import { LoadType } from "./LoadType";
export interface DependentModuleMetadata {
    id: string;
    loadType: LoadType;
    isOptional: boolean;
    isIncompatible: boolean;
    version: ApplicationVersion;
    versionRange: ApplicationVersionRange;
}
