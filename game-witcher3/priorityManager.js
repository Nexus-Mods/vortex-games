"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriorityManager = void 0;
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
class PriorityManager {
    constructor(api, priorityType) {
        this.resetMaxPriority = () => {
            const props = this.genProps();
            if (props === undefined) {
                this.mMaxPriority = 0;
                return;
            }
            this.mMaxPriority = this.getMaxPriority(props);
        };
        this.getPriority = (item) => {
            var _a;
            const props = this.genProps();
            const { loadOrder, minPriority } = (props === undefined)
                ? { loadOrder: {}, minPriority: 0 }
                : props;
            const itemKey = Object.keys(loadOrder).find(x => x === item.id);
            if (itemKey !== undefined) {
                if (this.mPriorityType === 'position-based') {
                    const position = loadOrder[itemKey].pos + 1;
                    return (position > minPriority)
                        ? position : this.mMaxPriority++;
                }
                else {
                    const prefixVal = (((_a = loadOrder[itemKey]) === null || _a === void 0 ? void 0 : _a.prefix) !== undefined)
                        ? parseInt(loadOrder[itemKey].prefix, 10) : loadOrder[itemKey].pos;
                    const posVal = loadOrder[itemKey].pos;
                    if (posVal !== prefixVal && prefixVal > minPriority) {
                        return prefixVal;
                    }
                    else {
                        return (posVal > minPriority)
                            ? posVal : this.mMaxPriority++;
                    }
                }
            }
            return this.mMaxPriority++;
        };
        this.genProps = () => {
            const state = this.mApi.getState();
            const lastProfId = vortex_api_1.selectors.lastActiveProfileForGame(state, common_1.GAME_ID);
            if (lastProfId === undefined) {
                return undefined;
            }
            const profile = vortex_api_1.selectors.profileById(state, lastProfId);
            if (profile === undefined) {
                return undefined;
            }
            const loadOrder = vortex_api_1.util.getSafe(state, ['persistent', 'loadOrder', lastProfId], {});
            const lockedEntries = Object.keys(loadOrder).filter(key => { var _a; return (_a = loadOrder[key]) === null || _a === void 0 ? void 0 : _a.locked; });
            const minPriority = lockedEntries.length;
            return { state, profile, loadOrder, minPriority };
        };
        this.getMaxPriority = (props) => {
            const { loadOrder, minPriority } = props;
            return Object.keys(loadOrder).reduce((prev, key) => {
                var _a;
                const prefixVal = (((_a = loadOrder[key]) === null || _a === void 0 ? void 0 : _a.prefix) !== undefined)
                    ? parseInt(loadOrder[key].prefix, 10)
                    : loadOrder[key].pos;
                const posVal = loadOrder[key].pos;
                if (posVal !== prefixVal) {
                    prev = (prefixVal > prev)
                        ? prefixVal : prev;
                }
                else {
                    prev = (posVal > prev)
                        ? posVal : prev;
                }
                return prev;
            }, minPriority);
        };
        this.mApi = api;
        this.mPriorityType = priorityType;
        this.resetMaxPriority();
    }
    set priorityType(type) {
        this.mPriorityType = type;
    }
    get priorityType() {
        return this.mPriorityType;
    }
}
exports.PriorityManager = PriorityManager;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJpb3JpdHlNYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicHJpb3JpdHlNYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDJDQUFvRDtBQUVwRCxxQ0FBbUM7QUEwQm5DLE1BQWEsZUFBZTtJQUsxQixZQUFZLEdBQXdCLEVBQUUsWUFBMEI7UUFjekQscUJBQWdCLEdBQUcsR0FBRyxFQUFFO1lBQzdCLE1BQU0sS0FBSyxHQUFXLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUN0QyxJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUU7Z0JBQ3ZCLElBQUksQ0FBQyxZQUFZLEdBQUcsQ0FBQyxDQUFDO2dCQUN0QixPQUFPO2FBQ1I7WUFDRCxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDakQsQ0FBQyxDQUFBO1FBRU0sZ0JBQVcsR0FBRyxDQUFDLElBQWlDLEVBQUUsRUFBRTs7WUFDekQsTUFBTSxLQUFLLEdBQVcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3RDLE1BQU0sRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLEdBQUcsQ0FBQyxLQUFLLEtBQUssU0FBUyxDQUFDO2dCQUN0RCxDQUFDLENBQUMsRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFFLFdBQVcsRUFBRSxDQUFDLEVBQUU7Z0JBQ25DLENBQUMsQ0FBQyxLQUFLLENBQUM7WUFFVixNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDaEUsSUFBSSxPQUFPLEtBQUssU0FBUyxFQUFFO2dCQUN6QixJQUFJLElBQUksQ0FBQyxhQUFhLEtBQUssZ0JBQWdCLEVBQUU7b0JBQzNDLE1BQU0sUUFBUSxHQUFHLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDO29CQUM1QyxPQUFPLENBQUMsUUFBUSxHQUFHLFdBQVcsQ0FBQzt3QkFDN0IsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO2lCQUNwQztxQkFBTTtvQkFDTCxNQUFNLFNBQVMsR0FBRyxDQUFDLE9BQUEsU0FBUyxDQUFDLE9BQU8sQ0FBQywwQ0FBRSxNQUFNLE1BQUssU0FBUyxDQUFDO3dCQUM1RCxDQUFDLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFHLENBQUM7b0JBQ25FLE1BQU0sTUFBTSxHQUFHLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFHLENBQUM7b0JBQ3RDLElBQUksTUFBTSxLQUFLLFNBQVMsSUFBSSxTQUFTLEdBQUcsV0FBVyxFQUFFO3dCQUNuRCxPQUFPLFNBQVMsQ0FBQztxQkFDbEI7eUJBQU07d0JBQ0wsT0FBTyxDQUFDLE1BQU0sR0FBRyxXQUFXLENBQUM7NEJBQzNCLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztxQkFDbEM7aUJBQ0Y7YUFDRjtZQUVELE9BQU8sSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1FBQzdCLENBQUMsQ0FBQTtRQUVPLGFBQVEsR0FBRyxHQUFXLEVBQUU7WUFDOUIsTUFBTSxLQUFLLEdBQWlCLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDakQsTUFBTSxVQUFVLEdBQUcsc0JBQVMsQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLEVBQUUsZ0JBQU8sQ0FBQyxDQUFDO1lBQ3RFLElBQUksVUFBVSxLQUFLLFNBQVMsRUFBRTtnQkFDNUIsT0FBTyxTQUFTLENBQUM7YUFDbEI7WUFDRCxNQUFNLE9BQU8sR0FBRyxzQkFBUyxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDekQsSUFBSSxPQUFPLEtBQUssU0FBUyxFQUFFO2dCQUN6QixPQUFPLFNBQVMsQ0FBQzthQUNsQjtZQUVELE1BQU0sU0FBUyxHQUF5QyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQ3hFLENBQUMsWUFBWSxFQUFFLFdBQVcsRUFBRSxVQUFVLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUUvQyxNQUFNLGFBQWEsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSx3QkFBQyxTQUFTLENBQUMsR0FBRyxDQUFDLDBDQUFFLE1BQU0sR0FBQSxDQUFDLENBQUM7WUFDbkYsTUFBTSxXQUFXLEdBQUcsYUFBYSxDQUFDLE1BQU0sQ0FBQztZQUN6QyxPQUFPLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLENBQUM7UUFDcEQsQ0FBQyxDQUFBO1FBRU8sbUJBQWMsR0FBRyxDQUFDLEtBQWEsRUFBRSxFQUFFO1lBQ3pDLE1BQU0sRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLEdBQUcsS0FBSyxDQUFDO1lBQ3pDLE9BQU8sTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLEVBQUU7O2dCQUNqRCxNQUFNLFNBQVMsR0FBRyxDQUFDLE9BQUEsU0FBUyxDQUFDLEdBQUcsQ0FBQywwQ0FBRSxNQUFNLE1BQUssU0FBUyxDQUFDO29CQUN0RCxDQUFDLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO29CQUNyQyxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQztnQkFDdkIsTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQztnQkFDbEMsSUFBSSxNQUFNLEtBQUssU0FBUyxFQUFFO29CQUN4QixJQUFJLEdBQUcsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO3dCQUN2QixDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7aUJBQ3RCO3FCQUFNO29CQUNMLElBQUksR0FBRyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7d0JBQ3BCLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztpQkFDbkI7Z0JBQ0QsT0FBTyxJQUFJLENBQUM7WUFDZCxDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDbEIsQ0FBQyxDQUFBO1FBckZDLElBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDO1FBQ2hCLElBQUksQ0FBQyxhQUFhLEdBQUcsWUFBWSxDQUFDO1FBQ2xDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0lBQzFCLENBQUM7SUFFRCxJQUFJLFlBQVksQ0FBQyxJQUFrQjtRQUNqQyxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztJQUM1QixDQUFDO0lBRUQsSUFBSSxZQUFZO1FBQ2QsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDO0lBQzVCLENBQUM7Q0EyRUY7QUE1RkQsMENBNEZDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuaW1wb3J0IHsgR0FNRV9JRCB9IGZyb20gJy4vY29tbW9uJztcclxuXHJcbmV4cG9ydCB0eXBlIFByaW9yaXR5VHlwZSA9ICdwb3NpdGlvbi1iYXNlZCcgfCAncHJlZml4LWJhc2VkJztcclxuZXhwb3J0IGludGVyZmFjZSBJTG9hZE9yZGVyRW50cnkge1xyXG4gIHBvczogbnVtYmVyO1xyXG4gIGVuYWJsZWQ6IGJvb2xlYW47XHJcbiAgcHJlZml4Pzogc3RyaW5nO1xyXG4gIGxvY2tlZD86IGJvb2xlYW47XHJcbiAgZXh0ZXJuYWw/OiBib29sZWFuO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElMb2FkT3JkZXIge1xyXG4gIFttb2RJZDogc3RyaW5nXTogSUxvYWRPcmRlckVudHJ5O1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElPZmZzZXRNYXAge1xyXG4gIFtvZmZzZXQ6IG51bWJlcl06IG51bWJlcjtcclxufVxyXG5cclxuaW50ZXJmYWNlIElQcm9wcyB7XHJcbiAgc3RhdGU6IHR5cGVzLklTdGF0ZTtcclxuICBwcm9maWxlOiB0eXBlcy5JUHJvZmlsZTtcclxuICBsb2FkT3JkZXI6IHsgW21vZElkOiBzdHJpbmddOiBJTG9hZE9yZGVyRW50cnkgfTtcclxuICBtaW5Qcmlvcml0eTogbnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgUHJpb3JpdHlNYW5hZ2VyIHtcclxuICBwcml2YXRlIG1BcGk6IHR5cGVzLklFeHRlbnNpb25BcGk7XHJcbiAgcHJpdmF0ZSBtUHJpb3JpdHlUeXBlOiBQcmlvcml0eVR5cGU7XHJcbiAgcHJpdmF0ZSBtTWF4UHJpb3JpdHk6IG51bWJlcjtcclxuXHJcbiAgY29uc3RydWN0b3IoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBwcmlvcml0eVR5cGU6IFByaW9yaXR5VHlwZSkge1xyXG4gICAgdGhpcy5tQXBpID0gYXBpO1xyXG4gICAgdGhpcy5tUHJpb3JpdHlUeXBlID0gcHJpb3JpdHlUeXBlO1xyXG4gICAgdGhpcy5yZXNldE1heFByaW9yaXR5KCk7XHJcbiAgfVxyXG5cclxuICBzZXQgcHJpb3JpdHlUeXBlKHR5cGU6IFByaW9yaXR5VHlwZSkge1xyXG4gICAgdGhpcy5tUHJpb3JpdHlUeXBlID0gdHlwZTtcclxuICB9XHJcblxyXG4gIGdldCBwcmlvcml0eVR5cGUoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5tUHJpb3JpdHlUeXBlO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHJlc2V0TWF4UHJpb3JpdHkgPSAoKSA9PiB7XHJcbiAgICBjb25zdCBwcm9wczogSVByb3BzID0gdGhpcy5nZW5Qcm9wcygpO1xyXG4gICAgaWYgKHByb3BzID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgdGhpcy5tTWF4UHJpb3JpdHkgPSAwO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICB0aGlzLm1NYXhQcmlvcml0eSA9IHRoaXMuZ2V0TWF4UHJpb3JpdHkocHJvcHMpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldFByaW9yaXR5ID0gKGl0ZW06IHR5cGVzLklMb2FkT3JkZXJEaXNwbGF5SXRlbSkgPT4ge1xyXG4gICAgY29uc3QgcHJvcHM6IElQcm9wcyA9IHRoaXMuZ2VuUHJvcHMoKTtcclxuICAgIGNvbnN0IHsgbG9hZE9yZGVyLCBtaW5Qcmlvcml0eSB9ID0gKHByb3BzID09PSB1bmRlZmluZWQpXHJcbiAgICAgID8geyBsb2FkT3JkZXI6IHt9LCBtaW5Qcmlvcml0eTogMCB9XHJcbiAgICAgIDogcHJvcHM7XHJcblxyXG4gICAgY29uc3QgaXRlbUtleSA9IE9iamVjdC5rZXlzKGxvYWRPcmRlcikuZmluZCh4ID0+IHggPT09IGl0ZW0uaWQpO1xyXG4gICAgaWYgKGl0ZW1LZXkgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBpZiAodGhpcy5tUHJpb3JpdHlUeXBlID09PSAncG9zaXRpb24tYmFzZWQnKSB7XHJcbiAgICAgICAgY29uc3QgcG9zaXRpb24gPSBsb2FkT3JkZXJbaXRlbUtleV0ucG9zICsgMTtcclxuICAgICAgICByZXR1cm4gKHBvc2l0aW9uID4gbWluUHJpb3JpdHkpXHJcbiAgICAgICAgICA/IHBvc2l0aW9uIDogdGhpcy5tTWF4UHJpb3JpdHkrKztcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBjb25zdCBwcmVmaXhWYWwgPSAobG9hZE9yZGVyW2l0ZW1LZXldPy5wcmVmaXggIT09IHVuZGVmaW5lZClcclxuICAgICAgICA/IHBhcnNlSW50KGxvYWRPcmRlcltpdGVtS2V5XS5wcmVmaXgsIDEwKSA6IGxvYWRPcmRlcltpdGVtS2V5XS5wb3M7XHJcbiAgICAgICAgY29uc3QgcG9zVmFsID0gbG9hZE9yZGVyW2l0ZW1LZXldLnBvcztcclxuICAgICAgICBpZiAocG9zVmFsICE9PSBwcmVmaXhWYWwgJiYgcHJlZml4VmFsID4gbWluUHJpb3JpdHkpIHtcclxuICAgICAgICAgIHJldHVybiBwcmVmaXhWYWw7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHJldHVybiAocG9zVmFsID4gbWluUHJpb3JpdHkpXHJcbiAgICAgICAgICAgID8gcG9zVmFsIDogdGhpcy5tTWF4UHJpb3JpdHkrKztcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcy5tTWF4UHJpb3JpdHkrKztcclxuICB9XHJcblxyXG4gIHByaXZhdGUgZ2VuUHJvcHMgPSAoKTogSVByb3BzID0+IHtcclxuICAgIGNvbnN0IHN0YXRlOiB0eXBlcy5JU3RhdGUgPSB0aGlzLm1BcGkuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGxhc3RQcm9mSWQgPSBzZWxlY3RvcnMubGFzdEFjdGl2ZVByb2ZpbGVGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICAgIGlmIChsYXN0UHJvZklkID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH1cclxuICAgIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIGxhc3RQcm9mSWQpO1xyXG4gICAgaWYgKHByb2ZpbGUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGxvYWRPcmRlcjogeyBbbW9kSWQ6IHN0cmluZ106IElMb2FkT3JkZXJFbnRyeSB9ID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxyXG4gICAgICBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgbGFzdFByb2ZJZF0sIHt9KTtcclxuXHJcbiAgICBjb25zdCBsb2NrZWRFbnRyaWVzID0gT2JqZWN0LmtleXMobG9hZE9yZGVyKS5maWx0ZXIoa2V5ID0+IGxvYWRPcmRlcltrZXldPy5sb2NrZWQpO1xyXG4gICAgY29uc3QgbWluUHJpb3JpdHkgPSBsb2NrZWRFbnRyaWVzLmxlbmd0aDtcclxuICAgIHJldHVybiB7IHN0YXRlLCBwcm9maWxlLCBsb2FkT3JkZXIsIG1pblByaW9yaXR5IH07XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGdldE1heFByaW9yaXR5ID0gKHByb3BzOiBJUHJvcHMpID0+IHtcclxuICAgIGNvbnN0IHsgbG9hZE9yZGVyLCBtaW5Qcmlvcml0eSB9ID0gcHJvcHM7XHJcbiAgICByZXR1cm4gT2JqZWN0LmtleXMobG9hZE9yZGVyKS5yZWR1Y2UoKHByZXYsIGtleSkgPT4ge1xyXG4gICAgICBjb25zdCBwcmVmaXhWYWwgPSAobG9hZE9yZGVyW2tleV0/LnByZWZpeCAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgID8gcGFyc2VJbnQobG9hZE9yZGVyW2tleV0ucHJlZml4LCAxMClcclxuICAgICAgICA6IGxvYWRPcmRlcltrZXldLnBvcztcclxuICAgICAgY29uc3QgcG9zVmFsID0gbG9hZE9yZGVyW2tleV0ucG9zO1xyXG4gICAgICBpZiAocG9zVmFsICE9PSBwcmVmaXhWYWwpIHtcclxuICAgICAgICBwcmV2ID0gKHByZWZpeFZhbCA+IHByZXYpXHJcbiAgICAgICAgICA/IHByZWZpeFZhbCA6IHByZXY7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcHJldiA9IChwb3NWYWwgPiBwcmV2KVxyXG4gICAgICAgICAgPyBwb3NWYWwgOiBwcmV2O1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBwcmV2O1xyXG4gICAgfSwgbWluUHJpb3JpdHkpO1xyXG4gIH1cclxufVxyXG4iXX0=