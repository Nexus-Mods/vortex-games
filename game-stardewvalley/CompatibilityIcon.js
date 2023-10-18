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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29tcGF0aWJpbGl0eUljb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJDb21wYXRpYmlsaXR5SWNvbi50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxrREFBMEI7QUFDMUIsMkNBQTRDO0FBUzVDLE1BQU0sT0FBTyxHQUF3QztJQUNuRCxNQUFNLEVBQUUsZ0JBQWdCO0lBQ3hCLFFBQVEsRUFBRSxnQkFBZ0I7SUFDMUIsU0FBUyxFQUFFLGtCQUFrQjtJQUM3QixVQUFVLEVBQUUsa0JBQWtCO0lBQzlCLFVBQVUsRUFBRSxrQkFBa0I7SUFDOUIsT0FBTyxFQUFFLGVBQWU7SUFDeEIsUUFBUSxFQUFFLGtCQUFrQjtJQUM1QixFQUFFLEVBQUUsa0JBQWtCO0NBQ3ZCLENBQUM7QUFFRixTQUFTLGlCQUFpQixDQUFDLEtBQThCOztJQUN2RCxNQUFNLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEtBQUssQ0FBQztJQUV6QixNQUFNLE9BQU8sR0FBRyxNQUFBLE1BQUEsR0FBRyxDQUFDLFVBQVUsMENBQUUsZUFBZSxtQ0FDL0IsTUFBQSxHQUFHLENBQUMsVUFBVSwwQ0FBRSxPQUFPLENBQUM7SUFFeEMsSUFBSSxDQUFDLENBQUEsTUFBQSxHQUFHLENBQUMsVUFBVSwwQ0FBRSxtQkFBbUIsTUFBSyxTQUFTLENBQUM7V0FDaEQsQ0FBQyxDQUFBLE1BQUEsR0FBRyxDQUFDLFVBQVUsMENBQUUsbUJBQW1CLE1BQUssT0FBTyxDQUFDLEVBQUU7UUFDeEQsT0FBTyxDQUNMLDhCQUFDLG9CQUFPLENBQUMsSUFBSSxJQUNYLElBQUksRUFBQyxhQUFhLEVBQ2xCLE9BQU8sRUFBRSxDQUFDLENBQUMsa0RBQWtEO2tCQUNqRCw0Q0FBNEMsRUFBRTtnQkFDeEQsT0FBTyxFQUFFO29CQUNQLE1BQU0sRUFBRSxNQUFBLEdBQUcsQ0FBQyxVQUFVLDBDQUFFLG1CQUFtQjtpQkFDNUM7YUFDRixDQUFDLEdBQ0YsQ0FDSCxDQUFDO0tBQ0g7SUFFRCxNQUFNLE1BQU0sR0FBRyxDQUFDLE1BQUEsTUFBQSxHQUFHLENBQUMsVUFBVSwwQ0FBRSxtQkFBbUIsbUNBQUksU0FBUyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDaEYsTUFBTSxJQUFJLEdBQUcsTUFBQSxPQUFPLENBQUMsTUFBTSxDQUFDLG1DQUFJLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUNuRCxPQUFPLENBQ0wsOEJBQUMsb0JBQU8sQ0FBQyxJQUFJLElBQ1gsSUFBSSxFQUFFLElBQUksRUFDVixTQUFTLEVBQUUscUJBQXFCLE1BQU0sRUFBRSxFQUN4QyxPQUFPLEVBQUUsTUFBQSxNQUFBLEdBQUcsQ0FBQyxVQUFVLDBDQUFFLG9CQUFvQixtQ0FBSSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsR0FDcEUsQ0FDSCxDQUFDO0FBQ0osQ0FBQztBQUVELGtCQUFlLGlCQUFpQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IHRvb2x0aXAsIHR5cGVzIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5pbXBvcnQgeyBDb21wYXRpYmlsaXR5U3RhdHVzIH0gZnJvbSAnLi90eXBlcyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUNvbXBhdGliaWxpdHlJY29uUHJvcHMge1xuICB0OiB0eXBlcy5URnVuY3Rpb24sXG4gIG1vZDogdHlwZXMuSU1vZCxcbiAgZGV0YWlsQ2VsbDogYm9vbGVhbixcbn1cblxuY29uc3QgaWNvbk1hcDogUmVjb3JkPENvbXBhdGliaWxpdHlTdGF0dXMsIHN0cmluZz4gPSB7XG4gIGJyb2tlbjogJ2ZlZWRiYWNrLWVycm9yJyxcbiAgb2Jzb2xldGU6ICdmZWVkYmFjay1lcnJvcicsXG4gIGFiYW5kb25lZDogJ2ZlZWRiYWNrLXdhcm5pbmcnLFxuICB1bm9mZmljaWFsOiAnZmVlZGJhY2std2FybmluZycsXG4gIHdvcmthcm91bmQ6ICdmZWVkYmFjay13YXJuaW5nJyxcbiAgdW5rbm93bjogJ2ZlZWRiYWNrLWluZm8nLFxuICBvcHRpb25hbDogJ2ZlZWRiYWNrLXN1Y2Nlc3MnLFxuICBvazogJ2ZlZWRiYWNrLXN1Y2Nlc3MnLFxufTtcblxuZnVuY3Rpb24gQ29tcGF0aWJpbGl0eUljb24ocHJvcHM6IElDb21wYXRpYmlsaXR5SWNvblByb3BzKSB7XG4gIGNvbnN0IHsgdCwgbW9kIH0gPSBwcm9wcztcblxuICBjb25zdCB2ZXJzaW9uID0gbW9kLmF0dHJpYnV0ZXM/Lm1hbmlmZXN0VmVyc2lvblxuICAgICAgICAgICAgICAgPz8gbW9kLmF0dHJpYnV0ZXM/LnZlcnNpb247XG5cbiAgaWYgKChtb2QuYXR0cmlidXRlcz8uY29tcGF0aWJpbGl0eVVwZGF0ZSAhPT0gdW5kZWZpbmVkKVxuICAgICAgJiYgKG1vZC5hdHRyaWJ1dGVzPy5jb21wYXRpYmlsaXR5VXBkYXRlICE9PSB2ZXJzaW9uKSkge1xuICAgIHJldHVybiAoXG4gICAgICA8dG9vbHRpcC5JY29uXG4gICAgICAgIG5hbWU9J2F1dG8tdXBkYXRlJ1xuICAgICAgICB0b29sdGlwPXt0KCdTTUFQSSBzdWdnZXN0cyB1cGRhdGluZyB0aGlzIG1vZCB0byB7e3VwZGF0ZX19LiAnXG4gICAgICAgICAgICAgICAgICArICdQbGVhc2UgdXNlIFZvcnRleCB0byBjaGVjayBmb3IgbW9kIHVwZGF0ZXMnLCB7XG4gICAgICAgICAgcmVwbGFjZToge1xuICAgICAgICAgICAgdXBkYXRlOiBtb2QuYXR0cmlidXRlcz8uY29tcGF0aWJpbGl0eVVwZGF0ZSxcbiAgICAgICAgICB9LFxuICAgICAgICB9KX1cbiAgICAgIC8+XG4gICAgKTtcbiAgfVxuXG4gIGNvbnN0IHN0YXR1cyA9IChtb2QuYXR0cmlidXRlcz8uY29tcGF0aWJpbGl0eVN0YXR1cyA/PyAndW5rbm93bicpLnRvTG93ZXJDYXNlKCk7XG4gIGNvbnN0IGljb24gPSBpY29uTWFwW3N0YXR1c10gPz8gaWNvbk1hcFsndW5rbm93biddO1xuICByZXR1cm4gKFxuICAgIDx0b29sdGlwLkljb25cbiAgICAgIG5hbWU9e2ljb259XG4gICAgICBjbGFzc05hbWU9e2BzZHYtY29tcGF0aWJpbGl0eS0ke3N0YXR1c31gfVxuICAgICAgdG9vbHRpcD17bW9kLmF0dHJpYnV0ZXM/LmNvbXBhdGliaWxpdHlNZXNzYWdlID8/IHQoJ05vIGluZm9ybWF0aW9uJyl9XG4gICAgLz5cbiAgKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgQ29tcGF0aWJpbGl0eUljb247XG4iXX0=