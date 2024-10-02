"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NOTIF_IMPORT_ACTIVITY = exports.LSLIB_FILES = exports.ORIGINAL_FILES = exports.MOD_TYPE_LOOSE = exports.MOD_TYPE_REPLACER = exports.MOD_TYPE_BG3SE = exports.MOD_TYPE_LSLIB = exports.IGNORE_PATTERNS = exports.INVALID_LO_MOD_TYPES = exports.LO_FILE_NAME = exports.LSLIB_URL = exports.DEBUG = exports.GAME_ID = exports.DEFAULT_MOD_SETTINGS_V6 = exports.DEFAULT_MOD_SETTINGS_V7 = void 0;
const path_1 = __importDefault(require("path"));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY29tbW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGdEQUF3QjtBQUNYLFFBQUEsdUJBQXVCLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztRQXFCL0IsQ0FBQztBQUVJLFFBQUEsdUJBQXVCLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1FBdUIvQixDQUFDO0FBQ0ksUUFBQSxPQUFPLEdBQUcsY0FBYyxDQUFDO0FBQ3pCLFFBQUEsS0FBSyxHQUFHLEtBQUssQ0FBQztBQUNkLFFBQUEsU0FBUyxHQUFHLGtDQUFrQyxDQUFDO0FBQy9DLFFBQUEsWUFBWSxHQUFHLGdCQUFnQixDQUFDO0FBQ2hDLFFBQUEsb0JBQW9CLEdBQUcsQ0FBQyx1QkFBdUIsRUFBRSxXQUFXLEVBQUUsY0FBYyxFQUFFLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQztBQUVyRyxRQUFBLGVBQWUsR0FBRztJQUM3QixjQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxXQUFXLENBQUM7Q0FDN0IsQ0FBQztBQUNXLFFBQUEsY0FBYyxHQUFHLHVCQUF1QixDQUFDO0FBQ3pDLFFBQUEsY0FBYyxHQUFHLFdBQVcsQ0FBQztBQUM3QixRQUFBLGlCQUFpQixHQUFHLGNBQWMsQ0FBQztBQUNuQyxRQUFBLGNBQWMsR0FBRyxXQUFXLENBQUM7QUFFN0IsUUFBQSxjQUFjLEdBQUcsSUFBSSxHQUFHLENBQUM7SUFDcEMsWUFBWTtJQUNaLFlBQVk7SUFDWixhQUFhO0lBQ2IsWUFBWTtJQUNaLG1CQUFtQjtJQUNuQixVQUFVO0lBQ1Ysa0JBQWtCO0lBQ2xCLFlBQVk7SUFDWixxQkFBcUI7SUFDckIsV0FBVztJQUNYLFlBQVk7SUFDWixlQUFlO0lBQ2YsY0FBYztJQUNkLFlBQVk7SUFDWixZQUFZO0lBQ1osc0JBQXNCO0lBQ3RCLGtCQUFrQjtJQUNsQixjQUFjO0lBQ2QscUJBQXFCO0NBQ3RCLENBQUMsQ0FBQztBQUVVLFFBQUEsV0FBVyxHQUFHLElBQUksR0FBRyxDQUFDO0lBQ2pDLFlBQVk7SUFDWixXQUFXO0NBQ1osQ0FBQyxDQUFDO0FBRVUsUUFBQSxxQkFBcUIsR0FBRywrQkFBK0IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5leHBvcnQgY29uc3QgREVGQVVMVF9NT0RfU0VUVElOR1NfVjcgPSBgPD94bWwgdmVyc2lvbj1cIjEuMFwiIGVuY29kaW5nPVwiVVRGLThcIj8+XHJcbjxzYXZlPlxyXG4gIDx2ZXJzaW9uIG1ham9yPVwiNFwiIG1pbm9yPVwiN1wiIHJldmlzaW9uPVwiMVwiIGJ1aWxkPVwiMjAwXCIvPlxyXG4gIDxyZWdpb24gaWQ9XCJNb2R1bGVTZXR0aW5nc1wiPlxyXG4gICAgPG5vZGUgaWQ9XCJyb290XCI+XHJcbiAgICAgIDxjaGlsZHJlbj5cclxuICAgICAgICA8bm9kZSBpZD1cIk1vZHNcIj5cclxuICAgICAgICAgIDxjaGlsZHJlbj5cclxuICAgICAgICAgICAgPG5vZGUgaWQ9XCJNb2R1bGVTaG9ydERlc2NcIj5cclxuICAgICAgICAgICAgICA8YXR0cmlidXRlIGlkPVwiRm9sZGVyXCIgdHlwZT1cIkxTU3RyaW5nXCIgdmFsdWU9XCJHdXN0YXZEZXZcIi8+XHJcbiAgICAgICAgICAgICAgPGF0dHJpYnV0ZSBpZD1cIk1ENVwiIHR5cGU9XCJMU1N0cmluZ1wiIHZhbHVlPVwiXCIvPlxyXG4gICAgICAgICAgICAgIDxhdHRyaWJ1dGUgaWQ9XCJOYW1lXCIgdHlwZT1cIkxTU3RyaW5nXCIgdmFsdWU9XCJHdXN0YXZEZXZcIi8+XHJcbiAgICAgICAgICAgICAgPGF0dHJpYnV0ZSBpZD1cIlB1Ymxpc2hIYW5kbGVcIiB0eXBlPVwidWludDY0XCIgdmFsdWU9XCIwXCIvPlxyXG4gICAgICAgICAgICAgIDxhdHRyaWJ1dGUgaWQ9XCJVVUlEXCIgdHlwZT1cImd1aWRcIiB2YWx1ZT1cIjI4YWM5Y2UyLTJhYmEtOGNkYS1iM2I1LTZlOTIyZjcxYjZiOFwiLz5cclxuICAgICAgICAgICAgICA8YXR0cmlidXRlIGlkPVwiVmVyc2lvbjY0XCIgdHlwZT1cImludDY0XCIgdmFsdWU9XCIzNjAyODc5NzAxODk2Mzk2OFwiLz5cclxuICAgICAgICAgICAgPC9ub2RlPlxyXG4gICAgICAgICAgPC9jaGlsZHJlbj5cclxuICAgICAgICA8L25vZGU+XHJcbiAgICAgIDwvY2hpbGRyZW4+XHJcbiAgICA8L25vZGU+XHJcbiAgPC9yZWdpb24+XHJcbjwvc2F2ZT5gO1xyXG5cclxuZXhwb3J0IGNvbnN0IERFRkFVTFRfTU9EX1NFVFRJTkdTX1Y2ID0gYDw/eG1sIHZlcnNpb249XCIxLjBcIiBlbmNvZGluZz1cIlVURi04XCIgc3RhbmRhbG9uZT1cInllc1wiPz5cclxuPHNhdmU+XHJcbiAgPHZlcnNpb24gbWFqb3I9XCI0XCIgbWlub3I9XCIwXCIgcmV2aXNpb249XCIxMFwiIGJ1aWxkPVwiMTAwXCIvPlxyXG4gIDxyZWdpb24gaWQ9XCJNb2R1bGVTZXR0aW5nc1wiPlxyXG4gICAgPG5vZGUgaWQ9XCJyb290XCI+XHJcbiAgICAgIDxjaGlsZHJlbj5cclxuICAgICAgICA8bm9kZSBpZD1cIk1vZE9yZGVyXCI+XHJcbiAgICAgICAgICA8Y2hpbGRyZW4vPlxyXG4gICAgICAgIDwvbm9kZT5cclxuICAgICAgICA8bm9kZSBpZD1cIk1vZHNcIj5cclxuICAgICAgICAgIDxjaGlsZHJlbj5cclxuICAgICAgICAgICAgPG5vZGUgaWQ9XCJNb2R1bGVTaG9ydERlc2NcIj5cclxuICAgICAgICAgICAgICA8YXR0cmlidXRlIGlkPVwiRm9sZGVyXCIgdHlwZT1cIkxTU3RyaW5nXCIgdmFsdWU9XCJHdXN0YXZEZXZcIi8+XHJcbiAgICAgICAgICAgICAgPGF0dHJpYnV0ZSBpZD1cIk1ENVwiIHR5cGU9XCJMU1N0cmluZ1wiIHZhbHVlPVwiXCIvPlxyXG4gICAgICAgICAgICAgIDxhdHRyaWJ1dGUgaWQ9XCJOYW1lXCIgdHlwZT1cIkxTU3RyaW5nXCIgdmFsdWU9XCJHdXN0YXZEZXZcIi8+XHJcbiAgICAgICAgICAgICAgPGF0dHJpYnV0ZSBpZD1cIlVVSURcIiB0eXBlPVwiRml4ZWRTdHJpbmdcIiB2YWx1ZT1cIjI4YWM5Y2UyLTJhYmEtOGNkYS1iM2I1LTZlOTIyZjcxYjZiOFwiLz5cclxuICAgICAgICAgICAgICA8YXR0cmlidXRlIGlkPVwiVmVyc2lvbjY0XCIgdHlwZT1cImludDY0XCIgdmFsdWU9XCIzNjAyODc5NzAxODk2Mzk2OFwiLz5cclxuICAgICAgICAgICAgPC9ub2RlPlxyXG4gICAgICAgICAgPC9jaGlsZHJlbj5cclxuICAgICAgICA8L25vZGU+XHJcbiAgICAgIDwvY2hpbGRyZW4+XHJcbiAgICA8L25vZGU+XHJcbiAgPC9yZWdpb24+XHJcbjwvc2F2ZT5gO1xyXG5leHBvcnQgY29uc3QgR0FNRV9JRCA9ICdiYWxkdXJzZ2F0ZTMnO1xyXG5leHBvcnQgY29uc3QgREVCVUcgPSBmYWxzZTtcclxuZXhwb3J0IGNvbnN0IExTTElCX1VSTCA9ICdodHRwczovL2dpdGh1Yi5jb20vTm9yYnl0ZS9sc2xpYic7XHJcbmV4cG9ydCBjb25zdCBMT19GSUxFX05BTUUgPSAnbG9hZE9yZGVyLmpzb24nO1xyXG5leHBvcnQgY29uc3QgSU5WQUxJRF9MT19NT0RfVFlQRVMgPSBbJ2JnMy1sc2xpYi1kaXZpbmUtdG9vbCcsICdiZzMtYmczc2UnLCAnYmczLXJlcGxhY2VyJywgJ2JnMy1sb29zZScsICdkaW5wdXQnXTtcclxuXHJcbmV4cG9ydCBjb25zdCBJR05PUkVfUEFUVEVSTlMgPSBbXHJcbiAgcGF0aC5qb2luKCcqKicsICdpbmZvLmpzb24nKSxcclxuXTtcclxuZXhwb3J0IGNvbnN0IE1PRF9UWVBFX0xTTElCID0gJ2JnMy1sc2xpYi1kaXZpbmUtdG9vbCc7XHJcbmV4cG9ydCBjb25zdCBNT0RfVFlQRV9CRzNTRSA9ICdiZzMtYmczc2UnO1xyXG5leHBvcnQgY29uc3QgTU9EX1RZUEVfUkVQTEFDRVIgPSAnYmczLXJlcGxhY2VyJztcclxuZXhwb3J0IGNvbnN0IE1PRF9UWVBFX0xPT1NFID0gJ2JnMy1sb29zZSc7XHJcblxyXG5leHBvcnQgY29uc3QgT1JJR0lOQUxfRklMRVMgPSBuZXcgU2V0KFtcclxuICAnYXNzZXRzLnBhaycsXHJcbiAgJ2Fzc2V0cy5wYWsnLFxyXG4gICdlZmZlY3RzLnBhaycsXHJcbiAgJ2VuZ2luZS5wYWsnLFxyXG4gICdlbmdpbmVzaGFkZXJzLnBhaycsXHJcbiAgJ2dhbWUucGFrJyxcclxuICAnZ2FtZXBsYXRmb3JtLnBhaycsXHJcbiAgJ2d1c3Rhdi5wYWsnLFxyXG4gICdndXN0YXZfdGV4dHVyZXMucGFrJyxcclxuICAnaWNvbnMucGFrJyxcclxuICAnbG93dGV4LnBhaycsXHJcbiAgJ21hdGVyaWFscy5wYWsnLFxyXG4gICdtaW5pbWFwcy5wYWsnLFxyXG4gICdtb2RlbHMucGFrJyxcclxuICAnc2hhcmVkLnBhaycsXHJcbiAgJ3NoYXJlZHNvdW5kYmFua3MucGFrJyxcclxuICAnc2hhcmVkc291bmRzLnBhaycsXHJcbiAgJ3RleHR1cmVzLnBhaycsXHJcbiAgJ3ZpcnR1YWx0ZXh0dXJlcy5wYWsnLFxyXG5dKTtcclxuXHJcbmV4cG9ydCBjb25zdCBMU0xJQl9GSUxFUyA9IG5ldyBTZXQoW1xyXG4gICdkaXZpbmUuZXhlJyxcclxuICAnbHNsaWIuZGxsJyxcclxuXSk7XHJcblxyXG5leHBvcnQgY29uc3QgTk9USUZfSU1QT1JUX0FDVElWSVRZID0gJ2JnMy1sb2Fkb3JkZXItaW1wb3J0LWFjdGl2aXR5JzsiXX0=