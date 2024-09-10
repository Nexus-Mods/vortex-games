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
        [actions.setBG3ExtensionVersion]: (state, payload) => vortex_api_1.util.setSafe(state, ['extensionVersion'], payload),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVkdWNlcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyZWR1Y2Vycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsbURBQXFDO0FBQ3JDLDJDQUF5QztBQUd6QyxNQUFNLE9BQU8sR0FBdUI7SUFDbEMsUUFBUSxFQUFFO1FBQ1IsQ0FBQyxPQUFPLENBQUMsWUFBbUIsQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxFQUFFLENBQUMsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsV0FBVyxDQUFDLEVBQUUsT0FBTyxDQUFDO1FBQzlGLENBQUMsT0FBTyxDQUFDLHNCQUE2QixDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUUsQ0FBQyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQyxFQUFFLE9BQU8sQ0FBQztRQUNsSCxDQUFDLE9BQU8sQ0FBQyxnQkFBdUIsQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxFQUFFLENBQUMsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsZUFBZSxDQUFDLEVBQUUsT0FBTyxDQUFDO1FBQ3RHLENBQUMsT0FBTyxDQUFDLHNCQUE2QixDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUUsQ0FBQyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLE9BQU8sQ0FBQztRQUMvRyxDQUFDLE9BQU8sQ0FBQyxlQUFzQixDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUU7WUFDbkQsTUFBTSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEdBQUcsT0FBTyxDQUFDO1lBQ3pDLE9BQU8saUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsaUJBQWlCLEVBQUUsT0FBTyxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUM1RSxDQUFDO0tBQ0Y7SUFDRCxRQUFRLEVBQUU7UUFDUixTQUFTLEVBQUUsSUFBSTtRQUNmLG1CQUFtQixFQUFFLElBQUk7UUFDekIsYUFBYSxFQUFFLFFBQVE7UUFDdkIsZUFBZSxFQUFFLEVBQUU7UUFDbkIsZ0JBQWdCLEVBQUUsT0FBTztLQUMxQjtDQUNGLENBQUM7QUFHRixrQkFBZSxPQUFPLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBhY3Rpb25zIGZyb20gJy4vYWN0aW9ucyc7XHJcbmltcG9ydCB7IHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG4vLyByZWR1Y2VyXHJcbmNvbnN0IHJlZHVjZXI6IHR5cGVzLklSZWR1Y2VyU3BlYyA9IHtcclxuICByZWR1Y2Vyczoge1xyXG4gICAgW2FjdGlvbnMuc2V0TWlncmF0aW9uIGFzIGFueV06IChzdGF0ZSwgcGF5bG9hZCkgPT4gdXRpbC5zZXRTYWZlKHN0YXRlLCBbJ21pZ3JhdGlvbiddLCBwYXlsb2FkKSxcclxuICAgIFthY3Rpb25zLnNldEF1dG9FeHBvcnRMb2FkT3JkZXIgYXMgYW55XTogKHN0YXRlLCBwYXlsb2FkKSA9PiB1dGlsLnNldFNhZmUoc3RhdGUsIFsnYXV0b0V4cG9ydExvYWRPcmRlciddLCBwYXlsb2FkKSxcclxuICAgIFthY3Rpb25zLnNldFBsYXllclByb2ZpbGUgYXMgYW55XTogKHN0YXRlLCBwYXlsb2FkKSA9PiB1dGlsLnNldFNhZmUoc3RhdGUsIFsncGxheWVyUHJvZmlsZSddLCBwYXlsb2FkKSxcclxuICAgIFthY3Rpb25zLnNldEJHM0V4dGVuc2lvblZlcnNpb24gYXMgYW55XTogKHN0YXRlLCBwYXlsb2FkKSA9PiB1dGlsLnNldFNhZmUoc3RhdGUsIFsnZXh0ZW5zaW9uVmVyc2lvbiddLCBwYXlsb2FkKSxcclxuICAgIFthY3Rpb25zLnNldHRpbmdzV3JpdHRlbiBhcyBhbnldOiAoc3RhdGUsIHBheWxvYWQpID0+IHtcclxuICAgICAgY29uc3QgeyBwcm9maWxlLCB0aW1lLCBjb3VudCB9ID0gcGF5bG9hZDtcclxuICAgICAgcmV0dXJuIHV0aWwuc2V0U2FmZShzdGF0ZSwgWydzZXR0aW5nc1dyaXR0ZW4nLCBwcm9maWxlXSwgeyB0aW1lLCBjb3VudCB9KTtcclxuICAgIH0sXHJcbiAgfSxcclxuICBkZWZhdWx0czoge1xyXG4gICAgbWlncmF0aW9uOiB0cnVlLFxyXG4gICAgYXV0b0V4cG9ydExvYWRPcmRlcjogdHJ1ZSxcclxuICAgIHBsYXllclByb2ZpbGU6ICdnbG9iYWwnLFxyXG4gICAgc2V0dGluZ3NXcml0dGVuOiB7fSxcclxuICAgIGV4dGVuc2lvblZlcnNpb246ICcwLjAuMCcsXHJcbiAgfSxcclxufTtcclxuXHJcblxyXG5leHBvcnQgZGVmYXVsdCByZWR1Y2VyOyJdfQ==