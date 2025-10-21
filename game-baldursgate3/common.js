"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NOTIF_IMPORT_ACTIVITY = exports.LSLIB_FILES = exports.ORIGINAL_FILES = exports.MOD_TYPE_LOOSE = exports.MOD_TYPE_REPLACER = exports.MOD_TYPE_BG3SE = exports.MOD_TYPE_LSLIB = exports.IGNORE_PATTERNS = exports.INVALID_LO_MOD_TYPES = exports.LO_FILE_NAME = exports.LSLIB_URL = exports.DEBUG = exports.GAME_ID = exports.DEFAULT_MOD_SETTINGS_V6 = exports.DEFAULT_MOD_SETTINGS_V7 = exports.DEFAULT_MOD_SETTINGS_V8 = void 0;
const path_1 = __importDefault(require("path"));
exports.DEFAULT_MOD_SETTINGS_V8 = `<?xml version="1.0" encoding="UTF-8"?>
<save>
    <version major="4" minor="8" revision="0" build="10"/>
    <region id="ModuleSettings">
        <node id="root">
            <children>
                <node id="Mods">
                    <children>
                        <node id="ModuleShortDesc">
                            <attribute id="Folder" type="LSString" value="GustavX"/>
                            <attribute id="MD5" type="LSString" value=""/>
                            <attribute id="Name" type="LSString" value="GustavX"/>
                            <attribute id="PublishHandle" type="uint64" value="0"/>
                            <attribute id="UUID" type="guid" value="cb555efe-2d9e-131f-8195-a89329d218ea"/>
                            <attribute id="Version64" type="int64" value="36028797018963968"/>
                        </node>
                    </children>
                </node>
            </children>
        </node>
    </region>
</save>`;
exports.DEFAULT_MOD_SETTINGS_V7 = `<?xml version="1.0" encoding="UTF-8"?>
<save>
  <version major="4" minor="7" revision="1" build="200"/>
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
exports.DEBUG = false;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY29tbW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGdEQUF3QjtBQUVYLFFBQUEsdUJBQXVCLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztRQXFCL0IsQ0FBQztBQUVJLFFBQUEsdUJBQXVCLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztRQXFCL0IsQ0FBQztBQUVJLFFBQUEsdUJBQXVCLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1FBdUIvQixDQUFDO0FBQ0ksUUFBQSxPQUFPLEdBQUcsY0FBYyxDQUFDO0FBQ3pCLFFBQUEsS0FBSyxHQUFHLEtBQUssQ0FBQztBQUNkLFFBQUEsU0FBUyxHQUFHLGtDQUFrQyxDQUFDO0FBQy9DLFFBQUEsWUFBWSxHQUFHLGdCQUFnQixDQUFDO0FBQ2hDLFFBQUEsb0JBQW9CLEdBQUcsQ0FBQyx1QkFBdUIsRUFBRSxXQUFXLEVBQUUsY0FBYyxFQUFFLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQztBQUVyRyxRQUFBLGVBQWUsR0FBRztJQUM3QixjQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxXQUFXLENBQUM7Q0FDN0IsQ0FBQztBQUNXLFFBQUEsY0FBYyxHQUFHLHVCQUF1QixDQUFDO0FBQ3pDLFFBQUEsY0FBYyxHQUFHLFdBQVcsQ0FBQztBQUM3QixRQUFBLGlCQUFpQixHQUFHLGNBQWMsQ0FBQztBQUNuQyxRQUFBLGNBQWMsR0FBRyxXQUFXLENBQUM7QUFFN0IsUUFBQSxjQUFjLEdBQUcsSUFBSSxHQUFHLENBQUM7SUFDcEMsWUFBWTtJQUNaLFlBQVk7SUFDWixhQUFhO0lBQ2IsWUFBWTtJQUNaLG1CQUFtQjtJQUNuQixVQUFVO0lBQ1Ysa0JBQWtCO0lBQ2xCLFlBQVk7SUFDWixxQkFBcUI7SUFDckIsV0FBVztJQUNYLFlBQVk7SUFDWixlQUFlO0lBQ2YsY0FBYztJQUNkLFlBQVk7SUFDWixZQUFZO0lBQ1osc0JBQXNCO0lBQ3RCLGtCQUFrQjtJQUNsQixjQUFjO0lBQ2QscUJBQXFCO0NBQ3RCLENBQUMsQ0FBQztBQUVVLFFBQUEsV0FBVyxHQUFHLElBQUksR0FBRyxDQUFDO0lBQ2pDLFlBQVk7SUFDWixXQUFXO0NBQ1osQ0FBQyxDQUFDO0FBRVUsUUFBQSxxQkFBcUIsR0FBRywrQkFBK0IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5cclxuZXhwb3J0IGNvbnN0IERFRkFVTFRfTU9EX1NFVFRJTkdTX1Y4ID0gYDw/eG1sIHZlcnNpb249XCIxLjBcIiBlbmNvZGluZz1cIlVURi04XCI/PlxyXG48c2F2ZT5cclxuICAgIDx2ZXJzaW9uIG1ham9yPVwiNFwiIG1pbm9yPVwiOFwiIHJldmlzaW9uPVwiMFwiIGJ1aWxkPVwiMTBcIi8+XHJcbiAgICA8cmVnaW9uIGlkPVwiTW9kdWxlU2V0dGluZ3NcIj5cclxuICAgICAgICA8bm9kZSBpZD1cInJvb3RcIj5cclxuICAgICAgICAgICAgPGNoaWxkcmVuPlxyXG4gICAgICAgICAgICAgICAgPG5vZGUgaWQ9XCJNb2RzXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPGNoaWxkcmVuPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8bm9kZSBpZD1cIk1vZHVsZVNob3J0RGVzY1wiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGF0dHJpYnV0ZSBpZD1cIkZvbGRlclwiIHR5cGU9XCJMU1N0cmluZ1wiIHZhbHVlPVwiR3VzdGF2WFwiLz5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxhdHRyaWJ1dGUgaWQ9XCJNRDVcIiB0eXBlPVwiTFNTdHJpbmdcIiB2YWx1ZT1cIlwiLz5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxhdHRyaWJ1dGUgaWQ9XCJOYW1lXCIgdHlwZT1cIkxTU3RyaW5nXCIgdmFsdWU9XCJHdXN0YXZYXCIvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGF0dHJpYnV0ZSBpZD1cIlB1Ymxpc2hIYW5kbGVcIiB0eXBlPVwidWludDY0XCIgdmFsdWU9XCIwXCIvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGF0dHJpYnV0ZSBpZD1cIlVVSURcIiB0eXBlPVwiZ3VpZFwiIHZhbHVlPVwiY2I1NTVlZmUtMmQ5ZS0xMzFmLTgxOTUtYTg5MzI5ZDIxOGVhXCIvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGF0dHJpYnV0ZSBpZD1cIlZlcnNpb242NFwiIHR5cGU9XCJpbnQ2NFwiIHZhbHVlPVwiMzYwMjg3OTcwMTg5NjM5NjhcIi8+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvbm9kZT5cclxuICAgICAgICAgICAgICAgICAgICA8L2NoaWxkcmVuPlxyXG4gICAgICAgICAgICAgICAgPC9ub2RlPlxyXG4gICAgICAgICAgICA8L2NoaWxkcmVuPlxyXG4gICAgICAgIDwvbm9kZT5cclxuICAgIDwvcmVnaW9uPlxyXG48L3NhdmU+YDtcclxuXHJcbmV4cG9ydCBjb25zdCBERUZBVUxUX01PRF9TRVRUSU5HU19WNyA9IGA8P3htbCB2ZXJzaW9uPVwiMS4wXCIgZW5jb2Rpbmc9XCJVVEYtOFwiPz5cclxuPHNhdmU+XHJcbiAgPHZlcnNpb24gbWFqb3I9XCI0XCIgbWlub3I9XCI3XCIgcmV2aXNpb249XCIxXCIgYnVpbGQ9XCIyMDBcIi8+XHJcbiAgPHJlZ2lvbiBpZD1cIk1vZHVsZVNldHRpbmdzXCI+XHJcbiAgICA8bm9kZSBpZD1cInJvb3RcIj5cclxuICAgICAgPGNoaWxkcmVuPlxyXG4gICAgICAgIDxub2RlIGlkPVwiTW9kc1wiPlxyXG4gICAgICAgICAgPGNoaWxkcmVuPlxyXG4gICAgICAgICAgICA8bm9kZSBpZD1cIk1vZHVsZVNob3J0RGVzY1wiPlxyXG4gICAgICAgICAgICAgIDxhdHRyaWJ1dGUgaWQ9XCJGb2xkZXJcIiB0eXBlPVwiTFNTdHJpbmdcIiB2YWx1ZT1cIkd1c3RhdkRldlwiLz5cclxuICAgICAgICAgICAgICA8YXR0cmlidXRlIGlkPVwiTUQ1XCIgdHlwZT1cIkxTU3RyaW5nXCIgdmFsdWU9XCJcIi8+XHJcbiAgICAgICAgICAgICAgPGF0dHJpYnV0ZSBpZD1cIk5hbWVcIiB0eXBlPVwiTFNTdHJpbmdcIiB2YWx1ZT1cIkd1c3RhdkRldlwiLz5cclxuICAgICAgICAgICAgICA8YXR0cmlidXRlIGlkPVwiUHVibGlzaEhhbmRsZVwiIHR5cGU9XCJ1aW50NjRcIiB2YWx1ZT1cIjBcIi8+XHJcbiAgICAgICAgICAgICAgPGF0dHJpYnV0ZSBpZD1cIlVVSURcIiB0eXBlPVwiZ3VpZFwiIHZhbHVlPVwiMjhhYzljZTItMmFiYS04Y2RhLWIzYjUtNmU5MjJmNzFiNmI4XCIvPlxyXG4gICAgICAgICAgICAgIDxhdHRyaWJ1dGUgaWQ9XCJWZXJzaW9uNjRcIiB0eXBlPVwiaW50NjRcIiB2YWx1ZT1cIjM2MDI4Nzk3MDE4OTYzOTY4XCIvPlxyXG4gICAgICAgICAgICA8L25vZGU+XHJcbiAgICAgICAgICA8L2NoaWxkcmVuPlxyXG4gICAgICAgIDwvbm9kZT5cclxuICAgICAgPC9jaGlsZHJlbj5cclxuICAgIDwvbm9kZT5cclxuICA8L3JlZ2lvbj5cclxuPC9zYXZlPmA7XHJcblxyXG5leHBvcnQgY29uc3QgREVGQVVMVF9NT0RfU0VUVElOR1NfVjYgPSBgPD94bWwgdmVyc2lvbj1cIjEuMFwiIGVuY29kaW5nPVwiVVRGLThcIiBzdGFuZGFsb25lPVwieWVzXCI/PlxyXG48c2F2ZT5cclxuICA8dmVyc2lvbiBtYWpvcj1cIjRcIiBtaW5vcj1cIjBcIiByZXZpc2lvbj1cIjEwXCIgYnVpbGQ9XCIxMDBcIi8+XHJcbiAgPHJlZ2lvbiBpZD1cIk1vZHVsZVNldHRpbmdzXCI+XHJcbiAgICA8bm9kZSBpZD1cInJvb3RcIj5cclxuICAgICAgPGNoaWxkcmVuPlxyXG4gICAgICAgIDxub2RlIGlkPVwiTW9kT3JkZXJcIj5cclxuICAgICAgICAgIDxjaGlsZHJlbi8+XHJcbiAgICAgICAgPC9ub2RlPlxyXG4gICAgICAgIDxub2RlIGlkPVwiTW9kc1wiPlxyXG4gICAgICAgICAgPGNoaWxkcmVuPlxyXG4gICAgICAgICAgICA8bm9kZSBpZD1cIk1vZHVsZVNob3J0RGVzY1wiPlxyXG4gICAgICAgICAgICAgIDxhdHRyaWJ1dGUgaWQ9XCJGb2xkZXJcIiB0eXBlPVwiTFNTdHJpbmdcIiB2YWx1ZT1cIkd1c3RhdkRldlwiLz5cclxuICAgICAgICAgICAgICA8YXR0cmlidXRlIGlkPVwiTUQ1XCIgdHlwZT1cIkxTU3RyaW5nXCIgdmFsdWU9XCJcIi8+XHJcbiAgICAgICAgICAgICAgPGF0dHJpYnV0ZSBpZD1cIk5hbWVcIiB0eXBlPVwiTFNTdHJpbmdcIiB2YWx1ZT1cIkd1c3RhdkRldlwiLz5cclxuICAgICAgICAgICAgICA8YXR0cmlidXRlIGlkPVwiVVVJRFwiIHR5cGU9XCJGaXhlZFN0cmluZ1wiIHZhbHVlPVwiMjhhYzljZTItMmFiYS04Y2RhLWIzYjUtNmU5MjJmNzFiNmI4XCIvPlxyXG4gICAgICAgICAgICAgIDxhdHRyaWJ1dGUgaWQ9XCJWZXJzaW9uNjRcIiB0eXBlPVwiaW50NjRcIiB2YWx1ZT1cIjM2MDI4Nzk3MDE4OTYzOTY4XCIvPlxyXG4gICAgICAgICAgICA8L25vZGU+XHJcbiAgICAgICAgICA8L2NoaWxkcmVuPlxyXG4gICAgICAgIDwvbm9kZT5cclxuICAgICAgPC9jaGlsZHJlbj5cclxuICAgIDwvbm9kZT5cclxuICA8L3JlZ2lvbj5cclxuPC9zYXZlPmA7XHJcbmV4cG9ydCBjb25zdCBHQU1FX0lEID0gJ2JhbGR1cnNnYXRlMyc7XHJcbmV4cG9ydCBjb25zdCBERUJVRyA9IGZhbHNlO1xyXG5leHBvcnQgY29uc3QgTFNMSUJfVVJMID0gJ2h0dHBzOi8vZ2l0aHViLmNvbS9Ob3JieXRlL2xzbGliJztcclxuZXhwb3J0IGNvbnN0IExPX0ZJTEVfTkFNRSA9ICdsb2FkT3JkZXIuanNvbic7XHJcbmV4cG9ydCBjb25zdCBJTlZBTElEX0xPX01PRF9UWVBFUyA9IFsnYmczLWxzbGliLWRpdmluZS10b29sJywgJ2JnMy1iZzNzZScsICdiZzMtcmVwbGFjZXInLCAnYmczLWxvb3NlJywgJ2RpbnB1dCddO1xyXG5cclxuZXhwb3J0IGNvbnN0IElHTk9SRV9QQVRURVJOUyA9IFtcclxuICBwYXRoLmpvaW4oJyoqJywgJ2luZm8uanNvbicpLFxyXG5dO1xyXG5leHBvcnQgY29uc3QgTU9EX1RZUEVfTFNMSUIgPSAnYmczLWxzbGliLWRpdmluZS10b29sJztcclxuZXhwb3J0IGNvbnN0IE1PRF9UWVBFX0JHM1NFID0gJ2JnMy1iZzNzZSc7XHJcbmV4cG9ydCBjb25zdCBNT0RfVFlQRV9SRVBMQUNFUiA9ICdiZzMtcmVwbGFjZXInO1xyXG5leHBvcnQgY29uc3QgTU9EX1RZUEVfTE9PU0UgPSAnYmczLWxvb3NlJztcclxuXHJcbmV4cG9ydCBjb25zdCBPUklHSU5BTF9GSUxFUyA9IG5ldyBTZXQoW1xyXG4gICdhc3NldHMucGFrJyxcclxuICAnYXNzZXRzLnBhaycsXHJcbiAgJ2VmZmVjdHMucGFrJyxcclxuICAnZW5naW5lLnBhaycsXHJcbiAgJ2VuZ2luZXNoYWRlcnMucGFrJyxcclxuICAnZ2FtZS5wYWsnLFxyXG4gICdnYW1lcGxhdGZvcm0ucGFrJyxcclxuICAnZ3VzdGF2LnBhaycsXHJcbiAgJ2d1c3Rhdl90ZXh0dXJlcy5wYWsnLFxyXG4gICdpY29ucy5wYWsnLFxyXG4gICdsb3d0ZXgucGFrJyxcclxuICAnbWF0ZXJpYWxzLnBhaycsXHJcbiAgJ21pbmltYXBzLnBhaycsXHJcbiAgJ21vZGVscy5wYWsnLFxyXG4gICdzaGFyZWQucGFrJyxcclxuICAnc2hhcmVkc291bmRiYW5rcy5wYWsnLFxyXG4gICdzaGFyZWRzb3VuZHMucGFrJyxcclxuICAndGV4dHVyZXMucGFrJyxcclxuICAndmlydHVhbHRleHR1cmVzLnBhaycsXHJcbl0pO1xyXG5cclxuZXhwb3J0IGNvbnN0IExTTElCX0ZJTEVTID0gbmV3IFNldChbXHJcbiAgJ2RpdmluZS5leGUnLFxyXG4gICdsc2xpYi5kbGwnLFxyXG5dKTtcclxuXHJcbmV4cG9ydCBjb25zdCBOT1RJRl9JTVBPUlRfQUNUSVZJVFkgPSAnYmczLWxvYWRvcmRlci1pbXBvcnQtYWN0aXZpdHknOyJdfQ==