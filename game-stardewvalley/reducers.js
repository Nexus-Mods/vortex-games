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
    },
    defaults: {
        useRecommendations: undefined,
    },
};
exports.default = sdvReducers;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVkdWNlcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyZWR1Y2Vycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsbURBQXFDO0FBRXJDLDJDQUF5QztBQU16QyxNQUFNLFdBQVcsR0FBa0M7SUFDakQsUUFBUSxFQUFFO1FBQ1IsQ0FBQyxPQUFPLENBQUMsa0JBQXlCLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsRUFBRTtZQUN0RCxPQUFPLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLG9CQUFvQixDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDOUQsQ0FBQztLQUNGO0lBQ0QsUUFBUSxFQUFFO1FBQ1Isa0JBQWtCLEVBQUUsU0FBUztLQUM5QjtDQUNGLENBQUE7QUFFRCxrQkFBZSxXQUFXLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBhY3Rpb25zIGZyb20gJy4vYWN0aW9ucyc7XHJcblxyXG5pbXBvcnQgeyB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJU3RhdGVTRFYge1xyXG4gIHVzZVJlY29tbWVuZGF0aW9uczogYm9vbGVhbjtcclxufVxyXG5cclxuY29uc3Qgc2R2UmVkdWNlcnM6IHR5cGVzLklSZWR1Y2VyU3BlYzxJU3RhdGVTRFY+ID0ge1xyXG4gIHJlZHVjZXJzOiB7XHJcbiAgICBbYWN0aW9ucy5zZXRSZWNvbW1lbmRhdGlvbnMgYXMgYW55XTogKHN0YXRlLCBwYXlsb2FkKSA9PiB7XHJcbiAgICAgIHJldHVybiB1dGlsLnNldFNhZmUoc3RhdGUsIFsndXNlUmVjb21tZW5kYXRpb25zJ10sIHBheWxvYWQpO1xyXG4gICAgfSxcclxuICB9LFxyXG4gIGRlZmF1bHRzOiB7XHJcbiAgICB1c2VSZWNvbW1lbmRhdGlvbnM6IHVuZGVmaW5lZCxcclxuICB9LFxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBzZHZSZWR1Y2VycztcclxuIl19