"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.W3Reducer = void 0;
const vortex_api_1 = require("vortex-api");
const actions_1 = require("./actions");
exports.W3Reducer = {
    reducers: {
        [actions_1.setPriorityType]: (state, payload) => {
            return vortex_api_1.util.setSafe(state, ['witcher3', 'prioritytype'], payload);
        },
    },
    defaults: {
        prioritytype: 'prefix-based',
    },
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVkdWNlcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyZWR1Y2Vycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSwyQ0FBeUM7QUFDekMsdUNBQTRDO0FBRy9CLFFBQUEsU0FBUyxHQUF1QjtJQUMzQyxRQUFRLEVBQUU7UUFDUixDQUFDLHlCQUFzQixDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUU7WUFDM0MsT0FBTyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxVQUFVLEVBQUUsY0FBYyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDcEUsQ0FBQztLQUNGO0lBQ0QsUUFBUSxFQUFFO1FBQ1IsWUFBWSxFQUFFLGNBQWM7S0FDN0I7Q0FDRixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuaW1wb3J0IHsgc2V0UHJpb3JpdHlUeXBlIH0gZnJvbSAnLi9hY3Rpb25zJztcclxuXHJcbi8vIHJlZHVjZXJcclxuZXhwb3J0IGNvbnN0IFczUmVkdWNlcjogdHlwZXMuSVJlZHVjZXJTcGVjID0ge1xyXG4gIHJlZHVjZXJzOiB7XHJcbiAgICBbc2V0UHJpb3JpdHlUeXBlIGFzIGFueV06IChzdGF0ZSwgcGF5bG9hZCkgPT4ge1xyXG4gICAgICByZXR1cm4gdXRpbC5zZXRTYWZlKHN0YXRlLCBbJ3dpdGNoZXIzJywgJ3ByaW9yaXR5dHlwZSddLCBwYXlsb2FkKTtcclxuICAgIH0sXHJcbiAgfSxcclxuICBkZWZhdWx0czoge1xyXG4gICAgcHJpb3JpdHl0eXBlOiAncHJlZml4LWJhc2VkJyxcclxuICB9LFxyXG59O1xyXG4iXX0=