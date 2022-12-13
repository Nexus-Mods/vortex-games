"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const vortex_api_1 = require("vortex-api");
const iconMap = {
    broken: 'feedback-error',
    obsolete: 'feedback-error',
    abandoned: 'feedback-warning',
    unofficial: 'feedback-warning',
    workaround: 'feedback-warning',
    unknown: 'feedback-info',
    optional: 'feedback-success',
    ok: 'feedback-success',
};
function CompatibilityIcon(props) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    const { t, mod } = props;
    const version = (_b = (_a = mod.attributes) === null || _a === void 0 ? void 0 : _a.manifestVersion) !== null && _b !== void 0 ? _b : (_c = mod.attributes) === null || _c === void 0 ? void 0 : _c.version;
    if ((((_d = mod.attributes) === null || _d === void 0 ? void 0 : _d.compatibilityUpdate) !== undefined)
        && (((_e = mod.attributes) === null || _e === void 0 ? void 0 : _e.compatibilityUpdate) !== version)) {
        return (react_1.default.createElement(vortex_api_1.tooltip.Icon, { name: 'auto-update', tooltip: t('SMAPI suggests updating this mod to {{update}}. '
                + 'Please use Vortex to check for mod updates', {
                replace: {
                    update: (_f = mod.attributes) === null || _f === void 0 ? void 0 : _f.compatibilityUpdate,
                },
            }) }));
    }
    const status = ((_h = (_g = mod.attributes) === null || _g === void 0 ? void 0 : _g.compatibilityStatus) !== null && _h !== void 0 ? _h : 'unknown').toLowerCase();
    const icon = (_j = iconMap[status]) !== null && _j !== void 0 ? _j : iconMap['unknown'];
    return (react_1.default.createElement(vortex_api_1.tooltip.Icon, { name: icon, className: `sdv-compatibility-${status}`, tooltip: (_l = (_k = mod.attributes) === null || _k === void 0 ? void 0 : _k.compatibilityMessage) !== null && _l !== void 0 ? _l : t('No information') }));
}
exports.default = CompatibilityIcon;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29tcGF0aWJpbGl0eUljb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJDb21wYXRpYmlsaXR5SWNvbi50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxrREFBMEI7QUFDMUIsMkNBQTRDO0FBUzVDLE1BQU0sT0FBTyxHQUF3QztJQUNuRCxNQUFNLEVBQUUsZ0JBQWdCO0lBQ3hCLFFBQVEsRUFBRSxnQkFBZ0I7SUFDMUIsU0FBUyxFQUFFLGtCQUFrQjtJQUM3QixVQUFVLEVBQUUsa0JBQWtCO0lBQzlCLFVBQVUsRUFBRSxrQkFBa0I7SUFDOUIsT0FBTyxFQUFFLGVBQWU7SUFDeEIsUUFBUSxFQUFFLGtCQUFrQjtJQUM1QixFQUFFLEVBQUUsa0JBQWtCO0NBQ3ZCLENBQUM7QUFFRixTQUFTLGlCQUFpQixDQUFDLEtBQThCOztJQUN2RCxNQUFNLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEtBQUssQ0FBQztJQUV6QixNQUFNLE9BQU8sR0FBRyxNQUFBLE1BQUEsR0FBRyxDQUFDLFVBQVUsMENBQUUsZUFBZSxtQ0FDL0IsTUFBQSxHQUFHLENBQUMsVUFBVSwwQ0FBRSxPQUFPLENBQUM7SUFFeEMsSUFBSSxDQUFDLENBQUEsTUFBQSxHQUFHLENBQUMsVUFBVSwwQ0FBRSxtQkFBbUIsTUFBSyxTQUFTLENBQUM7V0FDaEQsQ0FBQyxDQUFBLE1BQUEsR0FBRyxDQUFDLFVBQVUsMENBQUUsbUJBQW1CLE1BQUssT0FBTyxDQUFDLEVBQUU7UUFDeEQsT0FBTyxDQUNMLDhCQUFDLG9CQUFPLENBQUMsSUFBSSxJQUNYLElBQUksRUFBQyxhQUFhLEVBQ2xCLE9BQU8sRUFBRSxDQUFDLENBQUMsa0RBQWtEO2tCQUNqRCw0Q0FBNEMsRUFBRTtnQkFDeEQsT0FBTyxFQUFFO29CQUNQLE1BQU0sRUFBRSxNQUFBLEdBQUcsQ0FBQyxVQUFVLDBDQUFFLG1CQUFtQjtpQkFDNUM7YUFDRixDQUFDLEdBQ0YsQ0FDSCxDQUFDO0tBQ0g7SUFFRCxNQUFNLE1BQU0sR0FBRyxDQUFDLE1BQUEsTUFBQSxHQUFHLENBQUMsVUFBVSwwQ0FBRSxtQkFBbUIsbUNBQUksU0FBUyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDaEYsTUFBTSxJQUFJLEdBQUcsTUFBQSxPQUFPLENBQUMsTUFBTSxDQUFDLG1DQUFJLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUNuRCxPQUFPLENBQ0wsOEJBQUMsb0JBQU8sQ0FBQyxJQUFJLElBQ1gsSUFBSSxFQUFFLElBQUksRUFDVixTQUFTLEVBQUUscUJBQXFCLE1BQU0sRUFBRSxFQUN4QyxPQUFPLEVBQUUsTUFBQSxNQUFBLEdBQUcsQ0FBQyxVQUFVLDBDQUFFLG9CQUFvQixtQ0FBSSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsR0FDcEUsQ0FDSCxDQUFDO0FBQ0osQ0FBQztBQUVELGtCQUFlLGlCQUFpQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcclxuaW1wb3J0IHsgdG9vbHRpcCwgdHlwZXMgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuaW1wb3J0IHsgQ29tcGF0aWJpbGl0eVN0YXR1cyB9IGZyb20gJy4vdHlwZXMnO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJQ29tcGF0aWJpbGl0eUljb25Qcm9wcyB7XHJcbiAgdDogdHlwZXMuVEZ1bmN0aW9uLFxyXG4gIG1vZDogdHlwZXMuSU1vZCxcclxuICBkZXRhaWxDZWxsOiBib29sZWFuLFxyXG59XHJcblxyXG5jb25zdCBpY29uTWFwOiBSZWNvcmQ8Q29tcGF0aWJpbGl0eVN0YXR1cywgc3RyaW5nPiA9IHtcclxuICBicm9rZW46ICdmZWVkYmFjay1lcnJvcicsXHJcbiAgb2Jzb2xldGU6ICdmZWVkYmFjay1lcnJvcicsXHJcbiAgYWJhbmRvbmVkOiAnZmVlZGJhY2std2FybmluZycsXHJcbiAgdW5vZmZpY2lhbDogJ2ZlZWRiYWNrLXdhcm5pbmcnLFxyXG4gIHdvcmthcm91bmQ6ICdmZWVkYmFjay13YXJuaW5nJyxcclxuICB1bmtub3duOiAnZmVlZGJhY2staW5mbycsXHJcbiAgb3B0aW9uYWw6ICdmZWVkYmFjay1zdWNjZXNzJyxcclxuICBvazogJ2ZlZWRiYWNrLXN1Y2Nlc3MnLFxyXG59O1xyXG5cclxuZnVuY3Rpb24gQ29tcGF0aWJpbGl0eUljb24ocHJvcHM6IElDb21wYXRpYmlsaXR5SWNvblByb3BzKSB7XHJcbiAgY29uc3QgeyB0LCBtb2QgfSA9IHByb3BzO1xyXG5cclxuICBjb25zdCB2ZXJzaW9uID0gbW9kLmF0dHJpYnV0ZXM/Lm1hbmlmZXN0VmVyc2lvblxyXG4gICAgICAgICAgICAgICA/PyBtb2QuYXR0cmlidXRlcz8udmVyc2lvbjtcclxuXHJcbiAgaWYgKChtb2QuYXR0cmlidXRlcz8uY29tcGF0aWJpbGl0eVVwZGF0ZSAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAmJiAobW9kLmF0dHJpYnV0ZXM/LmNvbXBhdGliaWxpdHlVcGRhdGUgIT09IHZlcnNpb24pKSB7XHJcbiAgICByZXR1cm4gKFxyXG4gICAgICA8dG9vbHRpcC5JY29uXHJcbiAgICAgICAgbmFtZT0nYXV0by11cGRhdGUnXHJcbiAgICAgICAgdG9vbHRpcD17dCgnU01BUEkgc3VnZ2VzdHMgdXBkYXRpbmcgdGhpcyBtb2QgdG8ge3t1cGRhdGV9fS4gJ1xyXG4gICAgICAgICAgICAgICAgICArICdQbGVhc2UgdXNlIFZvcnRleCB0byBjaGVjayBmb3IgbW9kIHVwZGF0ZXMnLCB7XHJcbiAgICAgICAgICByZXBsYWNlOiB7XHJcbiAgICAgICAgICAgIHVwZGF0ZTogbW9kLmF0dHJpYnV0ZXM/LmNvbXBhdGliaWxpdHlVcGRhdGUsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0pfVxyXG4gICAgICAvPlxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IHN0YXR1cyA9IChtb2QuYXR0cmlidXRlcz8uY29tcGF0aWJpbGl0eVN0YXR1cyA/PyAndW5rbm93bicpLnRvTG93ZXJDYXNlKCk7XHJcbiAgY29uc3QgaWNvbiA9IGljb25NYXBbc3RhdHVzXSA/PyBpY29uTWFwWyd1bmtub3duJ107XHJcbiAgcmV0dXJuIChcclxuICAgIDx0b29sdGlwLkljb25cclxuICAgICAgbmFtZT17aWNvbn1cclxuICAgICAgY2xhc3NOYW1lPXtgc2R2LWNvbXBhdGliaWxpdHktJHtzdGF0dXN9YH1cclxuICAgICAgdG9vbHRpcD17bW9kLmF0dHJpYnV0ZXM/LmNvbXBhdGliaWxpdHlNZXNzYWdlID8/IHQoJ05vIGluZm9ybWF0aW9uJyl9XHJcbiAgICAvPlxyXG4gICk7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IENvbXBhdGliaWxpdHlJY29uO1xyXG4iXX0=