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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJpb3JpdHlNYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicHJpb3JpdHlNYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDJDQUFvRDtBQUVwRCxxQ0FBbUM7QUEwQm5DLE1BQWEsZUFBZTtJQUsxQixZQUFZLEdBQXdCLEVBQUUsWUFBMEI7UUFjekQscUJBQWdCLEdBQUcsR0FBRyxFQUFFO1lBQzdCLE1BQU0sS0FBSyxHQUFXLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUN0QyxJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUU7Z0JBQ3ZCLElBQUksQ0FBQyxZQUFZLEdBQUcsQ0FBQyxDQUFDO2dCQUN0QixPQUFPO2FBQ1I7WUFDRCxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDakQsQ0FBQyxDQUFBO1FBRU0sZ0JBQVcsR0FBRyxDQUFDLElBQWlDLEVBQUUsRUFBRTs7WUFDekQsTUFBTSxFQUFFLFNBQVMsRUFBRSxXQUFXLEVBQUUsR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDbkQsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ2hFLElBQUksT0FBTyxLQUFLLFNBQVMsRUFBRTtnQkFDekIsSUFBSSxJQUFJLENBQUMsYUFBYSxLQUFLLGdCQUFnQixFQUFFO29CQUMzQyxNQUFNLFFBQVEsR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQztvQkFDNUMsT0FBTyxDQUFDLFFBQVEsR0FBRyxXQUFXLENBQUM7d0JBQzdCLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztpQkFDcEM7cUJBQU07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QUcsSUFBSSxDQUFDO3dCQUNwQixDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7aUJBQ25CO2dCQUNELE9BQU8sSUFBSSxDQUFDO1lBQ2QsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQ2xCLENBQUMsQ0FBQTtRQWpGQyxJQUFJLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQztRQUNoQixJQUFJLENBQUMsYUFBYSxHQUFHLFlBQVksQ0FBQztRQUNsQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztJQUMxQixDQUFDO0lBRUQsSUFBSSxZQUFZLENBQUMsSUFBa0I7UUFDakMsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUM7SUFDNUIsQ0FBQztJQUVELElBQUksWUFBWTtRQUNkLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQztJQUM1QixDQUFDO0NBdUVGO0FBeEZELDBDQXdGQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuXHJcbmltcG9ydCB7IEdBTUVfSUQgfSBmcm9tICcuL2NvbW1vbic7XHJcblxyXG5leHBvcnQgdHlwZSBQcmlvcml0eVR5cGUgPSAncG9zaXRpb24tYmFzZWQnIHwgJ3ByZWZpeC1iYXNlZCc7XHJcbmV4cG9ydCBpbnRlcmZhY2UgSUxvYWRPcmRlckVudHJ5IHtcclxuICBwb3M6IG51bWJlcjtcclxuICBlbmFibGVkOiBib29sZWFuO1xyXG4gIHByZWZpeD86IHN0cmluZztcclxuICBsb2NrZWQ/OiBib29sZWFuO1xyXG4gIGV4dGVybmFsPzogYm9vbGVhbjtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJTG9hZE9yZGVyIHtcclxuICBbbW9kSWQ6IHN0cmluZ106IElMb2FkT3JkZXJFbnRyeTtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJT2Zmc2V0TWFwIHtcclxuICBbb2Zmc2V0OiBudW1iZXJdOiBudW1iZXI7XHJcbn1cclxuXHJcbmludGVyZmFjZSBJUHJvcHMge1xyXG4gIHN0YXRlOiB0eXBlcy5JU3RhdGU7XHJcbiAgcHJvZmlsZTogdHlwZXMuSVByb2ZpbGU7XHJcbiAgbG9hZE9yZGVyOiB7IFttb2RJZDogc3RyaW5nXTogSUxvYWRPcmRlckVudHJ5IH07XHJcbiAgbWluUHJpb3JpdHk6IG51bWJlcjtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFByaW9yaXR5TWFuYWdlciB7XHJcbiAgcHJpdmF0ZSBtQXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpO1xyXG4gIHByaXZhdGUgbVByaW9yaXR5VHlwZTogUHJpb3JpdHlUeXBlO1xyXG4gIHByaXZhdGUgbU1heFByaW9yaXR5OiBudW1iZXI7XHJcblxyXG4gIGNvbnN0cnVjdG9yKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcHJpb3JpdHlUeXBlOiBQcmlvcml0eVR5cGUpIHtcclxuICAgIHRoaXMubUFwaSA9IGFwaTtcclxuICAgIHRoaXMubVByaW9yaXR5VHlwZSA9IHByaW9yaXR5VHlwZTtcclxuICAgIHRoaXMucmVzZXRNYXhQcmlvcml0eSgpO1xyXG4gIH1cclxuXHJcbiAgc2V0IHByaW9yaXR5VHlwZSh0eXBlOiBQcmlvcml0eVR5cGUpIHtcclxuICAgIHRoaXMubVByaW9yaXR5VHlwZSA9IHR5cGU7XHJcbiAgfVxyXG5cclxuICBnZXQgcHJpb3JpdHlUeXBlKCkge1xyXG4gICAgcmV0dXJuIHRoaXMubVByaW9yaXR5VHlwZTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyByZXNldE1heFByaW9yaXR5ID0gKCkgPT4ge1xyXG4gICAgY29uc3QgcHJvcHM6IElQcm9wcyA9IHRoaXMuZ2VuUHJvcHMoKTtcclxuICAgIGlmIChwcm9wcyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHRoaXMubU1heFByaW9yaXR5ID0gMDtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgdGhpcy5tTWF4UHJpb3JpdHkgPSB0aGlzLmdldE1heFByaW9yaXR5KHByb3BzKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXRQcmlvcml0eSA9IChpdGVtOiB0eXBlcy5JTG9hZE9yZGVyRGlzcGxheUl0ZW0pID0+IHtcclxuICAgIGNvbnN0IHsgbG9hZE9yZGVyLCBtaW5Qcmlvcml0eSB9ID0gdGhpcy5nZW5Qcm9wcygpO1xyXG4gICAgY29uc3QgaXRlbUtleSA9IE9iamVjdC5rZXlzKGxvYWRPcmRlcikuZmluZCh4ID0+IHggPT09IGl0ZW0uaWQpO1xyXG4gICAgaWYgKGl0ZW1LZXkgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBpZiAodGhpcy5tUHJpb3JpdHlUeXBlID09PSAncG9zaXRpb24tYmFzZWQnKSB7XHJcbiAgICAgICAgY29uc3QgcG9zaXRpb24gPSBsb2FkT3JkZXJbaXRlbUtleV0ucG9zICsgMTtcclxuICAgICAgICByZXR1cm4gKHBvc2l0aW9uID4gbWluUHJpb3JpdHkpXHJcbiAgICAgICAgICA/IHBvc2l0aW9uIDogdGhpcy5tTWF4UHJpb3JpdHkrKztcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBjb25zdCBwcmVmaXhWYWwgPSAobG9hZE9yZGVyW2l0ZW1LZXldPy5wcmVmaXggIT09IHVuZGVmaW5lZClcclxuICAgICAgICA/IHBhcnNlSW50KGxvYWRPcmRlcltpdGVtS2V5XS5wcmVmaXgsIDEwKSA6IGxvYWRPcmRlcltpdGVtS2V5XS5wb3M7XHJcbiAgICAgICAgY29uc3QgcG9zVmFsID0gbG9hZE9yZGVyW2l0ZW1LZXldLnBvcztcclxuICAgICAgICBpZiAocG9zVmFsICE9PSBwcmVmaXhWYWwgJiYgcHJlZml4VmFsID4gbWluUHJpb3JpdHkpIHtcclxuICAgICAgICAgIHJldHVybiBwcmVmaXhWYWw7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHJldHVybiAocG9zVmFsID4gbWluUHJpb3JpdHkpXHJcbiAgICAgICAgICAgID8gcG9zVmFsIDogdGhpcy5tTWF4UHJpb3JpdHkrKztcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcy5tTWF4UHJpb3JpdHkrKztcclxuICB9XHJcblxyXG4gIHByaXZhdGUgZ2VuUHJvcHMgPSAoKTogSVByb3BzID0+IHtcclxuICAgIGNvbnN0IHN0YXRlOiB0eXBlcy5JU3RhdGUgPSB0aGlzLm1BcGkuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGxhc3RQcm9mSWQgPSBzZWxlY3RvcnMubGFzdEFjdGl2ZVByb2ZpbGVGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICAgIGlmIChsYXN0UHJvZklkID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH1cclxuICAgIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIGxhc3RQcm9mSWQpO1xyXG4gICAgaWYgKHByb2ZpbGUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGxvYWRPcmRlcjogeyBbbW9kSWQ6IHN0cmluZ106IElMb2FkT3JkZXJFbnRyeSB9ID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxyXG4gICAgICBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgbGFzdFByb2ZJZF0sIHt9KTtcclxuXHJcbiAgICBjb25zdCBsb2NrZWRFbnRyaWVzID0gT2JqZWN0LmtleXMobG9hZE9yZGVyKS5maWx0ZXIoa2V5ID0+IGxvYWRPcmRlcltrZXldPy5sb2NrZWQpO1xyXG4gICAgY29uc3QgbWluUHJpb3JpdHkgPSBsb2NrZWRFbnRyaWVzLmxlbmd0aDtcclxuICAgIHJldHVybiB7IHN0YXRlLCBwcm9maWxlLCBsb2FkT3JkZXIsIG1pblByaW9yaXR5IH07XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGdldE1heFByaW9yaXR5ID0gKHByb3BzOiBJUHJvcHMpID0+IHtcclxuICAgIGNvbnN0IHsgbG9hZE9yZGVyLCBtaW5Qcmlvcml0eSB9ID0gcHJvcHM7XHJcbiAgICByZXR1cm4gT2JqZWN0LmtleXMobG9hZE9yZGVyKS5yZWR1Y2UoKHByZXYsIGtleSkgPT4ge1xyXG4gICAgICBjb25zdCBwcmVmaXhWYWwgPSAobG9hZE9yZGVyW2tleV0/LnByZWZpeCAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgID8gcGFyc2VJbnQobG9hZE9yZGVyW2tleV0ucHJlZml4LCAxMClcclxuICAgICAgICA6IGxvYWRPcmRlcltrZXldLnBvcztcclxuICAgICAgY29uc3QgcG9zVmFsID0gbG9hZE9yZGVyW2tleV0ucG9zO1xyXG4gICAgICBpZiAocG9zVmFsICE9PSBwcmVmaXhWYWwpIHtcclxuICAgICAgICBwcmV2ID0gKHByZWZpeFZhbCA+IHByZXYpXHJcbiAgICAgICAgICA/IHByZWZpeFZhbCA6IHByZXY7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcHJldiA9IChwb3NWYWwgPiBwcmV2KVxyXG4gICAgICAgICAgPyBwb3NWYWwgOiBwcmV2O1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBwcmV2O1xyXG4gICAgfSwgbWluUHJpb3JpdHkpO1xyXG4gIH1cclxufVxyXG4iXX0=