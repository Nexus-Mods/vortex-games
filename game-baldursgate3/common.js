"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NOTIF_IMPORT_ACTIVITY = exports.LSLIB_FILES = exports.ORIGINAL_FILES = exports.MOD_TYPE_LOOSE = exports.MOD_TYPE_REPLACER = exports.MOD_TYPE_BG3SE = exports.MOD_TYPE_LSLIB = exports.IGNORE_PATTERNS = exports.INVALID_LO_MOD_TYPES = exports.LO_FILE_NAME = exports.LSLIB_URL = exports.DEBUG = exports.GAME_ID = exports.DEFAULT_MOD_SETTINGS_V6 = exports.DEFAULT_MOD_SETTINGS_V7 = void 0;
const path_1 = __importDefault(require("path"));
exports.DEFAULT_MOD_SETTINGS_V7 = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<save>
  <version major="4" minor="7" revision="1" build="3"/>
  <region id="ModuleSettings">
    <node id="root">
      <children>
        <node id="Mods">
          <children>
            <node id="ModuleShortDesc">
              <attribute id="Folder" type="LSString" value="GustavDev"/>
              <attribute id="MD5" type="LSString" value=""/>
              <attribute id="Name" type="LSString" value="GustavDev"/>
              <attribute id="PublishHandle" type="uint64" value="0"/>
              <attribute id="UUID" type="guid" value="28ac9ce2-2aba-8cda-b3b5-6e922f71b6b8"/>
              <attribute id="Version64" type="int64" value="36028797018963968"/>
            </node>
          </children>
        </node>
      </children>
    </node>
  </region>
