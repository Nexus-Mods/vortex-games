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
    },
    defaults: {
        prioritytype: 'prefix-based',
    },
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVkdWNlcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyZWR1Y2Vycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSwyQ0FBeUM7QUFDekMsdUNBQTRDO0FBRy9CLFFBQUEsU0FBUyxHQUF1QjtJQUMzQyxRQUFRLEVBQUU7UUFDUixDQUFDLHlCQUFzQixDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUU7WUFDM0MsT0FBTyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxjQUFjLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUN4RCxDQUFDO0tBQ0Y7SUFDRCxRQUFRLEVBQUU7UUFDUixZQUFZLEVBQUUsY0FBYztLQUM3QjtDQUNGLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5pbXBvcnQgeyBzZXRQcmlvcml0eVR5cGUgfSBmcm9tICcuL2FjdGlvbnMnO1xyXG5cclxuLy8gcmVkdWNlclxyXG5leHBvcnQgY29uc3QgVzNSZWR1Y2VyOiB0eXBlcy5JUmVkdWNlclNwZWMgPSB7XHJcbiAgcmVkdWNlcnM6IHtcclxuICAgIFtzZXRQcmlvcml0eVR5cGUgYXMgYW55XTogKHN0YXRlLCBwYXlsb2FkKSA9PiB7XHJcbiAgICAgIHJldHVybiB1dGlsLnNldFNhZmUoc3RhdGUsIFsncHJpb3JpdHl0eXBlJ10sIHBheWxvYWQpO1xyXG4gICAgfSxcclxuICB9LFxyXG4gIGRlZmF1bHRzOiB7XHJcbiAgICBwcmlvcml0eXR5cGU6ICdwcmVmaXgtYmFzZWQnLFxyXG4gIH0sXHJcbn07XHJcbiJdfQ==