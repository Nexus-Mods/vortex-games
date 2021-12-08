"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriorityManager = void 0;
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
class PriorityManager {
    constructor(api, priorityType) {
        this.resetMaxPriority = (min) => {
            const props = this.genProps(min);
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
                        ? position : ++this.mMaxPriority;
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
                            ? posVal : ++this.mMaxPriority;
                    }
                }
            }
            return ++this.mMaxPriority;
        };
        this.genProps = (min) => {
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
            const minPriority = (min) ? min : lockedEntries.length;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJpb3JpdHlNYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicHJpb3JpdHlNYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDJDQUFvRDtBQUVwRCxxQ0FBbUM7QUEwQm5DLE1BQWEsZUFBZTtJQUsxQixZQUFZLEdBQXdCLEVBQUUsWUFBMEI7UUFjekQscUJBQWdCLEdBQUcsQ0FBQyxHQUFZLEVBQUUsRUFBRTtZQUN6QyxNQUFNLEtBQUssR0FBVyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3pDLElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRTtnQkFDdkIsSUFBSSxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUM7Z0JBQ3RCLE9BQU87YUFDUjtZQUNELElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNqRCxDQUFDLENBQUE7UUFFTSxnQkFBVyxHQUFHLENBQUMsSUFBaUMsRUFBRSxFQUFFOztZQUN6RCxNQUFNLEtBQUssR0FBVyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDdEMsTUFBTSxFQUFFLFNBQVMsRUFBRSxXQUFXLEVBQUUsR0FBRyxDQUFDLEtBQUssS0FBSyxTQUFTLENBQUM7Z0JBQ3RELENBQUMsQ0FBQyxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUUsV0FBVyxFQUFFLENBQUMsRUFBRTtnQkFDbkMsQ0FBQyxDQUFDLEtBQUssQ0FBQztZQUVWLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNoRSxJQUFJLE9BQU8sS0FBSyxTQUFTLEVBQUU7Z0JBQ3pCLElBQUksSUFBSSxDQUFDLGFBQWEsS0FBSyxnQkFBZ0IsRUFBRTtvQkFDM0MsTUFBTSxRQUFRLEdBQUcsU0FB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QUFDLENBQUMsR0FBRyxDQUFDO2dCQUN2QixNQUFNLE1BQU0sR0FBRyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDO2dCQUNsQyxJQUFJLE1BQU0sS0FBSyxTQUFTLEVBQUU7b0JBQ3hCLElBQUksR0FBRyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7d0JBQ3ZCLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztpQkFDdEI7cUJBQU07b0JBQ0wsSUFBSSxHQUFHLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQzt3QkFDcEIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO2lCQUNuQjtnQkFDRCxPQUFPLElBQUksQ0FBQztZQUNkLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUNsQixDQUFDLENBQUE7UUFyRkMsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLENBQUM7UUFDaEIsSUFBSSxDQUFDLGFBQWEsR0FBRyxZQUFZLENBQUM7UUFDbEMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7SUFDMUIsQ0FBQztJQUVELElBQUksWUFBWSxDQUFDLElBQWtCO1FBQ2pDLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDO0lBQzVCLENBQUM7SUFFRCxJQUFJLFlBQVk7UUFDZCxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUM7SUFDNUIsQ0FBQztDQTJFRjtBQTVGRCwwQ0E0RkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgeyBHQU1FX0lEIH0gZnJvbSAnLi9jb21tb24nO1xyXG5cclxuZXhwb3J0IHR5cGUgUHJpb3JpdHlUeXBlID0gJ3Bvc2l0aW9uLWJhc2VkJyB8ICdwcmVmaXgtYmFzZWQnO1xyXG5leHBvcnQgaW50ZXJmYWNlIElMb2FkT3JkZXJFbnRyeSB7XHJcbiAgcG9zOiBudW1iZXI7XHJcbiAgZW5hYmxlZDogYm9vbGVhbjtcclxuICBwcmVmaXg/OiBzdHJpbmc7XHJcbiAgbG9ja2VkPzogYm9vbGVhbjtcclxuICBleHRlcm5hbD86IGJvb2xlYW47XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSUxvYWRPcmRlciB7XHJcbiAgW21vZElkOiBzdHJpbmddOiBJTG9hZE9yZGVyRW50cnk7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSU9mZnNldE1hcCB7XHJcbiAgW29mZnNldDogbnVtYmVyXTogbnVtYmVyO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSVByb3BzIHtcclxuICBzdGF0ZTogdHlwZXMuSVN0YXRlO1xyXG4gIHByb2ZpbGU6IHR5cGVzLklQcm9maWxlO1xyXG4gIGxvYWRPcmRlcjogeyBbbW9kSWQ6IHN0cmluZ106IElMb2FkT3JkZXJFbnRyeSB9O1xyXG4gIG1pblByaW9yaXR5OiBudW1iZXI7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBQcmlvcml0eU1hbmFnZXIge1xyXG4gIHByaXZhdGUgbUFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaTtcclxuICBwcml2YXRlIG1Qcmlvcml0eVR5cGU6IFByaW9yaXR5VHlwZTtcclxuICBwcml2YXRlIG1NYXhQcmlvcml0eTogbnVtYmVyO1xyXG5cclxuICBjb25zdHJ1Y3RvcihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHByaW9yaXR5VHlwZTogUHJpb3JpdHlUeXBlKSB7XHJcbiAgICB0aGlzLm1BcGkgPSBhcGk7XHJcbiAgICB0aGlzLm1Qcmlvcml0eVR5cGUgPSBwcmlvcml0eVR5cGU7XHJcbiAgICB0aGlzLnJlc2V0TWF4UHJpb3JpdHkoKTtcclxuICB9XHJcblxyXG4gIHNldCBwcmlvcml0eVR5cGUodHlwZTogUHJpb3JpdHlUeXBlKSB7XHJcbiAgICB0aGlzLm1Qcmlvcml0eVR5cGUgPSB0eXBlO1xyXG4gIH1cclxuXHJcbiAgZ2V0IHByaW9yaXR5VHlwZSgpIHtcclxuICAgIHJldHVybiB0aGlzLm1Qcmlvcml0eVR5cGU7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgcmVzZXRNYXhQcmlvcml0eSA9IChtaW4/OiBudW1iZXIpID0+IHtcclxuICAgIGNvbnN0IHByb3BzOiBJUHJvcHMgPSB0aGlzLmdlblByb3BzKG1pbik7XHJcbiAgICBpZiAocHJvcHMgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICB0aGlzLm1NYXhQcmlvcml0eSA9IDA7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHRoaXMubU1heFByaW9yaXR5ID0gdGhpcy5nZXRNYXhQcmlvcml0eShwcm9wcyk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0UHJpb3JpdHkgPSAoaXRlbTogdHlwZXMuSUxvYWRPcmRlckRpc3BsYXlJdGVtKSA9PiB7XHJcbiAgICBjb25zdCBwcm9wczogSVByb3BzID0gdGhpcy5nZW5Qcm9wcygpO1xyXG4gICAgY29uc3QgeyBsb2FkT3JkZXIsIG1pblByaW9yaXR5IH0gPSAocHJvcHMgPT09IHVuZGVmaW5lZClcclxuICAgICAgPyB7IGxvYWRPcmRlcjoge30sIG1pblByaW9yaXR5OiAwIH1cclxuICAgICAgOiBwcm9wcztcclxuXHJcbiAgICBjb25zdCBpdGVtS2V5ID0gT2JqZWN0LmtleXMobG9hZE9yZGVyKS5maW5kKHggPT4geCA9PT0gaXRlbS5pZCk7XHJcbiAgICBpZiAoaXRlbUtleSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGlmICh0aGlzLm1Qcmlvcml0eVR5cGUgPT09ICdwb3NpdGlvbi1iYXNlZCcpIHtcclxuICAgICAgICBjb25zdCBwb3NpdGlvbiA9IGxvYWRPcmRlcltpdGVtS2V5XS5wb3MgKyAxO1xyXG4gICAgICAgIHJldHVybiAocG9zaXRpb24gPiBtaW5Qcmlvcml0eSlcclxuICAgICAgICAgID8gcG9zaXRpb24gOiArK3RoaXMubU1heFByaW9yaXR5O1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbnN0IHByZWZpeFZhbCA9IChsb2FkT3JkZXJbaXRlbUtleV0/LnByZWZpeCAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgID8gcGFyc2VJbnQobG9hZE9yZGVyW2l0ZW1LZXldLnByZWZpeCwgMTApIDogbG9hZE9yZGVyW2l0ZW1LZXldLnBvcztcclxuICAgICAgICBjb25zdCBwb3NWYWwgPSBsb2FkT3JkZXJbaXRlbUtleV0ucG9zO1xyXG4gICAgICAgIGlmIChwb3NWYWwgIT09IHByZWZpeFZhbCAmJiBwcmVmaXhWYWwgPiBtaW5Qcmlvcml0eSkge1xyXG4gICAgICAgICAgcmV0dXJuIHByZWZpeFZhbDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgcmV0dXJuIChwb3NWYWwgPiBtaW5Qcmlvcml0eSlcclxuICAgICAgICAgICAgPyBwb3NWYWwgOiArK3RoaXMubU1heFByaW9yaXR5O1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiArK3RoaXMubU1heFByaW9yaXR5O1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBnZW5Qcm9wcyA9IChtaW4/OiBudW1iZXIpOiBJUHJvcHMgPT4ge1xyXG4gICAgY29uc3Qgc3RhdGU6IHR5cGVzLklTdGF0ZSA9IHRoaXMubUFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgbGFzdFByb2ZJZCA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gICAgaWYgKGxhc3RQcm9mSWQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG4gICAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgbGFzdFByb2ZJZCk7XHJcbiAgICBpZiAocHJvZmlsZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgbG9hZE9yZGVyOiB7IFttb2RJZDogc3RyaW5nXTogSUxvYWRPcmRlckVudHJ5IH0gPSB1dGlsLmdldFNhZmUoc3RhdGUsXHJcbiAgICAgIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBsYXN0UHJvZklkXSwge30pO1xyXG5cclxuICAgIGNvbnN0IGxvY2tlZEVudHJpZXMgPSBPYmplY3Qua2V5cyhsb2FkT3JkZXIpLmZpbHRlcihrZXkgPT4gbG9hZE9yZGVyW2tleV0/LmxvY2tlZCk7XHJcbiAgICBjb25zdCBtaW5Qcmlvcml0eSA9IChtaW4pID8gbWluIDogbG9ja2VkRW50cmllcy5sZW5ndGg7XHJcbiAgICByZXR1cm4geyBzdGF0ZSwgcHJvZmlsZSwgbG9hZE9yZGVyLCBtaW5Qcmlvcml0eSB9O1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBnZXRNYXhQcmlvcml0eSA9IChwcm9wczogSVByb3BzKSA9PiB7XHJcbiAgICBjb25zdCB7IGxvYWRPcmRlciwgbWluUHJpb3JpdHkgfSA9IHByb3BzO1xyXG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKGxvYWRPcmRlcikucmVkdWNlKChwcmV2LCBrZXkpID0+IHtcclxuICAgICAgY29uc3QgcHJlZml4VmFsID0gKGxvYWRPcmRlcltrZXldPy5wcmVmaXggIT09IHVuZGVmaW5lZClcclxuICAgICAgICA/IHBhcnNlSW50KGxvYWRPcmRlcltrZXldLnByZWZpeCwgMTApXHJcbiAgICAgICAgOiBsb2FkT3JkZXJba2V5XS5wb3M7XHJcbiAgICAgIGNvbnN0IHBvc1ZhbCA9IGxvYWRPcmRlcltrZXldLnBvcztcclxuICAgICAgaWYgKHBvc1ZhbCAhPT0gcHJlZml4VmFsKSB7XHJcbiAgICAgICAgcHJldiA9IChwcmVmaXhWYWwgPiBwcmV2KVxyXG4gICAgICAgICAgPyBwcmVmaXhWYWwgOiBwcmV2O1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHByZXYgPSAocG9zVmFsID4gcHJldilcclxuICAgICAgICAgID8gcG9zVmFsIDogcHJldjtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gcHJldjtcclxuICAgIH0sIG1pblByaW9yaXR5KTtcclxuICB9XHJcbn1cclxuIl19