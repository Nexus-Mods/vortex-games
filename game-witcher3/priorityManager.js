"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriorityManager = void 0;
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const migrations_1 = require("./migrations");
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
            var _a, _b, _c, _d;
            const props = this.genProps();
            const { loadOrder, minPriority } = (props === undefined)
                ? { loadOrder: [], minPriority: 0 }
                : props;
            const itemIdx = loadOrder.findIndex(x => x.id === item.id);
            if (itemIdx !== -1) {
                if (this.mPriorityType === 'position-based') {
                    const position = itemIdx + 1;
                    return (position > minPriority)
                        ? position : ++this.mMaxPriority;
                }
                else {
                    const prefixVal = (_c = (_b = (_a = loadOrder[itemIdx]) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.prefix) !== null && _c !== void 0 ? _c : (_d = loadOrder[itemIdx]) === null || _d === void 0 ? void 0 : _d['prefix'];
                    const intVal = prefixVal !== undefined
                        ? parseInt(prefixVal, 10)
                        : itemIdx;
                    const posVal = itemIdx;
                    if (posVal !== intVal && intVal > minPriority) {
                        return intVal;
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
            const loadOrder = (0, migrations_1.getPersistentLoadOrder)(this.mApi);
            const lockedEntries = Object.keys(loadOrder).filter(key => { var _a; return (_a = loadOrder[key]) === null || _a === void 0 ? void 0 : _a.locked; });
            const minPriority = (min) ? min : lockedEntries.length;
            return { state, profile, loadOrder, minPriority };
        };
        this.getMaxPriority = (props) => {
            const { loadOrder, minPriority } = props;
            return Object.keys(loadOrder).reduce((prev, key) => {
                var _a, _b, _c, _d;
                const prefixVal = (_c = (_b = (_a = loadOrder[key]) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.prefix) !== null && _c !== void 0 ? _c : (_d = loadOrder[key]) === null || _d === void 0 ? void 0 : _d.prefix;
                const intVal = prefixVal !== undefined
                    ? parseInt(loadOrder[key].prefix, 10)
                    : loadOrder[key].pos;
                const posVal = loadOrder[key].pos;
                if (posVal !== intVal) {
                    prev = (intVal > prev)
                        ? intVal : prev;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJpb3JpdHlNYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicHJpb3JpdHlNYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLDJDQUE4QztBQUU5QyxxQ0FBbUM7QUFDbkMsNkNBQXNEO0FBZXRELE1BQWEsZUFBZTtJQUsxQixZQUFZLEdBQXdCLEVBQUUsWUFBMEI7UUFjekQscUJBQWdCLEdBQUcsQ0FBQyxHQUFZLEVBQUUsRUFBRTtZQUN6QyxNQUFNLEtBQUssR0FBVyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3pDLElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRTtnQkFDdkIsSUFBSSxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUM7Z0JBQ3RCLE9BQU87YUFDUjtZQUNELElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNqRCxDQUFDLENBQUE7UUFFTSxnQkFBVyxHQUFHLENBQUMsSUFBMkIsRUFBRSxFQUFFOztZQUNuRCxNQUFNLEtBQUssR0FBVyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDdEMsTUFBTSxFQUFFLFNBQVMsRUFBRSxXQUFXLEVBQUUsR0FBRyxDQUFDLEtBQUssS0FBSyxTQUFTLENBQUM7Z0JBQ3RELENBQUMsQ0FBQyxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUUsV0FBVyxFQUFFLENBQUMsRUFBRTtnQkFDbkMsQ0FBQyxDQUFDLEtBQUssQ0FBQztZQUVWLE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUMzRCxJQUFJLE9BQU8sS0FBSyxDQUFDLENBQUMsRUFBRTtnQkFDbEIsSUFBSSxJQUFJLENBQUMsYUFBYSxLQUFLLGdCQUFnQixFQUFFO29CQUMzQyxNQUFNLFFBQVEsR0FBRyxP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LENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQztnQkFDdkIsTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQztnQkFDbEMsSUFBSSxNQUFNLEtBQUssTUFBTSxFQUFFO29CQUNyQixJQUFJLEdBQUcsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO3dCQUNwQixDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7aUJBQ25CO3FCQUFNO29CQUNMLElBQUksR0FBRyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7d0JBQ3BCLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztpQkFDbkI7Z0JBQ0QsT0FBTyxJQUFJLENBQUM7WUFDZCxDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDbEIsQ0FBQyxDQUFBO1FBdkZDLElBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDO1FBQ2hCLElBQUksQ0FBQyxhQUFhLEdBQUcsWUFBWSxDQUFDO1FBQ2xDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0lBQzFCLENBQUM7SUFFRCxJQUFJLFlBQVksQ0FBQyxJQUFrQjtRQUNqQyxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztJQUM1QixDQUFDO0lBRUQsSUFBSSxZQUFZO1FBQ2QsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDO0lBQzVCLENBQUM7Q0E2RUY7QUE5RkQsMENBOEZDIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cclxuaW1wb3J0IHsgc2VsZWN0b3JzLCB0eXBlcyB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuaW1wb3J0IHsgR0FNRV9JRCB9IGZyb20gJy4vY29tbW9uJztcclxuaW1wb3J0IHsgZ2V0UGVyc2lzdGVudExvYWRPcmRlciB9IGZyb20gJy4vbWlncmF0aW9ucyc7XHJcblxyXG5leHBvcnQgdHlwZSBQcmlvcml0eVR5cGUgPSAncG9zaXRpb24tYmFzZWQnIHwgJ3ByZWZpeC1iYXNlZCc7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElPZmZzZXRNYXAge1xyXG4gIFtvZmZzZXQ6IG51bWJlcl06IG51bWJlcjtcclxufVxyXG5cclxuaW50ZXJmYWNlIElQcm9wcyB7XHJcbiAgc3RhdGU6IHR5cGVzLklTdGF0ZTtcclxuICBwcm9maWxlOiB0eXBlcy5JUHJvZmlsZTtcclxuICBsb2FkT3JkZXI6IHR5cGVzLkxvYWRPcmRlcjtcclxuICBtaW5Qcmlvcml0eTogbnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgUHJpb3JpdHlNYW5hZ2VyIHtcclxuICBwcml2YXRlIG1BcGk6IHR5cGVzLklFeHRlbnNpb25BcGk7XHJcbiAgcHJpdmF0ZSBtUHJpb3JpdHlUeXBlOiBQcmlvcml0eVR5cGU7XHJcbiAgcHJpdmF0ZSBtTWF4UHJpb3JpdHk6IG51bWJlcjtcclxuXHJcbiAgY29uc3RydWN0b3IoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBwcmlvcml0eVR5cGU6IFByaW9yaXR5VHlwZSkge1xyXG4gICAgdGhpcy5tQXBpID0gYXBpO1xyXG4gICAgdGhpcy5tUHJpb3JpdHlUeXBlID0gcHJpb3JpdHlUeXBlO1xyXG4gICAgdGhpcy5yZXNldE1heFByaW9yaXR5KCk7XHJcbiAgfVxyXG5cclxuICBzZXQgcHJpb3JpdHlUeXBlKHR5cGU6IFByaW9yaXR5VHlwZSkge1xyXG4gICAgdGhpcy5tUHJpb3JpdHlUeXBlID0gdHlwZTtcclxuICB9XHJcblxyXG4gIGdldCBwcmlvcml0eVR5cGUoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5tUHJpb3JpdHlUeXBlO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHJlc2V0TWF4UHJpb3JpdHkgPSAobWluPzogbnVtYmVyKSA9PiB7XHJcbiAgICBjb25zdCBwcm9wczogSVByb3BzID0gdGhpcy5nZW5Qcm9wcyhtaW4pO1xyXG4gICAgaWYgKHByb3BzID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgdGhpcy5tTWF4UHJpb3JpdHkgPSAwO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICB0aGlzLm1NYXhQcmlvcml0eSA9IHRoaXMuZ2V0TWF4UHJpb3JpdHkocHJvcHMpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldFByaW9yaXR5ID0gKGl0ZW06IHR5cGVzLklMb2FkT3JkZXJFbnRyeSkgPT4ge1xyXG4gICAgY29uc3QgcHJvcHM6IElQcm9wcyA9IHRoaXMuZ2VuUHJvcHMoKTtcclxuICAgIGNvbnN0IHsgbG9hZE9yZGVyLCBtaW5Qcmlvcml0eSB9ID0gKHByb3BzID09PSB1bmRlZmluZWQpXHJcbiAgICAgID8geyBsb2FkT3JkZXI6IFtdLCBtaW5Qcmlvcml0eTogMCB9XHJcbiAgICAgIDogcHJvcHM7XHJcblxyXG4gICAgY29uc3QgaXRlbUlkeCA9IGxvYWRPcmRlci5maW5kSW5kZXgoeCA9PiB4LmlkID09PSBpdGVtLmlkKTtcclxuICAgIGlmIChpdGVtSWR4ICE9PSAtMSkge1xyXG4gICAgICBpZiAodGhpcy5tUHJpb3JpdHlUeXBlID09PSAncG9zaXRpb24tYmFzZWQnKSB7XHJcbiAgICAgICAgY29uc3QgcG9zaXRpb24gPSBpdGVtSWR4ICsgMTtcclxuICAgICAgICByZXR1cm4gKHBvc2l0aW9uID4gbWluUHJpb3JpdHkpXHJcbiAgICAgICAgICA/IHBvc2l0aW9uIDogKyt0aGlzLm1NYXhQcmlvcml0eTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBjb25zdCBwcmVmaXhWYWwgPSBsb2FkT3JkZXJbaXRlbUlkeF0/LmRhdGE/LnByZWZpeCA/PyBsb2FkT3JkZXJbaXRlbUlkeF0/LlsncHJlZml4J107XHJcbiAgICAgICAgY29uc3QgaW50VmFsID0gcHJlZml4VmFsICE9PSB1bmRlZmluZWRcclxuICAgICAgICAgID8gcGFyc2VJbnQocHJlZml4VmFsLCAxMClcclxuICAgICAgICAgIDogaXRlbUlkeDtcclxuICAgICAgICBjb25zdCBwb3NWYWwgPSBpdGVtSWR4O1xyXG4gICAgICAgIGlmIChwb3NWYWwgIT09IGludFZhbCAmJiBpbnRWYWwgPiBtaW5Qcmlvcml0eSkge1xyXG4gICAgICAgICAgcmV0dXJuIGludFZhbDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgcmV0dXJuIChwb3NWYWwgPiBtaW5Qcmlvcml0eSlcclxuICAgICAgICAgICAgPyBwb3NWYWwgOiArK3RoaXMubU1heFByaW9yaXR5O1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiArK3RoaXMubU1heFByaW9yaXR5O1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBnZW5Qcm9wcyA9IChtaW4/OiBudW1iZXIpOiBJUHJvcHMgPT4ge1xyXG4gICAgY29uc3Qgc3RhdGU6IHR5cGVzLklTdGF0ZSA9IHRoaXMubUFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgbGFzdFByb2ZJZCA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gICAgaWYgKGxhc3RQcm9mSWQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG4gICAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgbGFzdFByb2ZJZCk7XHJcbiAgICBpZiAocHJvZmlsZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgbG9hZE9yZGVyOiB0eXBlcy5Mb2FkT3JkZXIgPSBnZXRQZXJzaXN0ZW50TG9hZE9yZGVyKHRoaXMubUFwaSk7XHJcblxyXG4gICAgY29uc3QgbG9ja2VkRW50cmllcyA9IE9iamVjdC5rZXlzKGxvYWRPcmRlcikuZmlsdGVyKGtleSA9PiBsb2FkT3JkZXJba2V5XT8ubG9ja2VkKTtcclxuICAgIGNvbnN0IG1pblByaW9yaXR5ID0gKG1pbikgPyBtaW4gOiBsb2NrZWRFbnRyaWVzLmxlbmd0aDtcclxuICAgIHJldHVybiB7IHN0YXRlLCBwcm9maWxlLCBsb2FkT3JkZXIsIG1pblByaW9yaXR5IH07XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGdldE1heFByaW9yaXR5ID0gKHByb3BzOiBJUHJvcHMpID0+IHtcclxuICAgIGNvbnN0IHsgbG9hZE9yZGVyLCBtaW5Qcmlvcml0eSB9ID0gcHJvcHM7XHJcbiAgICByZXR1cm4gT2JqZWN0LmtleXMobG9hZE9yZGVyKS5yZWR1Y2UoKHByZXYsIGtleSkgPT4ge1xyXG4gICAgICBjb25zdCBwcmVmaXhWYWwgPSBsb2FkT3JkZXJba2V5XT8uZGF0YT8ucHJlZml4ID8/IGxvYWRPcmRlcltrZXldPy5wcmVmaXg7XHJcbiAgICAgIGNvbnN0IGludFZhbCA9IHByZWZpeFZhbCAhPT0gdW5kZWZpbmVkXHJcbiAgICAgICAgPyBwYXJzZUludChsb2FkT3JkZXJba2V5XS5wcmVmaXgsIDEwKVxyXG4gICAgICAgIDogbG9hZE9yZGVyW2tleV0ucG9zO1xyXG4gICAgICBjb25zdCBwb3NWYWwgPSBsb2FkT3JkZXJba2V5XS5wb3M7XHJcbiAgICAgIGlmIChwb3NWYWwgIT09IGludFZhbCkge1xyXG4gICAgICAgIHByZXYgPSAoaW50VmFsID4gcHJldilcclxuICAgICAgICAgID8gaW50VmFsIDogcHJldjtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBwcmV2ID0gKHBvc1ZhbCA+IHByZXYpXHJcbiAgICAgICAgICA/IHBvc1ZhbCA6IHByZXY7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHByZXY7XHJcbiAgICB9LCBtaW5Qcmlvcml0eSk7XHJcbiAgfVxyXG59XHJcbiJdfQ==