</save>`;
exports.DEFAULT_MOD_SETTINGS_V6 = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<save>
  <version major="4" minor="0" revision="10" build="100"/>
  <region id="ModuleSettings">
    <node id="root">
      <children>
        <node id="ModOrder">
          <children/>
        </node>
        <node id="Mods">
          <children>
            <node id="ModuleShortDesc">
              <attribute id="Folder" type="LSString" value="GustavDev"/>
              <attribute id="MD5" type="LSString" value=""/>
              <attribute id="Name" type="LSString" value="GustavDev"/>
              <attribute id="UUID" type="FixedString" value="28ac9ce2-2aba-8cda-b3b5-6e922f71b6b8"/>
              <attribute id="Version64" type="int64" value="36028797018963968"/>
            </node>
          </children>
        </node>
      </children>
    </node>
  </region>
</save>`;
exports.GAME_ID = 'baldursgate3';
exports.DEBUG = true;
exports.LSLIB_URL = 'https://github.com/Norbyte/lslib';
exports.LO_FILE_NAME = 'loadOrder.json';
exports.INVALID_LO_MOD_TYPES = ['bg3-lslib-divine-tool', 'bg3-bg3se', 'bg3-replacer', 'bg3-loose', 'dinput'];
exports.IGNORE_PATTERNS = [
    path_1.default.join('**', 'info.json'),
];
exports.MOD_TYPE_LSLIB = 'bg3-lslib-divine-tool';
exports.MOD_TYPE_BG3SE = 'bg3-bg3se';
exports.MOD_TYPE_REPLACER = 'bg3-replacer';
exports.MOD_TYPE_LOOSE = 'bg3-loose';
exports.ORIGINAL_FILES = new Set([
    'assets.pak',
    'assets.pak',
    'effects.pak',
    'engine.pak',
    'engineshaders.pak',
    'game.pak',
    'gameplatform.pak',
    'gustav.pak',
    'gustav_textures.pak',
    'icons.pak',
    'lowtex.pak',
    'materials.pak',
    'minimaps.pak',
    'models.pak',
    'shared.pak',
    'sharedsoundbanks.pak',
    'sharedsounds.pak',
    'textures.pak',
    'virtualtextures.pak',
]);
exports.LSLIB_FILES = new Set([
    'divine.exe',
    'lslib.dll',
]);
exports.NOTIF_IMPORT_ACTIVITY = 'bg3-loadorder-import-activity';
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY29tbW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGdEQUF3QjtBQUNYLFFBQUEsdUJBQXVCLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztRQXFCL0IsQ0FBQztBQUVJLFFBQUEsdUJBQXVCLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1FBdUIvQixDQUFDO0FBQ0ksUUFBQSxPQUFPLEdBQUcsY0FBYyxDQUFDO0FBQ3pCLFFBQUEsS0FBSyxHQUFHLElBQUksQ0FBQztBQUNiLFFBQUEsU0FBUyxHQUFHLGtDQUFrQyxDQUFDO0FBQy9DLFFBQUEsWUFBWSxHQUFHLGdCQUFnQixDQUFDO0FBQ2hDLFFBQUEsb0JBQW9CLEdBQUcsQ0FBQyx1QkFBdUIsRUFBRSxXQUFXLEVBQUUsY0FBYyxFQUFFLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQztBQUVyRyxRQUFBLGVBQWUsR0FBRztJQUM3QixjQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxXQUFXLENBQUM7Q0FDN0IsQ0FBQztBQUNXLFFBQUEsY0FBYyxHQUFHLHVCQUF1QixDQUFDO0FBQ3pDLFFBQUEsY0FBYyxHQUFHLFdBQVcsQ0FBQztBQUM3QixRQUFBLGlCQUFpQixHQUFHLGNBQWMsQ0FBQztBQUNuQyxRQUFBLGNBQWMsR0FBRyxXQUFXLENBQUM7QUFFN0IsUUFBQSxjQUFjLEdBQUcsSUFBSSxHQUFHLENBQUM7SUFDcEMsWUFBWTtJQUNaLFlBQVk7SUFDWixhQUFhO0lBQ2IsWUFBWTtJQUNaLG1CQUFtQjtJQUNuQixVQUFVO0lBQ1Ysa0JBQWtCO0lBQ2xCLFlBQVk7SUFDWixxQkFBcUI7SUFDckIsV0FBVztJQUNYLFlBQVk7SUFDWixlQUFlO0lBQ2YsY0FBYztJQUNkLFlBQVk7SUFDWixZQUFZO0lBQ1osc0JBQXNCO0lBQ3RCLGtCQUFrQjtJQUNsQixjQUFjO0lBQ2QscUJBQXFCO0NBQ3RCLENBQUMsQ0FBQztBQUVVLFFBQUEsV0FBVyxHQUFHLElBQUksR0FBRyxDQUFDO0lBQ2pDLFlBQVk7SUFDWixXQUFXO0NBQ1osQ0FBQyxDQUFDO0FBRVUsUUFBQSxxQkFBcUIsR0FBRywrQkFBK0IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5leHBvcnQgY29uc3QgREVGQVVMVF9NT0RfU0VUVElOR1NfVjcgPSBgPD94bWwgdmVyc2lvbj1cIjEuMFwiIGVuY29kaW5nPVwiVVRGLThcIiBzdGFuZGFsb25lPVwieWVzXCI/PlxyXG48c2F2ZT5cclxuICA8dmVyc2lvbiBtYWpvcj1cIjRcIiBtaW5vcj1cIjdcIiByZXZpc2lvbj1cIjFcIiBidWlsZD1cIjNcIi8+XHJcbiAgPHJlZ2lvbiBpZD1cIk1vZHVsZVNldHRpbmdzXCI+XHJcbiAgICA8bm9kZSBpZD1cInJvb3RcIj5cclxuICAgICAgPGNoaWxkcmVuPlxyXG4gICAgICAgIDxub2RlIGlkPVwiTW9kc1wiPlxyXG4gICAgICAgICAgPGNoaWxkcmVuPlxyXG4gICAgICAgICAgICA8bm9kZSBpZD1cIk1vZHVsZVNob3J0RGVzY1wiPlxyXG4gICAgICAgICAgICAgIDxhdHRyaWJ1dGUgaWQ9XCJGb2xkZXJcIiB0eXBlPVwiTFNTdHJpbmdcIiB2YWx1ZT1cIkd1c3RhdkRldlwiLz5cclxuICAgICAgICAgICAgICA8YXR0cmlidXRlIGlkPVwiTUQ1XCIgdHlwZT1cIkxTU3RyaW5nXCIgdmFsdWU9XCJcIi8+XHJcbiAgICAgICAgICAgICAgPGF0dHJpYnV0ZSBpZD1cIk5hbWVcIiB0eXBlPVwiTFNTdHJpbmdcIiB2YWx1ZT1cIkd1c3RhdkRldlwiLz5cclxuICAgICAgICAgICAgICA8YXR0cmlidXRlIGlkPVwiUHVibGlzaEhhbmRsZVwiIHR5cGU9XCJ1aW50NjRcIiB2YWx1ZT1cIjBcIi8+XHJcbiAgICAgICAgICAgICAgPGF0dHJpYnV0ZSBpZD1cIlVVSURcIiB0eXBlPVwiZ3VpZFwiIHZhbHVlPVwiMjhhYzljZTItMmFiYS04Y2RhLWIzYjUtNmU5MjJmNzFiNmI4XCIvPlxyXG4gICAgICAgICAgICAgIDxhdHRyaWJ1dGUgaWQ9XCJWZXJzaW9uNjRcIiB0eXBlPVwiaW50NjRcIiB2YWx1ZT1cIjM2MDI4Nzk3MDE4OTYzOTY4XCIvPlxyXG4gICAgICAgICAgICA8L25vZGU+XHJcbiAgICAgICAgICA8L2NoaWxkcmVuPlxyXG4gICAgICAgIDwvbm9kZT5cclxuICAgICAgPC9jaGlsZHJlbj5cclxuICAgIDwvbm9kZT5cclxuICA8L3JlZ2lvbj5cclxuPC9zYXZlPmA7XHJcblxyXG5leHBvcnQgY29uc3QgREVGQVVMVF9NT0RfU0VUVElOR1NfVjYgPSBgPD94bWwgdmVyc2lvbj1cIjEuMFwiIGVuY29kaW5nPVwiVVRGLThcIiBzdGFuZGFsb25lPVwieWVzXCI/PlxyXG48c2F2ZT5cclxuICA8dmVyc2lvbiBtYWpvcj1cIjRcIiBtaW5vcj1cIjBcIiByZXZpc2lvbj1cIjEwXCIgYnVpbGQ9XCIxMDBcIi8+XHJcbiAgPHJlZ2lvbiBpZD1cIk1vZHVsZVNldHRpbmdzXCI+XHJcbiAgICA8bm9kZSBpZD1cInJvb3RcIj5cclxuICAgICAgPGNoaWxkcmVuPlxyXG4gICAgICAgIDxub2RlIGlkPVwiTW9kT3JkZXJcIj5cclxuICAgICAgICAgIDxjaGlsZHJlbi8+XHJcbiAgICAgICAgPC9ub2RlPlxyXG4gICAgICAgIDxub2RlIGlkPVwiTW9kc1wiPlxyXG4gICAgICAgICAgPGNoaWxkcmVuPlxyXG4gICAgICAgICAgICA8bm9kZSBpZD1cIk1vZHVsZVNob3J0RGVzY1wiPlxyXG4gICAgICAgICAgICAgIDxhdHRyaWJ1dGUgaWQ9XCJGb2xkZXJcIiB0eXBlPVwiTFNTdHJpbmdcIiB2YWx1ZT1cIkd1c3RhdkRldlwiLz5cclxuICAgICAgICAgICAgICA8YXR0cmlidXRlIGlkPVwiTUQ1XCIgdHlwZT1cIkxTU3RyaW5nXCIgdmFsdWU9XCJcIi8+XHJcbiAgICAgICAgICAgICAgPGF0dHJpYnV0ZSBpZD1cIk5hbWVcIiB0eXBlPVwiTFNTdHJpbmdcIiB2YWx1ZT1cIkd1c3RhdkRldlwiLz5cclxuICAgICAgICAgICAgICA8YXR0cmlidXRlIGlkPVwiVVVJRFwiIHR5cGU9XCJGaXhlZFN0cmluZ1wiIHZhbHVlPVwiMjhhYzljZTItMmFiYS04Y2RhLWIzYjUtNmU5MjJmNzFiNmI4XCIvPlxyXG4gICAgICAgICAgICAgIDxhdHRyaWJ1dGUgaWQ9XCJWZXJzaW9uNjRcIiB0eXBlPVwiaW50NjRcIiB2YWx1ZT1cIjM2MDI4Nzk3MDE4OTYzOTY4XCIvPlxyXG4gICAgICAgICAgICA8L25vZGU+XHJcbiAgICAgICAgICA8L2NoaWxkcmVuPlxyXG4gICAgICAgIDwvbm9kZT5cclxuICAgICAgPC9jaGlsZHJlbj5cclxuICAgIDwvbm9kZT5cclxuICA8L3JlZ2lvbj5cclxuPC9zYXZlPmA7XHJcbmV4cG9ydCBjb25zdCBHQU1FX0lEID0gJ2JhbGR1cnNnYXRlMyc7XHJcbmV4cG9ydCBjb25zdCBERUJVRyA9IHRydWU7XHJcbmV4cG9ydCBjb25zdCBMU0xJQl9VUkwgPSAnaHR0cHM6Ly9naXRodWIuY29tL05vcmJ5dGUvbHNsaWInO1xyXG5leHBvcnQgY29uc3QgTE9fRklMRV9OQU1FID0gJ2xvYWRPcmRlci5qc29uJztcclxuZXhwb3J0IGNvbnN0IElOVkFMSURfTE9fTU9EX1RZUEVTID0gWydiZzMtbHNsaWItZGl2aW5lLXRvb2wnLCAnYmczLWJnM3NlJywgJ2JnMy1yZXBsYWNlcicsICdiZzMtbG9vc2UnLCAnZGlucHV0J107XHJcblxyXG5leHBvcnQgY29uc3QgSUdOT1JFX1BBVFRFUk5TID0gW1xyXG4gIHBhdGguam9pbignKionLCAnaW5mby5qc29uJyksXHJcbl07XHJcbmV4cG9ydCBjb25zdCBNT0RfVFlQRV9MU0xJQiA9ICdiZzMtbHNsaWItZGl2aW5lLXRvb2wnO1xyXG5leHBvcnQgY29uc3QgTU9EX1RZUEVfQkczU0UgPSAnYmczLWJnM3NlJztcclxuZXhwb3J0IGNvbnN0IE1PRF9UWVBFX1JFUExBQ0VSID0gJ2JnMy1yZXBsYWNlcic7XHJcbmV4cG9ydCBjb25zdCBNT0RfVFlQRV9MT09TRSA9ICdiZzMtbG9vc2UnO1xyXG5cclxuZXhwb3J0IGNvbnN0IE9SSUdJTkFMX0ZJTEVTID0gbmV3IFNldChbXHJcbiAgJ2Fzc2V0cy5wYWsnLFxyXG4gICdhc3NldHMucGFrJyxcclxuICAnZWZmZWN0cy5wYWsnLFxyXG4gICdlbmdpbmUucGFrJyxcclxuICAnZW5naW5lc2hhZGVycy5wYWsnLFxyXG4gICdnYW1lLnBhaycsXHJcbiAgJ2dhbWVwbGF0Zm9ybS5wYWsnLFxyXG4gICdndXN0YXYucGFrJyxcclxuICAnZ3VzdGF2X3RleHR1cmVzLnBhaycsXHJcbiAgJ2ljb25zLnBhaycsXHJcbiAgJ2xvd3RleC5wYWsnLFxyXG4gICdtYXRlcmlhbHMucGFrJyxcclxuICAnbWluaW1hcHMucGFrJyxcclxuICAnbW9kZWxzLnBhaycsXHJcbiAgJ3NoYXJlZC5wYWsnLFxyXG4gICdzaGFyZWRzb3VuZGJhbmtzLnBhaycsXHJcbiAgJ3NoYXJlZHNvdW5kcy5wYWsnLFxyXG4gICd0ZXh0dXJlcy5wYWsnLFxyXG4gICd2aXJ0dWFsdGV4dHVyZXMucGFrJyxcclxuXSk7XHJcblxyXG5leHBvcnQgY29uc3QgTFNMSUJfRklMRVMgPSBuZXcgU2V0KFtcclxuICAnZGl2aW5lLmV4ZScsXHJcbiAgJ2xzbGliLmRsbCcsXHJcbl0pO1xyXG5cclxuZXhwb3J0IGNvbnN0IE5PVElGX0lNUE9SVF9BQ1RJVklUWSA9ICdiZzMtbG9hZG9yZGVyLWltcG9ydC1hY3Rpdml0eSc7Il19