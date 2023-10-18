export const DEFAULT_MOD_SETTINGS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
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
export const GAME_ID = 'baldursgate3';
export const LSLIB_URL = 'https://github.com/Norbyte/lslib';
export const LO_FILE_NAME = 'loadOrder.json';
export const INVALID_LO_MOD_TYPES = ['bg3-lslib-divine-tool', 'bg3-bg3se', 'bg3-replacer', 'bg3-loose', 'dinput'];