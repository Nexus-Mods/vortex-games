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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJpb3JpdHlNYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicHJpb3JpdHlNYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDJDQUFvRDtBQUVwRCxxQ0FBbUM7QUEwQm5DLE1BQWEsZUFBZTtJQUsxQixZQUFZLEdBQXdCLEVBQUUsWUFBMEI7UUFjekQscUJBQWdCLEdBQUcsQ0FBQyxHQUFZLEVBQUUsRUFBRTtZQUN6QyxNQUFNLEtBQUssR0FBVyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3pDLElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRTtnQkFDdkIsSUFBSSxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUM7Z0JBQ3RCLE9BQU87YUFDUjtZQUNELElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNqRCxDQUFDLENBQUE7UUFFTSxnQkFBVyxHQUFHLENBQUMsSUFBaUMsRUFBRSxFQUFFOztZQUN6RCxNQUFNLEtBQUssR0FBVyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDdEMsTUFBTSxFQUFFLFNBQVMsRUFBRSxXQUFXLEVBQUUsR0FBRyxDQUFDLEtBQUssS0FBSyxTQUFTLENBQUM7Z0JBQ3RELENBQUMsQ0FBQyxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUUsV0FBVyxFQUFFLENBQUMsRUFBRTtnQkFDbkMsQ0FBQyxDQUFDLEtBQUssQ0FBQztZQUVWLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNoRSxJQUFJLE9BQU8sS0FBSyxTQUFTLEVBQUU7Z0JBQ3pCLElBQUksSUFBSSxDQUFDLGFBQWEsS0FBSyxnQkFBZ0IsRUFBRTtvQkFDM0MsTUFBTSxRQUFRLEdBQUcsU0FB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QUFDLENBQUMsR0FBRyxDQUFDO2dCQUN2QixNQUFNLE1BQU0sR0FBRyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDO2dCQUNsQyxJQUFJLE1BQU0sS0FBSyxTQUFTLEVBQUU7b0JBQ3hCLElBQUksR0FBRyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7d0JBQ3ZCLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztpQkFDdEI7cUJBQU07b0JBQ0wsSUFBSSxHQUFHLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQzt3QkFDcEIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO2lCQUNuQjtnQkFDRCxPQUFPLElBQUksQ0FBQztZQUNkLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUNsQixDQUFDLENBQUE7UUFyRkMsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLENBQUM7UUFDaEIsSUFBSSxDQUFDLGFBQWEsR0FBRyxZQUFZLENBQUM7UUFDbEMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7SUFDMUIsQ0FBQztJQUVELElBQUksWUFBWSxDQUFDLElBQWtCO1FBQ2pDLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDO0lBQzVCLENBQUM7SUFFRCxJQUFJLFlBQVk7UUFDZCxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUM7SUFDNUIsQ0FBQztDQTJFRjtBQTVGRCwwQ0E0RkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5cbmltcG9ydCB7IEdBTUVfSUQgfSBmcm9tICcuL2NvbW1vbic7XG5cbmV4cG9ydCB0eXBlIFByaW9yaXR5VHlwZSA9ICdwb3NpdGlvbi1iYXNlZCcgfCAncHJlZml4LWJhc2VkJztcbmV4cG9ydCBpbnRlcmZhY2UgSUxvYWRPcmRlckVudHJ5IHtcbiAgcG9zOiBudW1iZXI7XG4gIGVuYWJsZWQ6IGJvb2xlYW47XG4gIHByZWZpeD86IHN0cmluZztcbiAgbG9ja2VkPzogYm9vbGVhbjtcbiAgZXh0ZXJuYWw/OiBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElMb2FkT3JkZXIge1xuICBbbW9kSWQ6IHN0cmluZ106IElMb2FkT3JkZXJFbnRyeTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJT2Zmc2V0TWFwIHtcbiAgW29mZnNldDogbnVtYmVyXTogbnVtYmVyO1xufVxuXG5pbnRlcmZhY2UgSVByb3BzIHtcbiAgc3RhdGU6IHR5cGVzLklTdGF0ZTtcbiAgcHJvZmlsZTogdHlwZXMuSVByb2ZpbGU7XG4gIGxvYWRPcmRlcjogeyBbbW9kSWQ6IHN0cmluZ106IElMb2FkT3JkZXJFbnRyeSB9O1xuICBtaW5Qcmlvcml0eTogbnVtYmVyO1xufVxuXG5leHBvcnQgY2xhc3MgUHJpb3JpdHlNYW5hZ2VyIHtcbiAgcHJpdmF0ZSBtQXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpO1xuICBwcml2YXRlIG1Qcmlvcml0eVR5cGU6IFByaW9yaXR5VHlwZTtcbiAgcHJpdmF0ZSBtTWF4UHJpb3JpdHk6IG51bWJlcjtcblxuICBjb25zdHJ1Y3RvcihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHByaW9yaXR5VHlwZTogUHJpb3JpdHlUeXBlKSB7XG4gICAgdGhpcy5tQXBpID0gYXBpO1xuICAgIHRoaXMubVByaW9yaXR5VHlwZSA9IHByaW9yaXR5VHlwZTtcbiAgICB0aGlzLnJlc2V0TWF4UHJpb3JpdHkoKTtcbiAgfVxuXG4gIHNldCBwcmlvcml0eVR5cGUodHlwZTogUHJpb3JpdHlUeXBlKSB7XG4gICAgdGhpcy5tUHJpb3JpdHlUeXBlID0gdHlwZTtcbiAgfVxuXG4gIGdldCBwcmlvcml0eVR5cGUoKSB7XG4gICAgcmV0dXJuIHRoaXMubVByaW9yaXR5VHlwZTtcbiAgfVxuXG4gIHB1YmxpYyByZXNldE1heFByaW9yaXR5ID0gKG1pbj86IG51bWJlcikgPT4ge1xuICAgIGNvbnN0IHByb3BzOiBJUHJvcHMgPSB0aGlzLmdlblByb3BzKG1pbik7XG4gICAgaWYgKHByb3BzID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMubU1heFByaW9yaXR5ID0gMDtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5tTWF4UHJpb3JpdHkgPSB0aGlzLmdldE1heFByaW9yaXR5KHByb3BzKTtcbiAgfVxuXG4gIHB1YmxpYyBnZXRQcmlvcml0eSA9IChpdGVtOiB0eXBlcy5JTG9hZE9yZGVyRGlzcGxheUl0ZW0pID0+IHtcbiAgICBjb25zdCBwcm9wczogSVByb3BzID0gdGhpcy5nZW5Qcm9wcygpO1xuICAgIGNvbnN0IHsgbG9hZE9yZGVyLCBtaW5Qcmlvcml0eSB9ID0gKHByb3BzID09PSB1bmRlZmluZWQpXG4gICAgICA/IHsgbG9hZE9yZGVyOiB7fSwgbWluUHJpb3JpdHk6IDAgfVxuICAgICAgOiBwcm9wcztcblxuICAgIGNvbnN0IGl0ZW1LZXkgPSBPYmplY3Qua2V5cyhsb2FkT3JkZXIpLmZpbmQoeCA9PiB4ID09PSBpdGVtLmlkKTtcbiAgICBpZiAoaXRlbUtleSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAodGhpcy5tUHJpb3JpdHlUeXBlID09PSAncG9zaXRpb24tYmFzZWQnKSB7XG4gICAgICAgIGNvbnN0IHBvc2l0aW9uID0gbG9hZE9yZGVyW2l0ZW1LZXldLnBvcyArIDE7XG4gICAgICAgIHJldHVybiAocG9zaXRpb24gPiBtaW5Qcmlvcml0eSlcbiAgICAgICAgICA/IHBvc2l0aW9uIDogKyt0aGlzLm1NYXhQcmlvcml0eTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHByZWZpeFZhbCA9IChsb2FkT3JkZXJbaXRlbUtleV0/LnByZWZpeCAhPT0gdW5kZWZpbmVkKVxuICAgICAgICA/IHBhcnNlSW50KGxvYWRPcmRlcltpdGVtS2V5XS5wcmVmaXgsIDEwKSA6IGxvYWRPcmRlcltpdGVtS2V5XS5wb3M7XG4gICAgICAgIGNvbnN0IHBvc1ZhbCA9IGxvYWRPcmRlcltpdGVtS2V5XS5wb3M7XG4gICAgICAgIGlmIChwb3NWYWwgIT09IHByZWZpeFZhbCAmJiBwcmVmaXhWYWwgPiBtaW5Qcmlvcml0eSkge1xuICAgICAgICAgIHJldHVybiBwcmVmaXhWYWw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIChwb3NWYWwgPiBtaW5Qcmlvcml0eSlcbiAgICAgICAgICAgID8gcG9zVmFsIDogKyt0aGlzLm1NYXhQcmlvcml0eTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiArK3RoaXMubU1heFByaW9yaXR5O1xuICB9XG5cbiAgcHJpdmF0ZSBnZW5Qcm9wcyA9IChtaW4/OiBudW1iZXIpOiBJUHJvcHMgPT4ge1xuICAgIGNvbnN0IHN0YXRlOiB0eXBlcy5JU3RhdGUgPSB0aGlzLm1BcGkuZ2V0U3RhdGUoKTtcbiAgICBjb25zdCBsYXN0UHJvZklkID0gc2VsZWN0b3JzLmxhc3RBY3RpdmVQcm9maWxlRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XG4gICAgaWYgKGxhc3RQcm9mSWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgbGFzdFByb2ZJZCk7XG4gICAgaWYgKHByb2ZpbGUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBjb25zdCBsb2FkT3JkZXI6IHsgW21vZElkOiBzdHJpbmddOiBJTG9hZE9yZGVyRW50cnkgfSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcbiAgICAgIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBsYXN0UHJvZklkXSwge30pO1xuXG4gICAgY29uc3QgbG9ja2VkRW50cmllcyA9IE9iamVjdC5rZXlzKGxvYWRPcmRlcikuZmlsdGVyKGtleSA9PiBsb2FkT3JkZXJba2V5XT8ubG9ja2VkKTtcbiAgICBjb25zdCBtaW5Qcmlvcml0eSA9IChtaW4pID8gbWluIDogbG9ja2VkRW50cmllcy5sZW5ndGg7XG4gICAgcmV0dXJuIHsgc3RhdGUsIHByb2ZpbGUsIGxvYWRPcmRlciwgbWluUHJpb3JpdHkgfTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0TWF4UHJpb3JpdHkgPSAocHJvcHM6IElQcm9wcykgPT4ge1xuICAgIGNvbnN0IHsgbG9hZE9yZGVyLCBtaW5Qcmlvcml0eSB9ID0gcHJvcHM7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKGxvYWRPcmRlcikucmVkdWNlKChwcmV2LCBrZXkpID0+IHtcbiAgICAgIGNvbnN0IHByZWZpeFZhbCA9IChsb2FkT3JkZXJba2V5XT8ucHJlZml4ICE9PSB1bmRlZmluZWQpXG4gICAgICAgID8gcGFyc2VJbnQobG9hZE9yZGVyW2tleV0ucHJlZml4LCAxMClcbiAgICAgICAgOiBsb2FkT3JkZXJba2V5XS5wb3M7XG4gICAgICBjb25zdCBwb3NWYWwgPSBsb2FkT3JkZXJba2V5XS5wb3M7XG4gICAgICBpZiAocG9zVmFsICE9PSBwcmVmaXhWYWwpIHtcbiAgICAgICAgcHJldiA9IChwcmVmaXhWYWwgPiBwcmV2KVxuICAgICAgICAgID8gcHJlZml4VmFsIDogcHJldjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHByZXYgPSAocG9zVmFsID4gcHJldilcbiAgICAgICAgICA/IHBvc1ZhbCA6IHByZXY7XG4gICAgICB9XG4gICAgICByZXR1cm4gcHJldjtcbiAgICB9LCBtaW5Qcmlvcml0eSk7XG4gIH1cbn1cbiJdfQ==