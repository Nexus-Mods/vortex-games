import React from 'react';
import { ControlLabel, FormGroup, HelpBlock, Panel } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useSelector, useStore } from 'react-redux';
import { Toggle, More, selectors, types } from 'vortex-api';
import { setRecommendations, setMergeConfigs } from './actions';
import { GAME_ID } from './common';

interface IConnectedProps {
  profileId: string;
}

function Settings() {
  const sdvSettings = useSelector((state: any) => state.settings['SDV']);
  const { useRecommendations, mergeConfigs } = sdvSettings;
  const store = useStore();
  const { profileId } = useSelector(mapStateToProps);

  const setUseRecommendations = React.useCallback((enabled: boolean) => {
    store.dispatch(setRecommendations(enabled));
  }, []);

  const setMergeConfigSetting = React.useCallback((enabled: boolean) => {
    store.dispatch(setMergeConfigs(profileId, enabled));
  }, [profileId]);
  
  const { t } = useTranslation();

  return (
    <form>
      <FormGroup controlId='default-enable'>
        <Panel>
          <Panel.Body>
            <ControlLabel>{t('Stardew Valley')}</ControlLabel>
            <Toggle
              checked={useRecommendations}
              onToggle={setUseRecommendations}
            >
              {t('Use recommendations from the mod manifests')}
            </Toggle>
            <Toggle checked={mergeConfigs} onToggle={setMergeConfigSetting}>
              {t('Manage SDV mod configuration files')}
              <More id='sdv_mod_configuration' name='SDV Mod Configuration'>
                {t('Vortex by default is configured to attempt to pull-in newly created files (mod configuration json files for example) '
                 + 'created externally (by the game itself or tools) into their respective mod folders.\n\n'
                 + 'Unfortunately the configuration files are lost during mod updates when using this method.\n\n'
                 + 'Toggling this functionality creates a separate mod configuration "override" folder where all of your mod configuration files '
                 + 'will be stored. This allows you to manage your mod configuration files on their own, regardless of mod updates. '
                )}
              </More>
            </Toggle>
            <HelpBlock>
              {t('If checked, when you install a mod for Stardew Valley you may get '
                + 'suggestions for installing further mods, required or recommended by it.'
                + 'This information could be wrong or incomplete so please carefully '
                + 'consider before accepting them.')}
            </HelpBlock>
          </Panel.Body>
        </Panel>
      </FormGroup>
    </form>
  );
}

function mapStateToProps(state: types.IState): IConnectedProps {
  const profileId = selectors.lastActiveProfileForGame(state, GAME_ID);
  return {
    profileId,
  }
}

export default Settings;
