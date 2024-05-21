"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.W3Reducer = void 0;
const vortex_api_1 = require("vortex-api");
const actions_1 = require("./actions");
exports.W3Reducer = {
    reducers: {
        [actions_1.setPriorityType]: (state, payload) => {
            return vortex_api_1.util.setSafe(state, ['prioritytype'], payload);
        },
        [actions_1.setSuppressModLimitPatch]: (state, payload) => {
            return vortex_api_1.util.setSafe(state, ['suppressModLimitPatch'], payload);
        },
    },
    defaults: {
        prioritytype: 'prefix-based',
        suppressModLimitPatch: false,
    },
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVkdWNlcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyZWR1Y2Vycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSwyQ0FBeUM7QUFDekMsdUNBQXNFO0FBR3pELFFBQUEsU0FBUyxHQUF1QjtJQUMzQyxRQUFRLEVBQUU7UUFDUixDQUFDLHlCQUFzQixDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUU7WUFDM0MsT0FBTyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxjQUFjLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUN4RCxDQUFDO1FBQ0QsQ0FBQyxrQ0FBK0IsQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxFQUFFO1lBQ3BELE9BQU8saUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsdUJBQXVCLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNqRSxDQUFDO0tBQ0Y7SUFDRCxRQUFRLEVBQUU7UUFDUixZQUFZLEVBQUUsY0FBYztRQUM1QixxQkFBcUIsRUFBRSxLQUFLO0tBQzdCO0NBQ0YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcbmltcG9ydCB7IHNldFByaW9yaXR5VHlwZSwgc2V0U3VwcHJlc3NNb2RMaW1pdFBhdGNoIH0gZnJvbSAnLi9hY3Rpb25zJztcclxuXHJcbi8vIHJlZHVjZXJcclxuZXhwb3J0IGNvbnN0IFczUmVkdWNlcjogdHlwZXMuSVJlZHVjZXJTcGVjID0ge1xyXG4gIHJlZHVjZXJzOiB7XHJcbiAgICBbc2V0UHJpb3JpdHlUeXBlIGFzIGFueV06IChzdGF0ZSwgcGF5bG9hZCkgPT4ge1xyXG4gICAgICByZXR1cm4gdXRpbC5zZXRTYWZlKHN0YXRlLCBbJ3ByaW9yaXR5dHlwZSddLCBwYXlsb2FkKTtcclxuICAgIH0sXHJcbiAgICBbc2V0U3VwcHJlc3NNb2RMaW1pdFBhdGNoIGFzIGFueV06IChzdGF0ZSwgcGF5bG9hZCkgPT4ge1xyXG4gICAgICByZXR1cm4gdXRpbC5zZXRTYWZlKHN0YXRlLCBbJ3N1cHByZXNzTW9kTGltaXRQYXRjaCddLCBwYXlsb2FkKTtcclxuICAgIH0sXHJcbiAgfSxcclxuICBkZWZhdWx0czoge1xyXG4gICAgcHJpb3JpdHl0eXBlOiAncHJlZml4LWJhc2VkJyxcclxuICAgIHN1cHByZXNzTW9kTGltaXRQYXRjaDogZmFsc2UsXHJcbiAgfSxcclxufTtcclxuIl19