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
        this.getPriority = (loadOrder, item) => {
            var _a, _b, _c, _d;
            if (item === undefined) {
                return ++this.mMaxPriority;
            }
            const minPriority = Object.keys(loadOrder).filter(key => { var _a; return (_a = loadOrder[key]) === null || _a === void 0 ? void 0 : _a.locked; }).length + 1;
            const itemIdx = loadOrder.findIndex(x => (x === null || x === void 0 ? void 0 : x.id) === item.id);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJpb3JpdHlNYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicHJpb3JpdHlNYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLDJDQUE4QztBQUU5QyxxQ0FBbUM7QUFDbkMsNkNBQXNEO0FBZXRELE1BQWEsZUFBZTtJQUsxQixZQUFZLEdBQXdCLEVBQUUsWUFBMEI7UUFjekQscUJBQWdCLEdBQUcsQ0FBQyxHQUFZLEVBQUUsRUFBRTtZQUN6QyxNQUFNLEtBQUssR0FBVyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3pDLElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRTtnQkFDdkIsSUFBSSxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUM7Z0JBQ3RCLE9BQU87YUFDUjtZQUNELElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNqRCxDQUFDLENBQUE7UUFFTSxnQkFBVyxHQUFHLENBQUMsU0FBMEIsRUFBRSxJQUEyQixFQUFFLEVBQUU7O1lBQy9FLElBQUksSUFBSSxLQUFLLFNBQVMsRUFBRTtnQkFFdEIsT0FBTyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUM7YUFDNUI7WUFDRCxNQUFNLFdBQVcsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxXQUFDLE9BQUEsTUFBQSxTQUFTLENBQUMsR0FBRyxDQUFDLDBDQUFFLE1BQU0sQ0FBQSxFQUFBLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1lBRTVGLE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFBLENBQUMsYUFBRCxDQUFDLHVCQUFELENBQUMsQ0FBRSxFQUFFLE1BQUssSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzVELElBQUksT0FBTyxLQUFLLENBQUMsQ0FBQyxFQUFFO2dCQUNsQixJQUFJLElBQUksQ0FBQyxhQUFhLEtBQUssZ0JBQWdCLEVBQUU7b0JBQzNDLE1BQU0sUUFBUSxHQUFHLE9BQU8sR0FBRyxDQUFDLENBQUM7b0JBQzdCLE9BQU8sQ0FBQyxRQUFRLEdBQUcsV0FBVyxDQUFDO3dCQUM3QixDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUM7aUJBQ3BDO3FCQUFNO29CQUNMLE1BQU0sU0FBUyxHQUFHLE1BQUEsTUFBQSxNQUFBLFNBQVMsQ0FBQyxPQUFPLENBQUMsMENBQUUsSUFBSSwwQ0FBRSxNQUFNLG1DQUFJLE1BQUEsU0FBUyxDQUFDLE9BQU8sQ0FBQywwQ0FBRyxRQUFRLENBQUMsQ0FBQztvQkFDckYsTUFBTSxNQUFNLEdBQUcsU0FBUyxLQUFLLFNBQVM7d0JBQ3BDLENBQUMsQ0FBQyxRQUFRLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQzt3QkFDekIsQ0FBQyxDQUFDLE9BQU8sQ0FBQztvQkFDWixNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUM7b0JBQ3ZCLElBQUksTUFBTSxLQUFLLE1BQU0sSUFBSSxNQUFNLEdBQUcsV0FBVyxFQUFFO3dCQUM3QyxPQUFPLE1BQU0sQ0FBQztxQkFDZjt5QkFBTTt3QkFDTCxPQUFPLENBQUMsTUFBTSxHQUFHLFdBQVcsQ0FBQzs0QkFDM0IsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDO3FCQUNsQztpQkFDRjthQUNGO1lBRUQsT0FBTyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUM7UUFDN0IsQ0FBQyxDQUFBO1FBRU8sYUFBUSxHQUFHLENBQUMsR0FBWSxFQUFVLEVBQUU7WUFDMUMsTUFBTSxLQUFLLEdBQWlCLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDakQsTUFBTSxVQUFVLEdBQUcsc0JBQVMsQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLEVBQUUsZ0JBQU8sQ0FBQyxDQUFDO1lBQ3RFLElBQUksVUFBVSxLQUFLLFNBQVMsRUFBRTtnQkFDNUIsT0FBTyxTQUFTLENBQUM7YUFDbEI7WUFDRCxNQUFNLE9BQU8sR0FBRyxzQkFBUyxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDekQsSUFBSSxPQUFPLEtBQUssU0FBUyxFQUFFO2dCQUN6QixPQUFPLFNBQVMsQ0FBQzthQUNsQjtZQUVELE1BQU0sU0FBUyxHQUFvQixJQUFBLG1DQUFzQixFQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUVyRSxNQUFNLGFBQWEsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxXQUFDLE9BQUEsTUFBQSxTQUFTLENBQUMsR0FBRyxDQUFDLDBDQUFFLE1BQU0sQ0FBQSxFQUFBLENBQUMsQ0FBQztZQUNuRixNQUFNLFdBQVcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUM7WUFDdkQsT0FBTyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSxDQUFDO1FBQ3BELENBQUMsQ0FBQTtRQUVNLG1CQUFjLEdBQUcsQ0FBQyxLQUFhLEVBQUUsRUFBRTtZQUN4QyxNQUFNLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSxHQUFHLEtBQUssQ0FBQztZQUN6QyxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxFQUFFOztnQkFDakQsTUFBTSxTQUFTLEdBQUcsTUFBQSxNQUFBLE1BQUEsU0FBUyxDQUFDLEdBQUcsQ0FBQywwQ0FBRSxJQUFJLDBDQUFFLE1BQU0sbUNBQUksTUFBQSxTQUFTLENBQUMsR0FBRyxDQUFDLDBDQUFFLE1BQU0sQ0FBQztnQkFDekUsTUFBTSxNQUFNLEdBQUcsU0FBUyxLQUFLLFNBQVM7b0JBQ3BDLENBQUMsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUM7b0JBQ3JDLENBQUMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDO2dCQUN2QixNQUFNLE1BQU0sR0FBRyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDO2dCQUNsQyxJQUFJLE1BQU0sS0FBSyxNQUFNLEVBQUU7b0JBQ3JCLElBQUksR0FBRyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7d0JBQ3BCLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztpQkFDbkI7cUJBQU07b0JBQ0wsSUFBSSxHQUFHLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQzt3QkFDcEIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO2lCQUNuQjtnQkFDRCxPQUFPLElBQUksQ0FBQztZQUNkLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUNsQixDQUFDLENBQUE7UUF4RkMsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLENBQUM7UUFDaEIsSUFBSSxDQUFDLGFBQWEsR0FBRyxZQUFZLENBQUM7UUFDbEMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7SUFDMUIsQ0FBQztJQUVELElBQUksWUFBWSxDQUFDLElBQWtCO1FBQ2pDLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDO0lBQzVCLENBQUM7SUFFRCxJQUFJLFlBQVk7UUFDZCxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUM7SUFDNUIsQ0FBQztDQThFRjtBQS9GRCwwQ0ErRkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xyXG5pbXBvcnQgeyBzZWxlY3RvcnMsIHR5cGVzIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgeyBHQU1FX0lEIH0gZnJvbSAnLi9jb21tb24nO1xyXG5pbXBvcnQgeyBnZXRQZXJzaXN0ZW50TG9hZE9yZGVyIH0gZnJvbSAnLi9taWdyYXRpb25zJztcclxuXHJcbmV4cG9ydCB0eXBlIFByaW9yaXR5VHlwZSA9ICdwb3NpdGlvbi1iYXNlZCcgfCAncHJlZml4LWJhc2VkJztcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSU9mZnNldE1hcCB7XHJcbiAgW29mZnNldDogbnVtYmVyXTogbnVtYmVyO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSVByb3BzIHtcclxuICBzdGF0ZTogdHlwZXMuSVN0YXRlO1xyXG4gIHByb2ZpbGU6IHR5cGVzLklQcm9maWxlO1xyXG4gIGxvYWRPcmRlcjogdHlwZXMuTG9hZE9yZGVyO1xyXG4gIG1pblByaW9yaXR5OiBudW1iZXI7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBQcmlvcml0eU1hbmFnZXIge1xyXG4gIHByaXZhdGUgbUFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaTtcclxuICBwcml2YXRlIG1Qcmlvcml0eVR5cGU6IFByaW9yaXR5VHlwZTtcclxuICBwcml2YXRlIG1NYXhQcmlvcml0eTogbnVtYmVyO1xyXG5cclxuICBjb25zdHJ1Y3RvcihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHByaW9yaXR5VHlwZTogUHJpb3JpdHlUeXBlKSB7XHJcbiAgICB0aGlzLm1BcGkgPSBhcGk7XHJcbiAgICB0aGlzLm1Qcmlvcml0eVR5cGUgPSBwcmlvcml0eVR5cGU7XHJcbiAgICB0aGlzLnJlc2V0TWF4UHJpb3JpdHkoKTtcclxuICB9XHJcblxyXG4gIHNldCBwcmlvcml0eVR5cGUodHlwZTogUHJpb3JpdHlUeXBlKSB7XHJcbiAgICB0aGlzLm1Qcmlvcml0eVR5cGUgPSB0eXBlO1xyXG4gIH1cclxuXHJcbiAgZ2V0IHByaW9yaXR5VHlwZSgpIHtcclxuICAgIHJldHVybiB0aGlzLm1Qcmlvcml0eVR5cGU7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgcmVzZXRNYXhQcmlvcml0eSA9IChtaW4/OiBudW1iZXIpID0+IHtcclxuICAgIGNvbnN0IHByb3BzOiBJUHJvcHMgPSB0aGlzLmdlblByb3BzKG1pbik7XHJcbiAgICBpZiAocHJvcHMgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICB0aGlzLm1NYXhQcmlvcml0eSA9IDA7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHRoaXMubU1heFByaW9yaXR5ID0gdGhpcy5nZXRNYXhQcmlvcml0eShwcm9wcyk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0UHJpb3JpdHkgPSAobG9hZE9yZGVyOiB0eXBlcy5Mb2FkT3JkZXIsIGl0ZW06IHR5cGVzLklMb2FkT3JkZXJFbnRyeSkgPT4ge1xyXG4gICAgaWYgKGl0ZW0gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAvLyBTZW5kIGl0IG9mZiB0byB0aGUgZW5kLlxyXG4gICAgICByZXR1cm4gKyt0aGlzLm1NYXhQcmlvcml0eTtcclxuICAgIH1cclxuICAgIGNvbnN0IG1pblByaW9yaXR5ID0gT2JqZWN0LmtleXMobG9hZE9yZGVyKS5maWx0ZXIoa2V5ID0+IGxvYWRPcmRlcltrZXldPy5sb2NrZWQpLmxlbmd0aCArIDE7XHJcblxyXG4gICAgY29uc3QgaXRlbUlkeCA9IGxvYWRPcmRlci5maW5kSW5kZXgoeCA9PiB4Py5pZCA9PT0gaXRlbS5pZCk7XHJcbiAgICBpZiAoaXRlbUlkeCAhPT0gLTEpIHtcclxuICAgICAgaWYgKHRoaXMubVByaW9yaXR5VHlwZSA9PT0gJ3Bvc2l0aW9uLWJhc2VkJykge1xyXG4gICAgICAgIGNvbnN0IHBvc2l0aW9uID0gaXRlbUlkeCArIDE7XHJcbiAgICAgICAgcmV0dXJuIChwb3NpdGlvbiA+IG1pblByaW9yaXR5KVxyXG4gICAgICAgICAgPyBwb3NpdGlvbiA6ICsrdGhpcy5tTWF4UHJpb3JpdHk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29uc3QgcHJlZml4VmFsID0gbG9hZE9yZGVyW2l0ZW1JZHhdPy5kYXRhPy5wcmVmaXggPz8gbG9hZE9yZGVyW2l0ZW1JZHhdPy5bJ3ByZWZpeCddO1xyXG4gICAgICAgIGNvbnN0IGludFZhbCA9IHByZWZpeFZhbCAhPT0gdW5kZWZpbmVkXHJcbiAgICAgICAgICA/IHBhcnNlSW50KHByZWZpeFZhbCwgMTApXHJcbiAgICAgICAgICA6IGl0ZW1JZHg7XHJcbiAgICAgICAgY29uc3QgcG9zVmFsID0gaXRlbUlkeDtcclxuICAgICAgICBpZiAocG9zVmFsICE9PSBpbnRWYWwgJiYgaW50VmFsID4gbWluUHJpb3JpdHkpIHtcclxuICAgICAgICAgIHJldHVybiBpbnRWYWw7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHJldHVybiAocG9zVmFsID4gbWluUHJpb3JpdHkpXHJcbiAgICAgICAgICAgID8gcG9zVmFsIDogKyt0aGlzLm1NYXhQcmlvcml0eTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gKyt0aGlzLm1NYXhQcmlvcml0eTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgZ2VuUHJvcHMgPSAobWluPzogbnVtYmVyKTogSVByb3BzID0+IHtcclxuICAgIGNvbnN0IHN0YXRlOiB0eXBlcy5JU3RhdGUgPSB0aGlzLm1BcGkuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGxhc3RQcm9mSWQgPSBzZWxlY3RvcnMubGFzdEFjdGl2ZVByb2ZpbGVGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICAgIGlmIChsYXN0UHJvZklkID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH1cclxuICAgIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIGxhc3RQcm9mSWQpO1xyXG4gICAgaWYgKHByb2ZpbGUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGxvYWRPcmRlcjogdHlwZXMuTG9hZE9yZGVyID0gZ2V0UGVyc2lzdGVudExvYWRPcmRlcih0aGlzLm1BcGkpO1xyXG5cclxuICAgIGNvbnN0IGxvY2tlZEVudHJpZXMgPSBPYmplY3Qua2V5cyhsb2FkT3JkZXIpLmZpbHRlcihrZXkgPT4gbG9hZE9yZGVyW2tleV0/LmxvY2tlZCk7XHJcbiAgICBjb25zdCBtaW5Qcmlvcml0eSA9IChtaW4pID8gbWluIDogbG9ja2VkRW50cmllcy5sZW5ndGg7XHJcbiAgICByZXR1cm4geyBzdGF0ZSwgcHJvZmlsZSwgbG9hZE9yZGVyLCBtaW5Qcmlvcml0eSB9O1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldE1heFByaW9yaXR5ID0gKHByb3BzOiBJUHJvcHMpID0+IHtcclxuICAgIGNvbnN0IHsgbG9hZE9yZGVyLCBtaW5Qcmlvcml0eSB9ID0gcHJvcHM7XHJcbiAgICByZXR1cm4gT2JqZWN0LmtleXMobG9hZE9yZGVyKS5yZWR1Y2UoKHByZXYsIGtleSkgPT4ge1xyXG4gICAgICBjb25zdCBwcmVmaXhWYWwgPSBsb2FkT3JkZXJba2V5XT8uZGF0YT8ucHJlZml4ID8/IGxvYWRPcmRlcltrZXldPy5wcmVmaXg7XHJcbiAgICAgIGNvbnN0IGludFZhbCA9IHByZWZpeFZhbCAhPT0gdW5kZWZpbmVkXHJcbiAgICAgICAgPyBwYXJzZUludChsb2FkT3JkZXJba2V5XS5wcmVmaXgsIDEwKVxyXG4gICAgICAgIDogbG9hZE9yZGVyW2tleV0ucG9zO1xyXG4gICAgICBjb25zdCBwb3NWYWwgPSBsb2FkT3JkZXJba2V5XS5wb3M7XHJcbiAgICAgIGlmIChwb3NWYWwgIT09IGludFZhbCkge1xyXG4gICAgICAgIHByZXYgPSAoaW50VmFsID4gcHJldilcclxuICAgICAgICAgID8gaW50VmFsIDogcHJldjtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBwcmV2ID0gKHBvc1ZhbCA+IHByZXYpXHJcbiAgICAgICAgICA/IHBvc1ZhbCA6IHByZXY7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHByZXY7XHJcbiAgICB9LCBtaW5Qcmlvcml0eSk7XHJcbiAgfVxyXG59XHJcbiJdfQ==