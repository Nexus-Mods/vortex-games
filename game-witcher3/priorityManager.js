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
            }
            this.mMaxPriority = this.getMaxPriority(props);
        };
        this.getPriority = (item) => {
            var _a;
            const { loadOrder, minPriority } = this.genProps();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJpb3JpdHlNYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicHJpb3JpdHlNYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDJDQUFvRDtBQUVwRCxxQ0FBbUM7QUEwQm5DLE1BQWEsZUFBZTtJQUsxQixZQUFZLEdBQXdCLEVBQUUsWUFBMEI7UUFjekQscUJBQWdCLEdBQUcsR0FBRyxFQUFFO1lBQzdCLE1BQU0sS0FBSyxHQUFXLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUN0QyxJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUU7Z0JBQ3ZCLElBQUksQ0FBQyxZQUFZLEdBQUcsQ0FBQyxDQUFDO2FBQ3ZCO1lBQ0QsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2pELENBQUMsQ0FBQTtRQUVNLGdCQUFXLEdBQUcsQ0FBQyxJQUFpQyxFQUFFLEVBQUU7O1lBQ3pELE1BQU0sRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ25ELE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNoRSxJQUFJLE9BQU8sS0FBSyxTQUFTLEVBQUU7Z0JBQ3pCLElBQUksSUFBSSxDQUFDLGFBQWEsS0FBSyxnQkFBZ0IsRUFBRTtvQkFDM0MsTUFBTSxRQUFRLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7b0JBQzVDLE9BQU8sQ0FBQyxRQUFRLEdBQUcsV0FBVyxDQUFDO3dCQUM3QixDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7aUJBQ3BDO3FCQUFNO29CQUNMLE1BQU0sU0FBUyxHQUFHLENBQUMsT0FBQSxTQUFTLENBQUMsT0FBTyxDQUFDLDBDQUFFLE1BQU0sTUFBSyxTQUFTLENBQUM7d0JBQzVELENBQUMsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsQ0FBQztvQkFDbkUsTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsQ0FBQztvQkFDdEMsSUFBSSxNQUFNLEtBQUssU0FBUyxJQUFJLFNBQVMsR0FBRyxXQUFXLEVBQUU7d0JBQ25ELE9BQU8sU0FBUyxDQUFDO3FCQUNsQjt5QkFBTTt3QkFDTCxPQUFPLENBQUMsTUFBTSxHQUFHLFdBQVcsQ0FBQzs0QkFDM0IsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO3FCQUNsQztpQkFDRjthQUNGO1lBRUQsT0FBTyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7UUFDN0IsQ0FBQyxDQUFBO1FBRU8sYUFBUSxHQUFHLEdBQVcsRUFBRTtZQUM5QixNQUFNLEtBQUssR0FBaUIsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNqRCxNQUFNLFVBQVUsR0FBRyxzQkFBUyxDQUFDLHdCQUF3QixDQUFDLEtBQUssRUFBRSxnQkFBTyxDQUFDLENBQUM7WUFDdEUsSUFBSSxVQUFVLEtBQUssU0FBUyxFQUFFO2dCQUM1QixPQUFPLFNBQVMsQ0FBQzthQUNsQjtZQUNELE1BQU0sT0FBTyxHQUFHLHNCQUFTLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztZQUN6RCxJQUFJLE9BQU8sS0FBSyxTQUFTLEVBQUU7Z0JBQ3pCLE9BQU8sU0FBUyxDQUFDO2FBQ2xCO1lBRUQsTUFBTSxTQUFTLEdBQXlDLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFDeEUsQ0FBQyxZQUFZLEVBQUUsV0FBVyxFQUFFLFVBQVUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBRS9DLE1BQU0sYUFBYSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLHdCQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsMENBQUUsTUFBTSxHQUFBLENBQUMsQ0FBQztZQUNuRixNQUFNLFdBQVcsR0FBRyxhQUFhLENBQUMsTUFBTSxDQUFDO1lBQ3pDLE9BQU8sRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxXQUFXLEVBQUUsQ0FBQztRQUNwRCxDQUFDLENBQUE7UUFFTyxtQkFBYyxHQUFHLENBQUMsS0FBYSxFQUFFLEVBQUU7WUFDekMsTUFBTSxFQUFFLFNBQVMsRUFBRSxXQUFXLEVBQUUsR0FBRyxLQUFLLENBQUM7WUFDekMsT0FBTyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsRUFBRTs7Z0JBQ2pELE1BQU0sU0FBUyxHQUFHLENBQUMsT0FBQSxTQUFTLENBQUMsR0FBRyxDQUFDLDBDQUFFLE1BQU0sTUFBSyxTQUFTLENBQUM7b0JBQ3RELENBQUMsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUM7b0JBQ3JDLENBQUMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDO2dCQUN2QixNQUFNLE1BQU0sR0FBRyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDO2dCQUNsQyxJQUFJLE1BQU0sS0FBSyxTQUFTLEVBQUU7b0JBQ3hCLElBQUksR0FBRyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7d0JBQ3ZCLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztpQkFDdEI7cUJBQU07b0JBQ0wsSUFBSSxHQUFHLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQzt3QkFDcEIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO2lCQUNuQjtnQkFDRCxPQUFPLElBQUksQ0FBQztZQUNkLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUNsQixDQUFDLENBQUE7UUFoRkMsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLENBQUM7UUFDaEIsSUFBSSxDQUFDLGFBQWEsR0FBRyxZQUFZLENBQUM7UUFDbEMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7SUFDMUIsQ0FBQztJQUVELElBQUksWUFBWSxDQUFDLElBQWtCO1FBQ2pDLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDO0lBQzVCLENBQUM7SUFFRCxJQUFJLFlBQVk7UUFDZCxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUM7SUFDNUIsQ0FBQztDQXNFRjtBQXZGRCwwQ0F1RkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgeyBHQU1FX0lEIH0gZnJvbSAnLi9jb21tb24nO1xyXG5cclxuZXhwb3J0IHR5cGUgUHJpb3JpdHlUeXBlID0gJ3Bvc2l0aW9uLWJhc2VkJyB8ICdwcmVmaXgtYmFzZWQnO1xyXG5leHBvcnQgaW50ZXJmYWNlIElMb2FkT3JkZXJFbnRyeSB7XHJcbiAgcG9zOiBudW1iZXI7XHJcbiAgZW5hYmxlZDogYm9vbGVhbjtcclxuICBwcmVmaXg/OiBzdHJpbmc7XHJcbiAgbG9ja2VkPzogYm9vbGVhbjtcclxuICBleHRlcm5hbD86IGJvb2xlYW47XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSUxvYWRPcmRlciB7XHJcbiAgW21vZElkOiBzdHJpbmddOiBJTG9hZE9yZGVyRW50cnk7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSU9mZnNldE1hcCB7XHJcbiAgW29mZnNldDogbnVtYmVyXTogbnVtYmVyO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSVByb3BzIHtcclxuICBzdGF0ZTogdHlwZXMuSVN0YXRlO1xyXG4gIHByb2ZpbGU6IHR5cGVzLklQcm9maWxlO1xyXG4gIGxvYWRPcmRlcjogeyBbbW9kSWQ6IHN0cmluZ106IElMb2FkT3JkZXJFbnRyeSB9O1xyXG4gIG1pblByaW9yaXR5OiBudW1iZXI7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBQcmlvcml0eU1hbmFnZXIge1xyXG4gIHByaXZhdGUgbUFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaTtcclxuICBwcml2YXRlIG1Qcmlvcml0eVR5cGU6IFByaW9yaXR5VHlwZTtcclxuICBwcml2YXRlIG1NYXhQcmlvcml0eTogbnVtYmVyO1xyXG5cclxuICBjb25zdHJ1Y3RvcihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHByaW9yaXR5VHlwZTogUHJpb3JpdHlUeXBlKSB7XHJcbiAgICB0aGlzLm1BcGkgPSBhcGk7XHJcbiAgICB0aGlzLm1Qcmlvcml0eVR5cGUgPSBwcmlvcml0eVR5cGU7XHJcbiAgICB0aGlzLnJlc2V0TWF4UHJpb3JpdHkoKTtcclxuICB9XHJcblxyXG4gIHNldCBwcmlvcml0eVR5cGUodHlwZTogUHJpb3JpdHlUeXBlKSB7XHJcbiAgICB0aGlzLm1Qcmlvcml0eVR5cGUgPSB0eXBlO1xyXG4gIH1cclxuXHJcbiAgZ2V0IHByaW9yaXR5VHlwZSgpIHtcclxuICAgIHJldHVybiB0aGlzLm1Qcmlvcml0eVR5cGU7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgcmVzZXRNYXhQcmlvcml0eSA9ICgpID0+IHtcclxuICAgIGNvbnN0IHByb3BzOiBJUHJvcHMgPSB0aGlzLmdlblByb3BzKCk7XHJcbiAgICBpZiAocHJvcHMgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICB0aGlzLm1NYXhQcmlvcml0eSA9IDA7XHJcbiAgICB9XHJcbiAgICB0aGlzLm1NYXhQcmlvcml0eSA9IHRoaXMuZ2V0TWF4UHJpb3JpdHkocHJvcHMpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldFByaW9yaXR5ID0gKGl0ZW06IHR5cGVzLklMb2FkT3JkZXJEaXNwbGF5SXRlbSkgPT4ge1xyXG4gICAgY29uc3QgeyBsb2FkT3JkZXIsIG1pblByaW9yaXR5IH0gPSB0aGlzLmdlblByb3BzKCk7XHJcbiAgICBjb25zdCBpdGVtS2V5ID0gT2JqZWN0LmtleXMobG9hZE9yZGVyKS5maW5kKHggPT4geCA9PT0gaXRlbS5pZCk7XHJcbiAgICBpZiAoaXRlbUtleSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGlmICh0aGlzLm1Qcmlvcml0eVR5cGUgPT09ICdwb3NpdGlvbi1iYXNlZCcpIHtcclxuICAgICAgICBjb25zdCBwb3NpdGlvbiA9IGxvYWRPcmRlcltpdGVtS2V5XS5wb3MgKyAxO1xyXG4gICAgICAgIHJldHVybiAocG9zaXRpb24gPiBtaW5Qcmlvcml0eSlcclxuICAgICAgICAgID8gcG9zaXRpb24gOiB0aGlzLm1NYXhQcmlvcml0eSsrO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbnN0IHByZWZpeFZhbCA9IChsb2FkT3JkZXJbaXRlbUtleV0/LnByZWZpeCAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgID8gcGFyc2VJbnQobG9hZE9yZGVyW2l0ZW1LZXldLnByZWZpeCwgMTApIDogbG9hZE9yZGVyW2l0ZW1LZXldLnBvcztcclxuICAgICAgICBjb25zdCBwb3NWYWwgPSBsb2FkT3JkZXJbaXRlbUtleV0ucG9zO1xyXG4gICAgICAgIGlmIChwb3NWYWwgIT09IHByZWZpeFZhbCAmJiBwcmVmaXhWYWwgPiBtaW5Qcmlvcml0eSkge1xyXG4gICAgICAgICAgcmV0dXJuIHByZWZpeFZhbDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgcmV0dXJuIChwb3NWYWwgPiBtaW5Qcmlvcml0eSlcclxuICAgICAgICAgICAgPyBwb3NWYWwgOiB0aGlzLm1NYXhQcmlvcml0eSsrO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzLm1NYXhQcmlvcml0eSsrO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBnZW5Qcm9wcyA9ICgpOiBJUHJvcHMgPT4ge1xyXG4gICAgY29uc3Qgc3RhdGU6IHR5cGVzLklTdGF0ZSA9IHRoaXMubUFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgbGFzdFByb2ZJZCA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gICAgaWYgKGxhc3RQcm9mSWQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG4gICAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgbGFzdFByb2ZJZCk7XHJcbiAgICBpZiAocHJvZmlsZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgbG9hZE9yZGVyOiB7IFttb2RJZDogc3RyaW5nXTogSUxvYWRPcmRlckVudHJ5IH0gPSB1dGlsLmdldFNhZmUoc3RhdGUsXHJcbiAgICAgIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBsYXN0UHJvZklkXSwge30pO1xyXG5cclxuICAgIGNvbnN0IGxvY2tlZEVudHJpZXMgPSBPYmplY3Qua2V5cyhsb2FkT3JkZXIpLmZpbHRlcihrZXkgPT4gbG9hZE9yZGVyW2tleV0/LmxvY2tlZCk7XHJcbiAgICBjb25zdCBtaW5Qcmlvcml0eSA9IGxvY2tlZEVudHJpZXMubGVuZ3RoO1xyXG4gICAgcmV0dXJuIHsgc3RhdGUsIHByb2ZpbGUsIGxvYWRPcmRlciwgbWluUHJpb3JpdHkgfTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgZ2V0TWF4UHJpb3JpdHkgPSAocHJvcHM6IElQcm9wcykgPT4ge1xyXG4gICAgY29uc3QgeyBsb2FkT3JkZXIsIG1pblByaW9yaXR5IH0gPSBwcm9wcztcclxuICAgIHJldHVybiBPYmplY3Qua2V5cyhsb2FkT3JkZXIpLnJlZHVjZSgocHJldiwga2V5KSA9PiB7XHJcbiAgICAgIGNvbnN0IHByZWZpeFZhbCA9IChsb2FkT3JkZXJba2V5XT8ucHJlZml4ICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAgPyBwYXJzZUludChsb2FkT3JkZXJba2V5XS5wcmVmaXgsIDEwKVxyXG4gICAgICAgIDogbG9hZE9yZGVyW2tleV0ucG9zO1xyXG4gICAgICBjb25zdCBwb3NWYWwgPSBsb2FkT3JkZXJba2V5XS5wb3M7XHJcbiAgICAgIGlmIChwb3NWYWwgIT09IHByZWZpeFZhbCkge1xyXG4gICAgICAgIHByZXYgPSAocHJlZml4VmFsID4gcHJldilcclxuICAgICAgICAgID8gcHJlZml4VmFsIDogcHJldjtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBwcmV2ID0gKHBvc1ZhbCA+IHByZXYpXHJcbiAgICAgICAgICA/IHBvc1ZhbCA6IHByZXY7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHByZXY7XHJcbiAgICB9LCBtaW5Qcmlvcml0eSk7XHJcbiAgfVxyXG59XHJcbiJdfQ==