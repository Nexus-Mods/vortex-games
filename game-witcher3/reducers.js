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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVkdWNlcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyZWR1Y2Vycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSwyQ0FBeUM7QUFDekMsdUNBQXNFO0FBR3pELFFBQUEsU0FBUyxHQUF1QjtJQUMzQyxRQUFRLEVBQUU7UUFDUixDQUFDLHlCQUFzQixDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUU7WUFDM0MsT0FBTyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxjQUFjLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUN4RCxDQUFDO1FBQ0QsQ0FBQyxrQ0FBK0IsQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxFQUFFO1lBQ3BELE9BQU8saUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsdUJBQXVCLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNqRSxDQUFDO0tBQ0Y7SUFDRCxRQUFRLEVBQUU7UUFDUixZQUFZLEVBQUUsY0FBYztRQUM1QixxQkFBcUIsRUFBRSxLQUFLO0tBQzdCO0NBQ0YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5pbXBvcnQgeyBzZXRQcmlvcml0eVR5cGUsIHNldFN1cHByZXNzTW9kTGltaXRQYXRjaCB9IGZyb20gJy4vYWN0aW9ucyc7XG5cbi8vIHJlZHVjZXJcbmV4cG9ydCBjb25zdCBXM1JlZHVjZXI6IHR5cGVzLklSZWR1Y2VyU3BlYyA9IHtcbiAgcmVkdWNlcnM6IHtcbiAgICBbc2V0UHJpb3JpdHlUeXBlIGFzIGFueV06IChzdGF0ZSwgcGF5bG9hZCkgPT4ge1xuICAgICAgcmV0dXJuIHV0aWwuc2V0U2FmZShzdGF0ZSwgWydwcmlvcml0eXR5cGUnXSwgcGF5bG9hZCk7XG4gICAgfSxcbiAgICBbc2V0U3VwcHJlc3NNb2RMaW1pdFBhdGNoIGFzIGFueV06IChzdGF0ZSwgcGF5bG9hZCkgPT4ge1xuICAgICAgcmV0dXJuIHV0aWwuc2V0U2FmZShzdGF0ZSwgWydzdXBwcmVzc01vZExpbWl0UGF0Y2gnXSwgcGF5bG9hZCk7XG4gICAgfSxcbiAgfSxcbiAgZGVmYXVsdHM6IHtcbiAgICBwcmlvcml0eXR5cGU6ICdwcmVmaXgtYmFzZWQnLFxuICAgIHN1cHByZXNzTW9kTGltaXRQYXRjaDogZmFsc2UsXG4gIH0sXG59O1xuIl19