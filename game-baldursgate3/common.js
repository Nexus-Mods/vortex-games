"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INVALID_LO_MOD_TYPES = exports.LO_FILE_NAME = exports.LSLIB_URL = exports.GAME_ID = exports.DEFAULT_MOD_SETTINGS = void 0;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY29tbW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFhLFFBQUEsb0JBQW9CLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1FBdUI1QixDQUFDO0FBQ0ksUUFBQSxPQUFPLEdBQUcsY0FBYyxDQUFDO0FBQ3pCLFFBQUEsU0FBUyxHQUFHLGtDQUFrQyxDQUFDO0FBQy9DLFFBQUEsWUFBWSxHQUFHLGdCQUFnQixDQUFDO0FBQ2hDLFFBQUEsb0JBQW9CLEdBQUcsQ0FBQyx1QkFBdUIsRUFBRSxXQUFXLEVBQUUsY0FBYyxFQUFFLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBjb25zdCBERUZBVUxUX01PRF9TRVRUSU5HUyA9IGA8P3htbCB2ZXJzaW9uPVwiMS4wXCIgZW5jb2Rpbmc9XCJVVEYtOFwiIHN0YW5kYWxvbmU9XCJ5ZXNcIj8+XG48c2F2ZT5cbiAgPHZlcnNpb24gbWFqb3I9XCI0XCIgbWlub3I9XCIwXCIgcmV2aXNpb249XCIxMFwiIGJ1aWxkPVwiMTAwXCIvPlxuICA8cmVnaW9uIGlkPVwiTW9kdWxlU2V0dGluZ3NcIj5cbiAgICA8bm9kZSBpZD1cInJvb3RcIj5cbiAgICAgIDxjaGlsZHJlbj5cbiAgICAgICAgPG5vZGUgaWQ9XCJNb2RPcmRlclwiPlxuICAgICAgICAgIDxjaGlsZHJlbi8+XG4gICAgICAgIDwvbm9kZT5cbiAgICAgICAgPG5vZGUgaWQ9XCJNb2RzXCI+XG4gICAgICAgICAgPGNoaWxkcmVuPlxuICAgICAgICAgICAgPG5vZGUgaWQ9XCJNb2R1bGVTaG9ydERlc2NcIj5cbiAgICAgICAgICAgICAgPGF0dHJpYnV0ZSBpZD1cIkZvbGRlclwiIHR5cGU9XCJMU1N0cmluZ1wiIHZhbHVlPVwiR3VzdGF2RGV2XCIvPlxuICAgICAgICAgICAgICA8YXR0cmlidXRlIGlkPVwiTUQ1XCIgdHlwZT1cIkxTU3RyaW5nXCIgdmFsdWU9XCJcIi8+XG4gICAgICAgICAgICAgIDxhdHRyaWJ1dGUgaWQ9XCJOYW1lXCIgdHlwZT1cIkxTU3RyaW5nXCIgdmFsdWU9XCJHdXN0YXZEZXZcIi8+XG4gICAgICAgICAgICAgIDxhdHRyaWJ1dGUgaWQ9XCJVVUlEXCIgdHlwZT1cIkZpeGVkU3RyaW5nXCIgdmFsdWU9XCIyOGFjOWNlMi0yYWJhLThjZGEtYjNiNS02ZTkyMmY3MWI2YjhcIi8+XG4gICAgICAgICAgICAgIDxhdHRyaWJ1dGUgaWQ9XCJWZXJzaW9uNjRcIiB0eXBlPVwiaW50NjRcIiB2YWx1ZT1cIjM2MDI4Nzk3MDE4OTYzOTY4XCIvPlxuICAgICAgICAgICAgPC9ub2RlPlxuICAgICAgICAgIDwvY2hpbGRyZW4+XG4gICAgICAgIDwvbm9kZT5cbiAgICAgIDwvY2hpbGRyZW4+XG4gICAgPC9ub2RlPlxuICA8L3JlZ2lvbj5cbjwvc2F2ZT5gO1xuZXhwb3J0IGNvbnN0IEdBTUVfSUQgPSAnYmFsZHVyc2dhdGUzJztcbmV4cG9ydCBjb25zdCBMU0xJQl9VUkwgPSAnaHR0cHM6Ly9naXRodWIuY29tL05vcmJ5dGUvbHNsaWInO1xuZXhwb3J0IGNvbnN0IExPX0ZJTEVfTkFNRSA9ICdsb2FkT3JkZXIuanNvbic7XG5leHBvcnQgY29uc3QgSU5WQUxJRF9MT19NT0RfVFlQRVMgPSBbJ2JnMy1sc2xpYi1kaXZpbmUtdG9vbCcsICdiZzMtYmczc2UnLCAnYmczLXJlcGxhY2VyJywgJ2JnMy1sb29zZScsICdkaW5wdXQnXTsiXX0=