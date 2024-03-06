"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LSLIB_FILES = exports.ORIGINAL_FILES = exports.MOD_TYPE_LOOSE = exports.MOD_TYPE_REPLACER = exports.MOD_TYPE_BG3SE = exports.MOD_TYPE_LSLIB = exports.IGNORE_PATTERNS = exports.INVALID_LO_MOD_TYPES = exports.LO_FILE_NAME = exports.LSLIB_URL = exports.DEBUG = exports.GAME_ID = exports.DEFAULT_MOD_SETTINGS = void 0;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY29tbW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGdEQUF3QjtBQUNYLFFBQUEsb0JBQW9CLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1FBdUI1QixDQUFDO0FBQ0ksUUFBQSxPQUFPLEdBQUcsY0FBYyxDQUFDO0FBQ3pCLFFBQUEsS0FBSyxHQUFHLEtBQUssQ0FBQztBQUNkLFFBQUEsU0FBUyxHQUFHLGtDQUFrQyxDQUFDO0FBQy9DLFFBQUEsWUFBWSxHQUFHLGdCQUFnQixDQUFDO0FBQ2hDLFFBQUEsb0JBQW9CLEdBQUcsQ0FBQyx1QkFBdUIsRUFBRSxXQUFXLEVBQUUsY0FBYyxFQUFFLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQztBQUVyRyxRQUFBLGVBQWUsR0FBRztJQUM3QixjQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxXQUFXLENBQUM7Q0FDN0IsQ0FBQztBQUNXLFFBQUEsY0FBYyxHQUFHLHVCQUF1QixDQUFDO0FBQ3pDLFFBQUEsY0FBYyxHQUFHLFdBQVcsQ0FBQztBQUM3QixRQUFBLGlCQUFpQixHQUFHLGNBQWMsQ0FBQztBQUNuQyxRQUFBLGNBQWMsR0FBRyxXQUFXLENBQUM7QUFFN0IsUUFBQSxjQUFjLEdBQUcsSUFBSSxHQUFHLENBQUM7SUFDcEMsWUFBWTtJQUNaLFlBQVk7SUFDWixhQUFhO0lBQ2IsWUFBWTtJQUNaLG1CQUFtQjtJQUNuQixVQUFVO0lBQ1Ysa0JBQWtCO0lBQ2xCLFlBQVk7SUFDWixxQkFBcUI7SUFDckIsV0FBVztJQUNYLFlBQVk7SUFDWixlQUFlO0lBQ2YsY0FBYztJQUNkLFlBQVk7SUFDWixZQUFZO0lBQ1osc0JBQXNCO0lBQ3RCLGtCQUFrQjtJQUNsQixjQUFjO0lBQ2QscUJBQXFCO0NBQ3RCLENBQUMsQ0FBQztBQUVVLFFBQUEsV0FBVyxHQUFHLElBQUksR0FBRyxDQUFDO0lBQ2pDLFlBQVk7SUFDWixXQUFXO0NBQ1osQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5leHBvcnQgY29uc3QgREVGQVVMVF9NT0RfU0VUVElOR1MgPSBgPD94bWwgdmVyc2lvbj1cIjEuMFwiIGVuY29kaW5nPVwiVVRGLThcIiBzdGFuZGFsb25lPVwieWVzXCI/PlxuPHNhdmU+XG4gIDx2ZXJzaW9uIG1ham9yPVwiNFwiIG1pbm9yPVwiMFwiIHJldmlzaW9uPVwiMTBcIiBidWlsZD1cIjEwMFwiLz5cbiAgPHJlZ2lvbiBpZD1cIk1vZHVsZVNldHRpbmdzXCI+XG4gICAgPG5vZGUgaWQ9XCJyb290XCI+XG4gICAgICA8Y2hpbGRyZW4+XG4gICAgICAgIDxub2RlIGlkPVwiTW9kT3JkZXJcIj5cbiAgICAgICAgICA8Y2hpbGRyZW4vPlxuICAgICAgICA8L25vZGU+XG4gICAgICAgIDxub2RlIGlkPVwiTW9kc1wiPlxuICAgICAgICAgIDxjaGlsZHJlbj5cbiAgICAgICAgICAgIDxub2RlIGlkPVwiTW9kdWxlU2hvcnREZXNjXCI+XG4gICAgICAgICAgICAgIDxhdHRyaWJ1dGUgaWQ9XCJGb2xkZXJcIiB0eXBlPVwiTFNTdHJpbmdcIiB2YWx1ZT1cIkd1c3RhdkRldlwiLz5cbiAgICAgICAgICAgICAgPGF0dHJpYnV0ZSBpZD1cIk1ENVwiIHR5cGU9XCJMU1N0cmluZ1wiIHZhbHVlPVwiXCIvPlxuICAgICAgICAgICAgICA8YXR0cmlidXRlIGlkPVwiTmFtZVwiIHR5cGU9XCJMU1N0cmluZ1wiIHZhbHVlPVwiR3VzdGF2RGV2XCIvPlxuICAgICAgICAgICAgICA8YXR0cmlidXRlIGlkPVwiVVVJRFwiIHR5cGU9XCJGaXhlZFN0cmluZ1wiIHZhbHVlPVwiMjhhYzljZTItMmFiYS04Y2RhLWIzYjUtNmU5MjJmNzFiNmI4XCIvPlxuICAgICAgICAgICAgICA8YXR0cmlidXRlIGlkPVwiVmVyc2lvbjY0XCIgdHlwZT1cImludDY0XCIgdmFsdWU9XCIzNjAyODc5NzAxODk2Mzk2OFwiLz5cbiAgICAgICAgICAgIDwvbm9kZT5cbiAgICAgICAgICA8L2NoaWxkcmVuPlxuICAgICAgICA8L25vZGU+XG4gICAgICA8L2NoaWxkcmVuPlxuICAgIDwvbm9kZT5cbiAgPC9yZWdpb24+XG48L3NhdmU+YDtcbmV4cG9ydCBjb25zdCBHQU1FX0lEID0gJ2JhbGR1cnNnYXRlMyc7XG5leHBvcnQgY29uc3QgREVCVUcgPSBmYWxzZTtcbmV4cG9ydCBjb25zdCBMU0xJQl9VUkwgPSAnaHR0cHM6Ly9naXRodWIuY29tL05vcmJ5dGUvbHNsaWInO1xuZXhwb3J0IGNvbnN0IExPX0ZJTEVfTkFNRSA9ICdsb2FkT3JkZXIuanNvbic7XG5leHBvcnQgY29uc3QgSU5WQUxJRF9MT19NT0RfVFlQRVMgPSBbJ2JnMy1sc2xpYi1kaXZpbmUtdG9vbCcsICdiZzMtYmczc2UnLCAnYmczLXJlcGxhY2VyJywgJ2JnMy1sb29zZScsICdkaW5wdXQnXTtcblxuZXhwb3J0IGNvbnN0IElHTk9SRV9QQVRURVJOUyA9IFtcbiAgcGF0aC5qb2luKCcqKicsICdpbmZvLmpzb24nKSxcbl07XG5leHBvcnQgY29uc3QgTU9EX1RZUEVfTFNMSUIgPSAnYmczLWxzbGliLWRpdmluZS10b29sJztcbmV4cG9ydCBjb25zdCBNT0RfVFlQRV9CRzNTRSA9ICdiZzMtYmczc2UnO1xuZXhwb3J0IGNvbnN0IE1PRF9UWVBFX1JFUExBQ0VSID0gJ2JnMy1yZXBsYWNlcic7XG5leHBvcnQgY29uc3QgTU9EX1RZUEVfTE9PU0UgPSAnYmczLWxvb3NlJztcblxuZXhwb3J0IGNvbnN0IE9SSUdJTkFMX0ZJTEVTID0gbmV3IFNldChbXG4gICdhc3NldHMucGFrJyxcbiAgJ2Fzc2V0cy5wYWsnLFxuICAnZWZmZWN0cy5wYWsnLFxuICAnZW5naW5lLnBhaycsXG4gICdlbmdpbmVzaGFkZXJzLnBhaycsXG4gICdnYW1lLnBhaycsXG4gICdnYW1lcGxhdGZvcm0ucGFrJyxcbiAgJ2d1c3Rhdi5wYWsnLFxuICAnZ3VzdGF2X3RleHR1cmVzLnBhaycsXG4gICdpY29ucy5wYWsnLFxuICAnbG93dGV4LnBhaycsXG4gICdtYXRlcmlhbHMucGFrJyxcbiAgJ21pbmltYXBzLnBhaycsXG4gICdtb2RlbHMucGFrJyxcbiAgJ3NoYXJlZC5wYWsnLFxuICAnc2hhcmVkc291bmRiYW5rcy5wYWsnLFxuICAnc2hhcmVkc291bmRzLnBhaycsXG4gICd0ZXh0dXJlcy5wYWsnLFxuICAndmlydHVhbHRleHR1cmVzLnBhaycsXG5dKTtcblxuZXhwb3J0IGNvbnN0IExTTElCX0ZJTEVTID0gbmV3IFNldChbXG4gICdkaXZpbmUuZXhlJyxcbiAgJ2xzbGliLmRsbCcsXG5dKTtcbiJdfQ==