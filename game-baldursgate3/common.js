"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IGNORE_PATTERNS = exports.INVALID_LO_MOD_TYPES = exports.LO_FILE_NAME = exports.LSLIB_URL = exports.GAME_ID = exports.DEFAULT_MOD_SETTINGS = void 0;
const path_1 = __importDefault(require("path"));
exports.DEFAULT_MOD_SETTINGS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
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
exports.LSLIB_URL = 'https://github.com/Norbyte/lslib';
exports.LO_FILE_NAME = 'loadOrder.json';
exports.INVALID_LO_MOD_TYPES = ['bg3-lslib-divine-tool', 'bg3-bg3se', 'bg3-replacer', 'bg3-loose', 'dinput'];
exports.IGNORE_PATTERNS = [
    path_1.default.join('**', 'info.json'),
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY29tbW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGdEQUF3QjtBQUNYLFFBQUEsb0JBQW9CLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1FBdUI1QixDQUFDO0FBQ0ksUUFBQSxPQUFPLEdBQUcsY0FBYyxDQUFDO0FBQ3pCLFFBQUEsU0FBUyxHQUFHLGtDQUFrQyxDQUFDO0FBQy9DLFFBQUEsWUFBWSxHQUFHLGdCQUFnQixDQUFDO0FBQ2hDLFFBQUEsb0JBQW9CLEdBQUcsQ0FBQyx1QkFBdUIsRUFBRSxXQUFXLEVBQUUsY0FBYyxFQUFFLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQztBQUVyRyxRQUFBLGVBQWUsR0FBRztJQUM3QixjQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxXQUFXLENBQUM7Q0FDN0IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5leHBvcnQgY29uc3QgREVGQVVMVF9NT0RfU0VUVElOR1MgPSBgPD94bWwgdmVyc2lvbj1cIjEuMFwiIGVuY29kaW5nPVwiVVRGLThcIiBzdGFuZGFsb25lPVwieWVzXCI/PlxyXG48c2F2ZT5cclxuICA8dmVyc2lvbiBtYWpvcj1cIjRcIiBtaW5vcj1cIjBcIiByZXZpc2lvbj1cIjEwXCIgYnVpbGQ9XCIxMDBcIi8+XHJcbiAgPHJlZ2lvbiBpZD1cIk1vZHVsZVNldHRpbmdzXCI+XHJcbiAgICA8bm9kZSBpZD1cInJvb3RcIj5cclxuICAgICAgPGNoaWxkcmVuPlxyXG4gICAgICAgIDxub2RlIGlkPVwiTW9kT3JkZXJcIj5cclxuICAgICAgICAgIDxjaGlsZHJlbi8+XHJcbiAgICAgICAgPC9ub2RlPlxyXG4gICAgICAgIDxub2RlIGlkPVwiTW9kc1wiPlxyXG4gICAgICAgICAgPGNoaWxkcmVuPlxyXG4gICAgICAgICAgICA8bm9kZSBpZD1cIk1vZHVsZVNob3J0RGVzY1wiPlxyXG4gICAgICAgICAgICAgIDxhdHRyaWJ1dGUgaWQ9XCJGb2xkZXJcIiB0eXBlPVwiTFNTdHJpbmdcIiB2YWx1ZT1cIkd1c3RhdkRldlwiLz5cclxuICAgICAgICAgICAgICA8YXR0cmlidXRlIGlkPVwiTUQ1XCIgdHlwZT1cIkxTU3RyaW5nXCIgdmFsdWU9XCJcIi8+XHJcbiAgICAgICAgICAgICAgPGF0dHJpYnV0ZSBpZD1cIk5hbWVcIiB0eXBlPVwiTFNTdHJpbmdcIiB2YWx1ZT1cIkd1c3RhdkRldlwiLz5cclxuICAgICAgICAgICAgICA8YXR0cmlidXRlIGlkPVwiVVVJRFwiIHR5cGU9XCJGaXhlZFN0cmluZ1wiIHZhbHVlPVwiMjhhYzljZTItMmFiYS04Y2RhLWIzYjUtNmU5MjJmNzFiNmI4XCIvPlxyXG4gICAgICAgICAgICAgIDxhdHRyaWJ1dGUgaWQ9XCJWZXJzaW9uNjRcIiB0eXBlPVwiaW50NjRcIiB2YWx1ZT1cIjM2MDI4Nzk3MDE4OTYzOTY4XCIvPlxyXG4gICAgICAgICAgICA8L25vZGU+XHJcbiAgICAgICAgICA8L2NoaWxkcmVuPlxyXG4gICAgICAgIDwvbm9kZT5cclxuICAgICAgPC9jaGlsZHJlbj5cclxuICAgIDwvbm9kZT5cclxuICA8L3JlZ2lvbj5cclxuPC9zYXZlPmA7XHJcbmV4cG9ydCBjb25zdCBHQU1FX0lEID0gJ2JhbGR1cnNnYXRlMyc7XHJcbmV4cG9ydCBjb25zdCBMU0xJQl9VUkwgPSAnaHR0cHM6Ly9naXRodWIuY29tL05vcmJ5dGUvbHNsaWInO1xyXG5leHBvcnQgY29uc3QgTE9fRklMRV9OQU1FID0gJ2xvYWRPcmRlci5qc29uJztcclxuZXhwb3J0IGNvbnN0IElOVkFMSURfTE9fTU9EX1RZUEVTID0gWydiZzMtbHNsaWItZGl2aW5lLXRvb2wnLCAnYmczLWJnM3NlJywgJ2JnMy1yZXBsYWNlcicsICdiZzMtbG9vc2UnLCAnZGlucHV0J107XHJcblxyXG5leHBvcnQgY29uc3QgSUdOT1JFX1BBVFRFUk5TID0gW1xyXG4gIHBhdGguam9pbignKionLCAnaW5mby5qc29uJyksXHJcbl07Il19