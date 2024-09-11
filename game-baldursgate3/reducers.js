"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const actions = __importStar(require("./actions"));
const vortex_api_1 = require("vortex-api");
const reducer = {
    reducers: {
        [actions.setMigration]: (state, payload) => vortex_api_1.util.setSafe(state, ['migration'], payload),
        [actions.setAutoExportLoadOrder]: (state, payload) => vortex_api_1.util.setSafe(state, ['autoExportLoadOrder'], payload),
        [actions.setPlayerProfile]: (state, payload) => vortex_api_1.util.setSafe(state, ['playerProfile'], payload),
        [actions.setBG3ExtensionVersion]: (state, payload) => vortex_api_1.util.setSafe(state, ['extensionVersion'], payload.version),
        [actions.settingsWritten]: (state, payload) => {
            const { profile, time, count } = payload;
            return vortex_api_1.util.setSafe(state, ['settingsWritten', profile], { time, count });
        },
    },
    defaults: {
        migration: true,
        autoExportLoadOrder: true,
        playerProfile: 'global',
        settingsWritten: {},
        extensionVersion: '0.0.0',
    },
};
exports.default = reducer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVkdWNlcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyZWR1Y2Vycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsbURBQXFDO0FBQ3JDLDJDQUF5QztBQUd6QyxNQUFNLE9BQU8sR0FBdUI7SUFDbEMsUUFBUSxFQUFFO1FBQ1IsQ0FBQyxPQUFPLENBQUMsWUFBbUIsQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxFQUFFLENBQUMsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsV0FBVyxDQUFDLEVBQUUsT0FBTyxDQUFDO1FBQzlGLENBQUMsT0FBTyxDQUFDLHNCQUE2QixDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUUsQ0FBQyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQyxFQUFFLE9BQU8sQ0FBQztRQUNsSCxDQUFDLE9BQU8sQ0FBQyxnQkFBdUIsQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxFQUFFLENBQUMsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsZUFBZSxDQUFDLEVBQUUsT0FBTyxDQUFDO1FBQ3RHLENBQUMsT0FBTyxDQUFDLHNCQUE2QixDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUUsQ0FBQyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxPQUFPLENBQUM7UUFDdkgsQ0FBQyxPQUFPLENBQUMsZUFBc0IsQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxFQUFFO1lBQ25ELE1BQU0sRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxHQUFHLE9BQU8sQ0FBQztZQUN6QyxPQUFPLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLGlCQUFpQixFQUFFLE9BQU8sQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7UUFDNUUsQ0FBQztLQUNGO0lBQ0QsUUFBUSxFQUFFO1FBQ1IsU0FBUyxFQUFFLElBQUk7UUFDZixtQkFBbUIsRUFBRSxJQUFJO1FBQ3pCLGFBQWEsRUFBRSxRQUFRO1FBQ3ZCLGVBQWUsRUFBRSxFQUFFO1FBQ25CLGdCQUFnQixFQUFFLE9BQU87S0FDMUI7Q0FDRixDQUFDO0FBR0Ysa0JBQWUsT0FBTyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgYWN0aW9ucyBmcm9tICcuL2FjdGlvbnMnO1xyXG5pbXBvcnQgeyB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuLy8gcmVkdWNlclxyXG5jb25zdCByZWR1Y2VyOiB0eXBlcy5JUmVkdWNlclNwZWMgPSB7XHJcbiAgcmVkdWNlcnM6IHtcclxuICAgIFthY3Rpb25zLnNldE1pZ3JhdGlvbiBhcyBhbnldOiAoc3RhdGUsIHBheWxvYWQpID0+IHV0aWwuc2V0U2FmZShzdGF0ZSwgWydtaWdyYXRpb24nXSwgcGF5bG9hZCksXHJcbiAgICBbYWN0aW9ucy5zZXRBdXRvRXhwb3J0TG9hZE9yZGVyIGFzIGFueV06IChzdGF0ZSwgcGF5bG9hZCkgPT4gdXRpbC5zZXRTYWZlKHN0YXRlLCBbJ2F1dG9FeHBvcnRMb2FkT3JkZXInXSwgcGF5bG9hZCksXHJcbiAgICBbYWN0aW9ucy5zZXRQbGF5ZXJQcm9maWxlIGFzIGFueV06IChzdGF0ZSwgcGF5bG9hZCkgPT4gdXRpbC5zZXRTYWZlKHN0YXRlLCBbJ3BsYXllclByb2ZpbGUnXSwgcGF5bG9hZCksXHJcbiAgICBbYWN0aW9ucy5zZXRCRzNFeHRlbnNpb25WZXJzaW9uIGFzIGFueV06IChzdGF0ZSwgcGF5bG9hZCkgPT4gdXRpbC5zZXRTYWZlKHN0YXRlLCBbJ2V4dGVuc2lvblZlcnNpb24nXSwgcGF5bG9hZC52ZXJzaW9uKSxcclxuICAgIFthY3Rpb25zLnNldHRpbmdzV3JpdHRlbiBhcyBhbnldOiAoc3RhdGUsIHBheWxvYWQpID0+IHtcclxuICAgICAgY29uc3QgeyBwcm9maWxlLCB0aW1lLCBjb3VudCB9ID0gcGF5bG9hZDtcclxuICAgICAgcmV0dXJuIHV0aWwuc2V0U2FmZShzdGF0ZSwgWydzZXR0aW5nc1dyaXR0ZW4nLCBwcm9maWxlXSwgeyB0aW1lLCBjb3VudCB9KTtcclxuICAgIH0sXHJcbiAgfSxcclxuICBkZWZhdWx0czoge1xyXG4gICAgbWlncmF0aW9uOiB0cnVlLFxyXG4gICAgYXV0b0V4cG9ydExvYWRPcmRlcjogdHJ1ZSxcclxuICAgIHBsYXllclByb2ZpbGU6ICdnbG9iYWwnLFxyXG4gICAgc2V0dGluZ3NXcml0dGVuOiB7fSxcclxuICAgIGV4dGVuc2lvblZlcnNpb246ICcwLjAuMCcsXHJcbiAgfSxcclxufTtcclxuXHJcblxyXG5leHBvcnQgZGVmYXVsdCByZWR1Y2VyOyJdfQ==