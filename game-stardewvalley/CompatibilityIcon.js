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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29tcGF0aWJpbGl0eUljb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJDb21wYXRpYmlsaXR5SWNvbi50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxrREFBMEI7QUFDMUIsMkNBQTRDO0FBUzVDLE1BQU0sT0FBTyxHQUF3QztJQUNuRCxNQUFNLEVBQUUsZ0JBQWdCO0lBQ3hCLFFBQVEsRUFBRSxnQkFBZ0I7SUFDMUIsU0FBUyxFQUFFLGtCQUFrQjtJQUM3QixVQUFVLEVBQUUsa0JBQWtCO0lBQzlCLFVBQVUsRUFBRSxrQkFBa0I7SUFDOUIsT0FBTyxFQUFFLGVBQWU7SUFDeEIsUUFBUSxFQUFFLGtCQUFrQjtJQUM1QixFQUFFLEVBQUUsa0JBQWtCO0NBQ3ZCLENBQUM7QUFFRixTQUFTLGlCQUFpQixDQUFDLEtBQThCOztJQUN2RCxNQUFNLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEtBQUssQ0FBQztJQUV6QixNQUFNLE9BQU8sR0FBRyxNQUFBLE1BQUEsR0FBRyxDQUFDLFVBQVUsMENBQUUsZUFBZSxtQ0FDL0IsTUFBQSxHQUFHLENBQUMsVUFBVSwwQ0FBRSxPQUFPLENBQUM7SUFFeEMsSUFBSSxDQUFDLENBQUEsTUFBQSxHQUFHLENBQUMsVUFBVSwwQ0FBRSxtQkFBbUIsTUFBSyxTQUFTLENBQUM7V0FDaEQsQ0FBQyxDQUFBLE1BQUEsR0FBRyxDQUFDLFVBQVUsMENBQUUsbUJBQW1CLE1BQUssT0FBTyxDQUFDLEVBQUUsQ0FBQztRQUN6RCxPQUFPLENBQ0wsOEJBQUMsb0JBQU8sQ0FBQyxJQUFJLElBQ1gsSUFBSSxFQUFDLGFBQWEsRUFDbEIsT0FBTyxFQUFFLENBQUMsQ0FBQyxrREFBa0Q7a0JBQ2pELDRDQUE0QyxFQUFFO2dCQUN4RCxPQUFPLEVBQUU7b0JBQ1AsTUFBTSxFQUFFLE1BQUEsR0FBRyxDQUFDLFVBQVUsMENBQUUsbUJBQW1CO2lCQUM1QzthQUNGLENBQUMsR0FDRixDQUNILENBQUM7SUFDSixDQUFDO0lBRUQsTUFBTSxNQUFNLEdBQUcsQ0FBQyxNQUFBLE1BQUEsR0FBRyxDQUFDLFVBQVUsMENBQUUsbUJBQW1CLG1DQUFJLFNBQVMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQ2hGLE1BQU0sSUFBSSxHQUFHLE1BQUEsT0FBTyxDQUFDLE1BQU0sQ0FBQyxtQ0FBSSxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDbkQsT0FBTyxDQUNMLDhCQUFDLG9CQUFPLENBQUMsSUFBSSxJQUNYLElBQUksRUFBRSxJQUFJLEVBQ1YsU0FBUyxFQUFFLHFCQUFxQixNQUFNLEVBQUUsRUFDeEMsT0FBTyxFQUFFLE1BQUEsTUFBQSxHQUFHLENBQUMsVUFBVSwwQ0FBRSxvQkFBb0IsbUNBQUksQ0FBQyxDQUFDLGdCQUFnQixDQUFDLEdBQ3BFLENBQ0gsQ0FBQztBQUNKLENBQUM7QUFFRCxrQkFBZSxpQkFBaUIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCB7IHRvb2x0aXAsIHR5cGVzIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcbmltcG9ydCB7IENvbXBhdGliaWxpdHlTdGF0dXMgfSBmcm9tICcuL3R5cGVzJztcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSUNvbXBhdGliaWxpdHlJY29uUHJvcHMge1xyXG4gIHQ6IHR5cGVzLlRGdW5jdGlvbixcclxuICBtb2Q6IHR5cGVzLklNb2QsXHJcbiAgZGV0YWlsQ2VsbDogYm9vbGVhbixcclxufVxyXG5cclxuY29uc3QgaWNvbk1hcDogUmVjb3JkPENvbXBhdGliaWxpdHlTdGF0dXMsIHN0cmluZz4gPSB7XHJcbiAgYnJva2VuOiAnZmVlZGJhY2stZXJyb3InLFxyXG4gIG9ic29sZXRlOiAnZmVlZGJhY2stZXJyb3InLFxyXG4gIGFiYW5kb25lZDogJ2ZlZWRiYWNrLXdhcm5pbmcnLFxyXG4gIHVub2ZmaWNpYWw6ICdmZWVkYmFjay13YXJuaW5nJyxcclxuICB3b3JrYXJvdW5kOiAnZmVlZGJhY2std2FybmluZycsXHJcbiAgdW5rbm93bjogJ2ZlZWRiYWNrLWluZm8nLFxyXG4gIG9wdGlvbmFsOiAnZmVlZGJhY2stc3VjY2VzcycsXHJcbiAgb2s6ICdmZWVkYmFjay1zdWNjZXNzJyxcclxufTtcclxuXHJcbmZ1bmN0aW9uIENvbXBhdGliaWxpdHlJY29uKHByb3BzOiBJQ29tcGF0aWJpbGl0eUljb25Qcm9wcykge1xyXG4gIGNvbnN0IHsgdCwgbW9kIH0gPSBwcm9wcztcclxuXHJcbiAgY29uc3QgdmVyc2lvbiA9IG1vZC5hdHRyaWJ1dGVzPy5tYW5pZmVzdFZlcnNpb25cclxuICAgICAgICAgICAgICAgPz8gbW9kLmF0dHJpYnV0ZXM/LnZlcnNpb247XHJcblxyXG4gIGlmICgobW9kLmF0dHJpYnV0ZXM/LmNvbXBhdGliaWxpdHlVcGRhdGUgIT09IHVuZGVmaW5lZClcclxuICAgICAgJiYgKG1vZC5hdHRyaWJ1dGVzPy5jb21wYXRpYmlsaXR5VXBkYXRlICE9PSB2ZXJzaW9uKSkge1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgPHRvb2x0aXAuSWNvblxyXG4gICAgICAgIG5hbWU9J2F1dG8tdXBkYXRlJ1xyXG4gICAgICAgIHRvb2x0aXA9e3QoJ1NNQVBJIHN1Z2dlc3RzIHVwZGF0aW5nIHRoaXMgbW9kIHRvIHt7dXBkYXRlfX0uICdcclxuICAgICAgICAgICAgICAgICAgKyAnUGxlYXNlIHVzZSBWb3J0ZXggdG8gY2hlY2sgZm9yIG1vZCB1cGRhdGVzJywge1xyXG4gICAgICAgICAgcmVwbGFjZToge1xyXG4gICAgICAgICAgICB1cGRhdGU6IG1vZC5hdHRyaWJ1dGVzPy5jb21wYXRpYmlsaXR5VXBkYXRlLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9KX1cclxuICAgICAgLz5cclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBzdGF0dXMgPSAobW9kLmF0dHJpYnV0ZXM/LmNvbXBhdGliaWxpdHlTdGF0dXMgPz8gJ3Vua25vd24nKS50b0xvd2VyQ2FzZSgpO1xyXG4gIGNvbnN0IGljb24gPSBpY29uTWFwW3N0YXR1c10gPz8gaWNvbk1hcFsndW5rbm93biddO1xyXG4gIHJldHVybiAoXHJcbiAgICA8dG9vbHRpcC5JY29uXHJcbiAgICAgIG5hbWU9e2ljb259XHJcbiAgICAgIGNsYXNzTmFtZT17YHNkdi1jb21wYXRpYmlsaXR5LSR7c3RhdHVzfWB9XHJcbiAgICAgIHRvb2x0aXA9e21vZC5hdHRyaWJ1dGVzPy5jb21wYXRpYmlsaXR5TWVzc2FnZSA/PyB0KCdObyBpbmZvcm1hdGlvbicpfVxyXG4gICAgLz5cclxuICApO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBDb21wYXRpYmlsaXR5SWNvbjtcclxuIl19