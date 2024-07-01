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
const sdvReducers = {
    reducers: {
        [actions.setRecommendations]: (state, payload) => {
            return vortex_api_1.util.setSafe(state, ['useRecommendations'], payload);
        },
        [actions.setMergeConfigs]: (state, payload) => {
            const { profileId, enabled } = payload;
            return vortex_api_1.util.setSafe(state, ['mergeConfigs', profileId], enabled);
        },
    },
    defaults: {
        useRecommendations: undefined,
    },
};
exports.default = sdvReducers;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVkdWNlcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyZWR1Y2Vycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsbURBQXFDO0FBRXJDLDJDQUF5QztBQU16QyxNQUFNLFdBQVcsR0FBa0M7SUFDakQsUUFBUSxFQUFFO1FBQ1IsQ0FBQyxPQUFPLENBQUMsa0JBQXlCLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsRUFBRTtZQUN0RCxPQUFPLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLG9CQUFvQixDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDOUQsQ0FBQztRQUNELENBQUMsT0FBTyxDQUFDLGVBQXNCLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsRUFBRTtZQUNuRCxNQUFNLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxHQUFHLE9BQU8sQ0FBQztZQUN2QyxPQUFPLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLGNBQWMsRUFBRSxTQUFTLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNuRSxDQUFDO0tBQ0Y7SUFDRCxRQUFRLEVBQUU7UUFDUixrQkFBa0IsRUFBRSxTQUFTO0tBQzlCO0NBQ0YsQ0FBQTtBQUVELGtCQUFlLFdBQVcsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGFjdGlvbnMgZnJvbSAnLi9hY3Rpb25zJztcclxuXHJcbmltcG9ydCB7IHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElTdGF0ZVNEViB7XHJcbiAgdXNlUmVjb21tZW5kYXRpb25zOiBib29sZWFuO1xyXG59XHJcblxyXG5jb25zdCBzZHZSZWR1Y2VyczogdHlwZXMuSVJlZHVjZXJTcGVjPElTdGF0ZVNEVj4gPSB7XHJcbiAgcmVkdWNlcnM6IHtcclxuICAgIFthY3Rpb25zLnNldFJlY29tbWVuZGF0aW9ucyBhcyBhbnldOiAoc3RhdGUsIHBheWxvYWQpID0+IHtcclxuICAgICAgcmV0dXJuIHV0aWwuc2V0U2FmZShzdGF0ZSwgWyd1c2VSZWNvbW1lbmRhdGlvbnMnXSwgcGF5bG9hZCk7XHJcbiAgICB9LFxyXG4gICAgW2FjdGlvbnMuc2V0TWVyZ2VDb25maWdzIGFzIGFueV06IChzdGF0ZSwgcGF5bG9hZCkgPT4ge1xyXG4gICAgICBjb25zdCB7IHByb2ZpbGVJZCwgZW5hYmxlZCB9ID0gcGF5bG9hZDtcclxuICAgICAgcmV0dXJuIHV0aWwuc2V0U2FmZShzdGF0ZSwgWydtZXJnZUNvbmZpZ3MnLCBwcm9maWxlSWRdLCBlbmFibGVkKTtcclxuICAgIH0sXHJcbiAgfSxcclxuICBkZWZhdWx0czoge1xyXG4gICAgdXNlUmVjb21tZW5kYXRpb25zOiB1bmRlZmluZWQsXHJcbiAgfSxcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgc2R2UmVkdWNlcnM7XHJcbiJdfQ==