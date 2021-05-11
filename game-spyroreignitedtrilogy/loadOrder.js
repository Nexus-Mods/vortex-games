"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.deserialize = exports.serialize = void 0;
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const util_1 = require("./util");
function serialize(context, loadOrder, profileId) {
    return __awaiter(this, void 0, void 0, function* () {
        const props = util_1.genProps(context);
        if (props === undefined) {
            return Promise.reject(new vortex_api_1.util.ProcessCanceled('invalid props'));
        }
        const loFilePath = yield util_1.ensureLOFile(context, profileId, props);
        const prefixedLO = loadOrder.map((loEntry, idx) => {
            const prefix = util_1.makePrefix(idx);
            const data = {
                prefix,
            };
            return Object.assign(Object.assign({}, loEntry), { data });
        });
        yield vortex_api_1.fs.removeAsync(loFilePath).catch({ code: 'ENOENT' }, () => Promise.resolve());
        yield vortex_api_1.fs.writeFileAsync(loFilePath, JSON.stringify(prefixedLO), { encoding: 'utf8' });
        return Promise.resolve();
    });
}
exports.serialize = serialize;
function deserialize(context) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const props = util_1.genProps(context);
        if (((_a = props === null || props === void 0 ? void 0 : props.profile) === null || _a === void 0 ? void 0 : _a.gameId) !== common_1.GAME_ID) {
            return [];
        }
        const currentModsState = vortex_api_1.util.getSafe(props.profile, ['modState'], {});
        const enabledModIds = Object.keys(currentModsState)
            .filter(modId => vortex_api_1.util.getSafe(currentModsState, [modId, 'enabled'], false));
        const mods = vortex_api_1.util.getSafe(props.state, ['persistent', 'mods', common_1.GAME_ID], {});
        const loFilePath = yield util_1.ensureLOFile(context);
        const fileData = yield vortex_api_1.fs.readFileAsync(loFilePath, { encoding: 'utf8' });
        try {
            const data = JSON.parse(fileData);
            const filteredData = data.filter(entry => enabledModIds.includes(entry.id));
            const diff = enabledModIds.filter(id => filteredData.find(loEntry => loEntry.id === id) === undefined);
            diff.forEach(missingEntry => {
                filteredData.push({
                    id: missingEntry,
                    modId: missingEntry,
                    enabled: true,
                    name: mods[missingEntry] !== undefined
                        ? vortex_api_1.util.renderModName(mods[missingEntry])
                        : missingEntry,
                });
            });
            return filteredData;
        }
        catch (err) {
            return Promise.reject(err);
        }
    });
}
exports.deserialize = deserialize;
function validate(prev, current) {
    return __awaiter(this, void 0, void 0, function* () {
        return undefined;
    });
}
exports.validate = validate;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZE9yZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibG9hZE9yZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLDJDQUE2QztBQUU3QyxxQ0FBbUM7QUFFbkMsaUNBQTREO0FBRTVELFNBQXNCLFNBQVMsQ0FBQyxPQUFnQyxFQUNoQyxTQUFvQixFQUNwQixTQUFrQjs7UUFDaEQsTUFBTSxLQUFLLEdBQVcsZUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3hDLElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRTtZQUN2QixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxpQkFBSSxDQUFDLGVBQWUsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO1NBQ2xFO1FBR0QsTUFBTSxVQUFVLEdBQUcsTUFBTSxtQkFBWSxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFJakUsTUFBTSxVQUFVLEdBQUcsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQXdCLEVBQUUsR0FBVyxFQUFFLEVBQUU7WUFDekUsTUFBTSxNQUFNLEdBQUcsaUJBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUMvQixNQUFNLElBQUksR0FBc0I7Z0JBQzlCLE1BQU07YUFDUCxDQUFDO1lBQ0YsdUNBQVksT0FBTyxLQUFFLElBQUksSUFBRztRQUM5QixDQUFDLENBQUMsQ0FBQztRQUdILE1BQU0sZUFBRSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLEVBQUUsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDcEYsTUFBTSxlQUFFLENBQUMsY0FBYyxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxFQUFFLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDdEYsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDM0IsQ0FBQztDQUFBO0FBekJELDhCQXlCQztBQUVELFNBQXNCLFdBQVcsQ0FBQyxPQUFnQzs7O1FBSWhFLE1BQU0sS0FBSyxHQUFXLGVBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN4QyxJQUFJLE9BQUEsS0FBSyxhQUFMLEtBQUssdUJBQUwsS0FBSyxDQUFFLE9BQU8sMENBQUUsTUFBTSxNQUFLLGdCQUFPLEVBQUU7WUFHdEMsT0FBTyxFQUFFLENBQUM7U0FDWDtRQUtELE1BQU0sZ0JBQWdCLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLFVBQVUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBR3ZFLE1BQU0sYUFBYSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUM7YUFDaEQsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsaUJBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUM5RSxNQUFNLElBQUksR0FBb0MsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssRUFDcEUsQ0FBQyxZQUFZLEVBQUUsTUFBTSxFQUFFLGdCQUFPLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUN2QyxNQUFNLFVBQVUsR0FBRyxNQUFNLG1CQUFZLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDL0MsTUFBTSxRQUFRLEdBQUcsTUFBTSxlQUFFLENBQUMsYUFBYSxDQUFDLFVBQVUsRUFBRSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQzFFLElBQUk7WUFDRixNQUFNLElBQUksR0FBc0IsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUlyRCxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUc1RSxNQUFNLElBQUksR0FBRyxhQUFhLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQ3JDLFlBQVksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxLQUFLLFNBQVMsQ0FBQyxDQUFDO1lBR2pFLElBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLEVBQUU7Z0JBQzFCLFlBQVksQ0FBQyxJQUFJLENBQUM7b0JBQ2hCLEVBQUUsRUFBRSxZQUFZO29CQUNoQixLQUFLLEVBQUUsWUFBWTtvQkFDbkIsT0FBTyxFQUFFLElBQUk7b0JBQ2IsSUFBSSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxTQUFTO3dCQUNwQyxDQUFDLENBQUMsaUJBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO3dCQUN4QyxDQUFDLENBQUMsWUFBWTtpQkFDakIsQ0FBQyxDQUFDO1lBQ0wsQ0FBQyxDQUFDLENBQUM7WUFPSCxPQUFPLFlBQVksQ0FBQztTQUNyQjtRQUFDLE9BQU8sR0FBRyxFQUFFO1lBQ1osT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQzVCOztDQUNGO0FBdkRELGtDQXVEQztBQUVELFNBQXNCLFFBQVEsQ0FBQyxJQUFlLEVBQ2YsT0FBa0I7O1FBSS9DLE9BQU8sU0FBUyxDQUFDO0lBQ25CLENBQUM7Q0FBQTtBQU5ELDRCQU1DIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5cbmltcG9ydCB7IEdBTUVfSUQgfSBmcm9tICcuL2NvbW1vbic7XG5pbXBvcnQgeyBJTG9hZE9yZGVyRW50cnksIElQcm9wcywgSVNlcmlhbGl6YWJsZURhdGEsIExvYWRPcmRlciB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgZW5zdXJlTE9GaWxlLCBnZW5Qcm9wcywgbWFrZVByZWZpeCB9IGZyb20gJy4vdXRpbCc7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZXJpYWxpemUoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvYWRPcmRlcjogTG9hZE9yZGVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9maWxlSWQ/OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgcHJvcHM6IElQcm9wcyA9IGdlblByb3BzKGNvbnRleHQpO1xuICBpZiAocHJvcHMgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ2ludmFsaWQgcHJvcHMnKSk7XG4gIH1cblxuICAvLyBNYWtlIHN1cmUgdGhlIExPIGZpbGUgaXMgY3JlYXRlZCBhbmQgcmVhZHkgdG8gYmUgd3JpdHRlbiB0by5cbiAgY29uc3QgbG9GaWxlUGF0aCA9IGF3YWl0IGVuc3VyZUxPRmlsZShjb250ZXh0LCBwcm9maWxlSWQsIHByb3BzKTtcblxuICAvLyBUaGUgYXJyYXkgYXQgdGhpcyBwb2ludCBpcyBzb3J0ZWQgaW4gdGhlIG9yZGVyIGluIHdoaWNoIHdlIHdhbnQgdGhlIGdhbWUgdG8gbG9hZCB0aGVcbiAgLy8gIG1vZHMsIHdoaWNoIG1lYW5zIHdlIGNhbiBqdXN0IGxvb3AgdGhyb3VnaCBpdCBhbmQgdXNlIHRoZSBpbmRleCB0byBhc3NpZ24gdGhlIHByZWZpeC5cbiAgY29uc3QgcHJlZml4ZWRMTyA9IGxvYWRPcmRlci5tYXAoKGxvRW50cnk6IElMb2FkT3JkZXJFbnRyeSwgaWR4OiBudW1iZXIpID0+IHtcbiAgICBjb25zdCBwcmVmaXggPSBtYWtlUHJlZml4KGlkeCk7XG4gICAgY29uc3QgZGF0YTogSVNlcmlhbGl6YWJsZURhdGEgPSB7XG4gICAgICBwcmVmaXgsXG4gICAgfTtcbiAgICByZXR1cm4geyAuLi5sb0VudHJ5LCBkYXRhIH07XG4gIH0pO1xuXG4gIC8vIFdyaXRlIHRoZSBwcmVmaXhlZCBMTyB0byBmaWxlLlxuICBhd2FpdCBmcy5yZW1vdmVBc3luYyhsb0ZpbGVQYXRoKS5jYXRjaCh7IGNvZGU6ICdFTk9FTlQnIH0sICgpID0+IFByb21pc2UucmVzb2x2ZSgpKTtcbiAgYXdhaXQgZnMud3JpdGVGaWxlQXN5bmMobG9GaWxlUGF0aCwgSlNPTi5zdHJpbmdpZnkocHJlZml4ZWRMTyksIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZGVzZXJpYWxpemUoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpOiBQcm9taXNlPExvYWRPcmRlcj4ge1xuICAvLyBnZW5Qcm9wcyBpcyBhIHNtYWxsIHV0aWxpdHkgZnVuY3Rpb24gd2hpY2ggcmV0dXJucyBvZnRlbiByZS11c2VkIG9iamVjdHNcbiAgLy8gIHN1Y2ggYXMgdGhlIGN1cnJlbnQgbGlzdCBvZiBpbnN0YWxsZWQgTW9kcywgVm9ydGV4J3MgYXBwbGljYXRpb24gc3RhdGUsXG4gIC8vICB0aGUgY3VycmVudGx5IGFjdGl2ZSBwcm9maWxlLCBldGMuXG4gIGNvbnN0IHByb3BzOiBJUHJvcHMgPSBnZW5Qcm9wcyhjb250ZXh0KTtcbiAgaWYgKHByb3BzPy5wcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQpIHtcbiAgICAvLyBXaHkgYXJlIHdlIGRlc2VyaWFsaXppbmcgd2hlbiB0aGUgcHJvZmlsZSBpcyBpbnZhbGlkIG9yIGJlbG9uZ3MgdG9cbiAgICAvLyAgYW5vdGhlciBnYW1lID9cbiAgICByZXR1cm4gW107XG4gIH1cblxuICAvLyBUaGUgZGVzZXJpYWxpemF0aW9uIGZ1bmN0aW9uIHNob3VsZCBiZSB1c2VkIHRvIGZpbHRlciBhbmQgaW5zZXJ0IHdhbnRlZCBkYXRhIGludG8gVm9ydGV4J3NcbiAgLy8gIGxvYWRPcmRlciBhcHBsaWNhdGlvbiBzdGF0ZSwgb25jZSB0aGF0J3MgZG9uZSwgVm9ydGV4IHdpbGwgdHJpZ2dlciBhIHNlcmlhbGl6YXRpb24gZXZlbnRcbiAgLy8gIHdoaWNoIHdpbGwgZW5zdXJlIHRoYXQgdGhlIGRhdGEgaXMgd3JpdHRlbiB0byB0aGUgTE8gZmlsZS5cbiAgY29uc3QgY3VycmVudE1vZHNTdGF0ZSA9IHV0aWwuZ2V0U2FmZShwcm9wcy5wcm9maWxlLCBbJ21vZFN0YXRlJ10sIHt9KTtcblxuICAvLyB3ZSBvbmx5IHdhbnQgdG8gaW5zZXJ0IGVuYWJsZWQgbW9kcy5cbiAgY29uc3QgZW5hYmxlZE1vZElkcyA9IE9iamVjdC5rZXlzKGN1cnJlbnRNb2RzU3RhdGUpXG4gICAgLmZpbHRlcihtb2RJZCA9PiB1dGlsLmdldFNhZmUoY3VycmVudE1vZHNTdGF0ZSwgW21vZElkLCAnZW5hYmxlZCddLCBmYWxzZSkpO1xuICBjb25zdCBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9ID0gdXRpbC5nZXRTYWZlKHByb3BzLnN0YXRlLFxuICAgIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcbiAgY29uc3QgbG9GaWxlUGF0aCA9IGF3YWl0IGVuc3VyZUxPRmlsZShjb250ZXh0KTtcbiAgY29uc3QgZmlsZURhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKGxvRmlsZVBhdGgsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcbiAgdHJ5IHtcbiAgICBjb25zdCBkYXRhOiBJTG9hZE9yZGVyRW50cnlbXSA9IEpTT04ucGFyc2UoZmlsZURhdGEpO1xuXG4gICAgLy8gVXNlciBtYXkgaGF2ZSBkaXNhYmxlZC9yZW1vdmVkIGEgbW9kIC0gd2UgbmVlZCB0byBmaWx0ZXIgb3V0IGFueSBleGlzdGluZ1xuICAgIC8vICBlbnRyaWVzIGZyb20gdGhlIGRhdGEgd2UgcGFyc2VkLlxuICAgIGNvbnN0IGZpbHRlcmVkRGF0YSA9IGRhdGEuZmlsdGVyKGVudHJ5ID0+IGVuYWJsZWRNb2RJZHMuaW5jbHVkZXMoZW50cnkuaWQpKTtcblxuICAgIC8vIENoZWNrIGlmIHRoZSB1c2VyIGFkZGVkIGFueSBuZXcgbW9kcy5cbiAgICBjb25zdCBkaWZmID0gZW5hYmxlZE1vZElkcy5maWx0ZXIoaWQgPT5cbiAgICAgIGZpbHRlcmVkRGF0YS5maW5kKGxvRW50cnkgPT4gbG9FbnRyeS5pZCA9PT0gaWQpID09PSB1bmRlZmluZWQpO1xuXG4gICAgLy8gQWRkIGFueSBuZXdseSBhZGRlZCBtb2RzIHRvIHRoZSBib3R0b20gb2YgdGhlIGxvYWRPcmRlci5cbiAgICBkaWZmLmZvckVhY2gobWlzc2luZ0VudHJ5ID0+IHtcbiAgICAgIGZpbHRlcmVkRGF0YS5wdXNoKHtcbiAgICAgICAgaWQ6IG1pc3NpbmdFbnRyeSxcbiAgICAgICAgbW9kSWQ6IG1pc3NpbmdFbnRyeSxcbiAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgbmFtZTogbW9kc1ttaXNzaW5nRW50cnldICE9PSB1bmRlZmluZWRcbiAgICAgICAgICA/IHV0aWwucmVuZGVyTW9kTmFtZShtb2RzW21pc3NpbmdFbnRyeV0pXG4gICAgICAgICAgOiBtaXNzaW5nRW50cnksXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIC8vIEF0IHRoaXMgcG9pbnQgeW91IG1heSBoYXZlIG5vdGljZWQgdGhhdCB3ZSdyZSBub3Qgc2V0dGluZyB0aGUgcHJlZml4XG4gICAgLy8gIGZvciB0aGUgbmV3bHkgYWRkZWQgbW9kIGVudHJpZXMgLSB3ZSBjb3VsZCBjZXJ0YWlubHkgZG8gdGhhdCBoZXJlLFxuICAgIC8vICBidXQgdGhhdCB3b3VsZCBzaW1wbHkgYmUgY29kZSBkdXBsaWNhdGlvbiBhcyB3ZSBuZWVkIHRvIGFzc2lnbiBwcmVmaXhlc1xuICAgIC8vICBkdXJpbmcgc2VyaWFsaXphdGlvbiBhbnl3YXkgKG90aGVyd2lzZSB1c2VyIGRyYWctZHJvcCBpbnRlcmFjdGlvbnMgd2lsbFxuICAgIC8vICBub3QgYmUgc2F2ZWQpXG4gICAgcmV0dXJuIGZpbHRlcmVkRGF0YTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHZhbGlkYXRlKHByZXY6IExvYWRPcmRlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50OiBMb2FkT3JkZXIpOiBQcm9taXNlPGFueT4ge1xuICAvLyBOb3RoaW5nIHRvIHZhbGlkYXRlIHJlYWxseSAtIHRoZSBnYW1lIGRvZXMgbm90IHJlYWQgb3VyIGxvYWQgb3JkZXIgZmlsZVxuICAvLyAgYW5kIHdlIGRvbid0IHdhbnQgdG8gYXBwbHkgYW55IHJlc3RyaWN0aW9ucyBlaXRoZXIsIHNvIHdlIGp1c3RcbiAgLy8gIHJldHVybi5cbiAgcmV0dXJuIHVuZGVmaW5lZDtcbn1cbiJdfQ==