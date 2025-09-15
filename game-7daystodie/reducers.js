"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reducer = void 0;
const actions_1 = require("./actions");
const vortex_api_1 = require("vortex-api");
exports.reducer = {
    reducers: {
        [actions_1.setPrefixOffset]: (state, payload) => {
            const { profile, offset } = payload;
            return vortex_api_1.util.setSafe(state, ['prefixOffset', profile], offset);
        },
        [actions_1.setUDF]: (state, payload) => {
            const { udf } = payload;
            return vortex_api_1.util.setSafe(state, ['udf'], udf);
        },
        [actions_1.setPreviousLO]: (state, payload) => {
            const { profile, previousLO } = payload;
            return vortex_api_1.util.setSafe(state, ['previousLO', profile], previousLO);
        }
    },
    defaults: {},
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVkdWNlcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyZWR1Y2Vycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSx1Q0FBbUU7QUFDbkUsMkNBQXlDO0FBQzVCLFFBQUEsT0FBTyxHQUF1QjtJQUN6QyxRQUFRLEVBQUU7UUFDUixDQUFDLHlCQUFzQixDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUU7WUFDM0MsTUFBTSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUM7WUFDcEMsT0FBTyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxjQUFjLEVBQUUsT0FBTyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDaEUsQ0FBQztRQUNELENBQUMsZ0JBQWEsQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxFQUFFO1lBQ2xDLE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBRyxPQUFPLENBQUM7WUFDeEIsT0FBTyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxLQUFLLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUMzQyxDQUFDO1FBQ0QsQ0FBQyx1QkFBb0IsQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxFQUFFO1lBQ3pDLE1BQU0sRUFBRSxPQUFPLEVBQUUsVUFBVSxFQUFFLEdBQUcsT0FBTyxDQUFDO1lBQ3hDLE9BQU8saUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsWUFBWSxFQUFFLE9BQU8sQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQ2xFLENBQUM7S0FDRjtJQUNELFFBQVEsRUFBRSxFQUFFO0NBQ2IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHNldFByZWZpeE9mZnNldCwgc2V0UHJldmlvdXNMTywgc2V0VURGIH0gZnJvbSAnLi9hY3Rpb25zJztcclxuaW1wb3J0IHsgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuZXhwb3J0IGNvbnN0IHJlZHVjZXI6IHR5cGVzLklSZWR1Y2VyU3BlYyA9IHtcclxuICByZWR1Y2Vyczoge1xyXG4gICAgW3NldFByZWZpeE9mZnNldCBhcyBhbnldOiAoc3RhdGUsIHBheWxvYWQpID0+IHtcclxuICAgICAgY29uc3QgeyBwcm9maWxlLCBvZmZzZXQgfSA9IHBheWxvYWQ7XHJcbiAgICAgIHJldHVybiB1dGlsLnNldFNhZmUoc3RhdGUsIFsncHJlZml4T2Zmc2V0JywgcHJvZmlsZV0sIG9mZnNldCk7XHJcbiAgICB9LFxyXG4gICAgW3NldFVERiBhcyBhbnldOiAoc3RhdGUsIHBheWxvYWQpID0+IHtcclxuICAgICAgY29uc3QgeyB1ZGYgfSA9IHBheWxvYWQ7XHJcbiAgICAgIHJldHVybiB1dGlsLnNldFNhZmUoc3RhdGUsIFsndWRmJ10sIHVkZik7XHJcbiAgICB9LFxyXG4gICAgW3NldFByZXZpb3VzTE8gYXMgYW55XTogKHN0YXRlLCBwYXlsb2FkKSA9PiB7XHJcbiAgICAgIGNvbnN0IHsgcHJvZmlsZSwgcHJldmlvdXNMTyB9ID0gcGF5bG9hZDtcclxuICAgICAgcmV0dXJuIHV0aWwuc2V0U2FmZShzdGF0ZSwgWydwcmV2aW91c0xPJywgcHJvZmlsZV0sIHByZXZpb3VzTE8pO1xyXG4gICAgfVxyXG4gIH0sXHJcbiAgZGVmYXVsdHM6IHt9LFxyXG59OyJdfQ==