import React from 'react';
import { ControlLabel, FormGroup, HelpBlock } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useSelector, useStore } from 'react-redux';
import { Toggle } from 'vortex-api';
import { setRecommendations } from './actions';

function Settings() {
  const useRecommendations = useSelector((state: any) =>
    state.settings['SDV']?.useRecommendations);

  const store = useStore();

  const setUseRecommendations = React.useCallback((enabled: boolean) => {
    store.dispatch(setRecommendations(enabled));
  }, []);
  
  const { t } = useTranslation();

  return (
    <form>
      <FormGroup controlId='default-enable'>
        <ControlLabel>{t('Stardew Valley')}</ControlLabel>
        <Toggle
          checked={useRecommendations}
          onToggle={setUseRecommendations}
        >
          {t('Use recommendations from the mod manifests')}
        </Toggle>
        <HelpBlock>
          {t('If checked, when you install a mod for Stardew Valley you may get '
             + 'suggestions for installing further mods, required or recommended by it.'
             + 'This information could be wrong or incomplete so please carefully '
             + 'consider before accepting them.')}
        </HelpBlock>
      </FormGroup>
    </form>
  );
}

export default Settings;
