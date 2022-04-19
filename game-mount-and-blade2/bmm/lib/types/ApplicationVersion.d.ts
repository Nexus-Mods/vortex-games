import { ApplicationVersionType } from "./ApplicationVersionType";
export declare type ApplicationVersion = {
    applicationVersionType: ApplicationVersionType;
    major: number;
    minor: number;
    revision: number;
    changeSet: number;
};
