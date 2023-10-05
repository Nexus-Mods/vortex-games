import React from 'react';
import { ControlLabel, FormGroup, HelpBlock, Panel } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useSelector, useStore } from 'react-redux';
import { Toggle, types } from 'vortex-api';
import { setAutoExportLoadOrder } from './actions';

function Settings() {

  const store = useStore();

  const autoExportLoadOrder = useSelector((state: types.IState) =>
    state.settings['baldursgate3']?.autoExportLoadOrder);

  const setUseAutoExportLoadOrderToGame = React.useCallback((enabled: boolean) => {
    console.log(`setAutoExportLoadOrder=${enabled}`)
    store.dispatch(setAutoExportLoadOrder(enabled));
  }, []);
  
  const { t } = useTranslation();

  return (
    <form>
      <FormGroup controlId='default-enable'>
        <Panel>
          <Panel.Body>
            <ControlLabel>{t('Baldur\'s Gate 3')}</ControlLabel>
            <Toggle
              checked={autoExportLoadOrder}
              onToggle={setUseAutoExportLoadOrderToGame}
            >
              {t('Auto export load order to game on deploy')}
            </Toggle>
            <HelpBlock>
              {t('If checked, when Vortex deploys mods to the game it will also export the load order. ' +
              'If it\s not checked and you wish the game to use your load order, then this will need to be completed manually using the buttons on the load order screen')}
            </HelpBlock>
          </Panel.Body>
        </Panel>
      </FormGroup>
    </form>
  );
}

export default Settings;
