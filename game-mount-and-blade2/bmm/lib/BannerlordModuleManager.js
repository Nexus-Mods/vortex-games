var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./dotnet", "./dotnet"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BannerlordModuleManager = void 0;
    const dotnet_1 = require("./dotnet");
    const dotnet_2 = __importDefault(require("./dotnet"));
    class BannerlordModuleManager {
        static async createAsync() {
            const lib = new BannerlordModuleManager();
            await lib.init();
            return lib;
        }
        async init() {
            const status = (0, dotnet_1.getBootStatus)();
            if (status == dotnet_1.BootStatus.Standby) {
                await (0, dotnet_1.boot)();
            }
        }
        sort(unsorted) {
            return dotnet_2.default.BannerlordModuleManager.Sort(unsorted);
        }
        sortWithOptions(unsorted, options) {
            return dotnet_2.default.BannerlordModuleManager.SortWithOptions(unsorted, options);
        }
        areAllDependenciesOfModulePresent(unsorted, module) {
            return dotnet_2.default.BannerlordModuleManager.AreAllDependenciesOfModulePresent(unsorted, module);
        }
        getDependentModulesOf(source, module) {
            return dotnet_2.default.BannerlordModuleManager.GetDependentModulesOf(source, module);
        }
        getDependentModulesOfWithOptions(source, module, options) {
            return dotnet_2.default.BannerlordModuleManager.GetDependentModulesOfWithOptions(source, module, options);
        }
        getModuleInfo(xml) {
            return dotnet_2.default.BannerlordModuleManager.GetModuleInfo(xml);
        }
        getSubModuleInfo(xml) {
            return dotnet_2.default.BannerlordModuleManager.GetSubModuleInfo(xml);
        }
        compareVersions(x, y) {
            return dotnet_2.default.BannerlordModuleManager.CompareVersions(x, y);
        }
        async dispose() {
            await (0, dotnet_1.terminate)();
        }
    }
    exports.BannerlordModuleManager = BannerlordModuleManager;
});
//# sourceMappingURL=BannerlordModuleManager.js.map