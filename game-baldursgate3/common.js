"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NOTIF_IMPORT_ACTIVITY = exports.LSLIB_FILES = exports.ORIGINAL_FILES = exports.MOD_TYPE_LOOSE = exports.MOD_TYPE_REPLACER = exports.MOD_TYPE_BG3SE = exports.MOD_TYPE_LSLIB = exports.IGNORE_PATTERNS = exports.INVALID_LO_MOD_TYPES = exports.LO_FILE_NAME = exports.LSLIB_URL = exports.DEBUG = exports.GAME_ID = exports.DEFAULT_MOD_SETTINGS_V6 = exports.DEFAULT_MOD_SETTINGS_V7 = void 0;
const path_1 = __importDefault(require("path"));
exports.DEFAULT_MOD_SETTINGS_V7 = `
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY29tbW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGdEQUF3QjtBQUNYLFFBQUEsdUJBQXVCLEdBQUk7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7UUFzQmhDLENBQUM7QUFFSSxRQUFBLHVCQUF1QixHQUFHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztRQXVCL0IsQ0FBQztBQUNJLFFBQUEsT0FBTyxHQUFHLGNBQWMsQ0FBQztBQUN6QixRQUFBLEtBQUssR0FBRyxLQUFLLENBQUM7QUFDZCxRQUFBLFNBQVMsR0FBRyxrQ0FBa0MsQ0FBQztBQUMvQyxRQUFBLFlBQVksR0FBRyxnQkFBZ0IsQ0FBQztBQUNoQyxRQUFBLG9CQUFvQixHQUFHLENBQUMsdUJBQXVCLEVBQUUsV0FBVyxFQUFFLGNBQWMsRUFBRSxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFFckcsUUFBQSxlQUFlLEdBQUc7SUFDN0IsY0FBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsV0FBVyxDQUFDO0NBQzdCLENBQUM7QUFDVyxRQUFBLGNBQWMsR0FBRyx1QkFBdUIsQ0FBQztBQUN6QyxRQUFBLGNBQWMsR0FBRyxXQUFXLENBQUM7QUFDN0IsUUFBQSxpQkFBaUIsR0FBRyxjQUFjLENBQUM7QUFDbkMsUUFBQSxjQUFjLEdBQUcsV0FBVyxDQUFDO0FBRTdCLFFBQUEsY0FBYyxHQUFHLElBQUksR0FBRyxDQUFDO0lBQ3BDLFlBQVk7SUFDWixZQUFZO0lBQ1osYUFBYTtJQUNiLFlBQVk7SUFDWixtQkFBbUI7SUFDbkIsVUFBVTtJQUNWLGtCQUFrQjtJQUNsQixZQUFZO0lBQ1oscUJBQXFCO0lBQ3JCLFdBQVc7SUFDWCxZQUFZO0lBQ1osZUFBZTtJQUNmLGNBQWM7SUFDZCxZQUFZO0lBQ1osWUFBWTtJQUNaLHNCQUFzQjtJQUN0QixrQkFBa0I7SUFDbEIsY0FBYztJQUNkLHFCQUFxQjtDQUN0QixDQUFDLENBQUM7QUFFVSxRQUFBLFdBQVcsR0FBRyxJQUFJLEdBQUcsQ0FBQztJQUNqQyxZQUFZO0lBQ1osV0FBVztDQUNaLENBQUMsQ0FBQztBQUVVLFFBQUEscUJBQXFCLEdBQUcsK0JBQStCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuZXhwb3J0IGNvbnN0IERFRkFVTFRfTU9EX1NFVFRJTkdTX1Y3ID0gIGBcclxuPD94bWwgdmVyc2lvbj1cIjEuMFwiIGVuY29kaW5nPVwiVVRGLThcIiBzdGFuZGFsb25lPVwieWVzXCI/PlxyXG48c2F2ZT5cclxuICA8dmVyc2lvbiBtYWpvcj1cIjRcIiBtaW5vcj1cIjdcIiByZXZpc2lvbj1cIjFcIiBidWlsZD1cIjNcIi8+XHJcbiAgPHJlZ2lvbiBpZD1cIk1vZHVsZVNldHRpbmdzXCI+XHJcbiAgICA8bm9kZSBpZD1cInJvb3RcIj5cclxuICAgICAgPGNoaWxkcmVuPlxyXG4gICAgICAgIDxub2RlIGlkPVwiTW9kc1wiPlxyXG4gICAgICAgICAgPGNoaWxkcmVuPlxyXG4gICAgICAgICAgICA8bm9kZSBpZD1cIk1vZHVsZVNob3J0RGVzY1wiPlxyXG4gICAgICAgICAgICAgIDxhdHRyaWJ1dGUgaWQ9XCJGb2xkZXJcIiB0eXBlPVwiTFNTdHJpbmdcIiB2YWx1ZT1cIkd1c3RhdkRldlwiLz5cclxuICAgICAgICAgICAgICA8YXR0cmlidXRlIGlkPVwiTUQ1XCIgdHlwZT1cIkxTU3RyaW5nXCIgdmFsdWU9XCJcIi8+XHJcbiAgICAgICAgICAgICAgPGF0dHJpYnV0ZSBpZD1cIk5hbWVcIiB0eXBlPVwiTFNTdHJpbmdcIiB2YWx1ZT1cIkd1c3RhdkRldlwiLz5cclxuICAgICAgICAgICAgICA8YXR0cmlidXRlIGlkPVwiUHVibGlzaEhhbmRsZVwiIHR5cGU9XCJ1aW50NjRcIiB2YWx1ZT1cIjBcIi8+XHJcbiAgICAgICAgICAgICAgPGF0dHJpYnV0ZSBpZD1cIlVVSURcIiB0eXBlPVwiZ3VpZFwiIHZhbHVlPVwiMjhhYzljZTItMmFiYS04Y2RhLWIzYjUtNmU5MjJmNzFiNmI4XCIvPlxyXG4gICAgICAgICAgICAgIDxhdHRyaWJ1dGUgaWQ9XCJWZXJzaW9uNjRcIiB0eXBlPVwiaW50NjRcIiB2YWx1ZT1cIjM2MDI4Nzk3MDE4OTYzOTY4XCIvPlxyXG4gICAgICAgICAgICA8L25vZGU+XHJcbiAgICAgICAgICA8L2NoaWxkcmVuPlxyXG4gICAgICAgIDwvbm9kZT5cclxuICAgICAgPC9jaGlsZHJlbj5cclxuICAgIDwvbm9kZT5cclxuICA8L3JlZ2lvbj5cclxuPC9zYXZlPmA7XHJcblxyXG5leHBvcnQgY29uc3QgREVGQVVMVF9NT0RfU0VUVElOR1NfVjYgPSBgPD94bWwgdmVyc2lvbj1cIjEuMFwiIGVuY29kaW5nPVwiVVRGLThcIiBzdGFuZGFsb25lPVwieWVzXCI/PlxyXG48c2F2ZT5cclxuICA8dmVyc2lvbiBtYWpvcj1cIjRcIiBtaW5vcj1cIjBcIiByZXZpc2lvbj1cIjEwXCIgYnVpbGQ9XCIxMDBcIi8+XHJcbiAgPHJlZ2lvbiBpZD1cIk1vZHVsZVNldHRpbmdzXCI+XHJcbiAgICA8bm9kZSBpZD1cInJvb3RcIj5cclxuICAgICAgPGNoaWxkcmVuPlxyXG4gICAgICAgIDxub2RlIGlkPVwiTW9kT3JkZXJcIj5cclxuICAgICAgICAgIDxjaGlsZHJlbi8+XHJcbiAgICAgICAgPC9ub2RlPlxyXG4gICAgICAgIDxub2RlIGlkPVwiTW9kc1wiPlxyXG4gICAgICAgICAgPGNoaWxkcmVuPlxyXG4gICAgICAgICAgICA8bm9kZSBpZD1cIk1vZHVsZVNob3J0RGVzY1wiPlxyXG4gICAgICAgICAgICAgIDxhdHRyaWJ1dGUgaWQ9XCJGb2xkZXJcIiB0eXBlPVwiTFNTdHJpbmdcIiB2YWx1ZT1cIkd1c3RhdkRldlwiLz5cclxuICAgICAgICAgICAgICA8YXR0cmlidXRlIGlkPVwiTUQ1XCIgdHlwZT1cIkxTU3RyaW5nXCIgdmFsdWU9XCJcIi8+XHJcbiAgICAgICAgICAgICAgPGF0dHJpYnV0ZSBpZD1cIk5hbWVcIiB0eXBlPVwiTFNTdHJpbmdcIiB2YWx1ZT1cIkd1c3RhdkRldlwiLz5cclxuICAgICAgICAgICAgICA8YXR0cmlidXRlIGlkPVwiVVVJRFwiIHR5cGU9XCJGaXhlZFN0cmluZ1wiIHZhbHVlPVwiMjhhYzljZTItMmFiYS04Y2RhLWIzYjUtNmU5MjJmNzFiNmI4XCIvPlxyXG4gICAgICAgICAgICAgIDxhdHRyaWJ1dGUgaWQ9XCJWZXJzaW9uNjRcIiB0eXBlPVwiaW50NjRcIiB2YWx1ZT1cIjM2MDI4Nzk3MDE4OTYzOTY4XCIvPlxyXG4gICAgICAgICAgICA8L25vZGU+XHJcbiAgICAgICAgICA8L2NoaWxkcmVuPlxyXG4gICAgICAgIDwvbm9kZT5cclxuICAgICAgPC9jaGlsZHJlbj5cclxuICAgIDwvbm9kZT5cclxuICA8L3JlZ2lvbj5cclxuPC9zYXZlPmA7XHJcbmV4cG9ydCBjb25zdCBHQU1FX0lEID0gJ2JhbGR1cnNnYXRlMyc7XHJcbmV4cG9ydCBjb25zdCBERUJVRyA9IGZhbHNlO1xyXG5leHBvcnQgY29uc3QgTFNMSUJfVVJMID0gJ2h0dHBzOi8vZ2l0aHViLmNvbS9Ob3JieXRlL2xzbGliJztcclxuZXhwb3J0IGNvbnN0IExPX0ZJTEVfTkFNRSA9ICdsb2FkT3JkZXIuanNvbic7XHJcbmV4cG9ydCBjb25zdCBJTlZBTElEX0xPX01PRF9UWVBFUyA9IFsnYmczLWxzbGliLWRpdmluZS10b29sJywgJ2JnMy1iZzNzZScsICdiZzMtcmVwbGFjZXInLCAnYmczLWxvb3NlJywgJ2RpbnB1dCddO1xyXG5cclxuZXhwb3J0IGNvbnN0IElHTk9SRV9QQVRURVJOUyA9IFtcclxuICBwYXRoLmpvaW4oJyoqJywgJ2luZm8uanNvbicpLFxyXG5dO1xyXG5leHBvcnQgY29uc3QgTU9EX1RZUEVfTFNMSUIgPSAnYmczLWxzbGliLWRpdmluZS10b29sJztcclxuZXhwb3J0IGNvbnN0IE1PRF9UWVBFX0JHM1NFID0gJ2JnMy1iZzNzZSc7XHJcbmV4cG9ydCBjb25zdCBNT0RfVFlQRV9SRVBMQUNFUiA9ICdiZzMtcmVwbGFjZXInO1xyXG5leHBvcnQgY29uc3QgTU9EX1RZUEVfTE9PU0UgPSAnYmczLWxvb3NlJztcclxuXHJcbmV4cG9ydCBjb25zdCBPUklHSU5BTF9GSUxFUyA9IG5ldyBTZXQoW1xyXG4gICdhc3NldHMucGFrJyxcclxuICAnYXNzZXRzLnBhaycsXHJcbiAgJ2VmZmVjdHMucGFrJyxcclxuICAnZW5naW5lLnBhaycsXHJcbiAgJ2VuZ2luZXNoYWRlcnMucGFrJyxcclxuICAnZ2FtZS5wYWsnLFxyXG4gICdnYW1lcGxhdGZvcm0ucGFrJyxcclxuICAnZ3VzdGF2LnBhaycsXHJcbiAgJ2d1c3Rhdl90ZXh0dXJlcy5wYWsnLFxyXG4gICdpY29ucy5wYWsnLFxyXG4gICdsb3d0ZXgucGFrJyxcclxuICAnbWF0ZXJpYWxzLnBhaycsXHJcbiAgJ21pbmltYXBzLnBhaycsXHJcbiAgJ21vZGVscy5wYWsnLFxyXG4gICdzaGFyZWQucGFrJyxcclxuICAnc2hhcmVkc291bmRiYW5rcy5wYWsnLFxyXG4gICdzaGFyZWRzb3VuZHMucGFrJyxcclxuICAndGV4dHVyZXMucGFrJyxcclxuICAndmlydHVhbHRleHR1cmVzLnBhaycsXHJcbl0pO1xyXG5cclxuZXhwb3J0IGNvbnN0IExTTElCX0ZJTEVTID0gbmV3IFNldChbXHJcbiAgJ2RpdmluZS5leGUnLFxyXG4gICdsc2xpYi5kbGwnLFxyXG5dKTtcclxuXHJcbmV4cG9ydCBjb25zdCBOT1RJRl9JTVBPUlRfQUNUSVZJVFkgPSAnYmczLWxvYWRvcmRlci1pbXBvcnQtYWN0aXZpdHknOyJdfQ==