import * as React from 'react';
import { Checkbox, ListGroupItem } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { actions, Icon, tooltip, selectors, types, util, MainContext } from 'vortex-api';
import { I18N_NAMESPACE, GAME_ID } from '../common';
import { IItemRendererProps } from '../types';

interface IConnectedProps {
  modState: any;
  loadOrder: types.LoadOrder;
  profile: types.IProfile;
  mods: { [modId: string]: types.IMod };
}

interface IBaseProps {
  className?: string;
  item: IItemRendererProps;
}

type IProps = IBaseProps & IConnectedProps;

export function ItemRenderer(props: IBaseProps) {
  if (props?.item?.loEntry === undefined) {
    return null;
  }
  const stateProps = useSelector(mapStateToProps);
  return renderDraggable({ ...props, ...stateProps });
}

function renderValidationError(props: IProps): JSX.Element {
  const { invalidEntries, loEntry } = props.item;
  const invalidEntry = (invalidEntries !== undefined)
    ? invalidEntries.find(inv => inv.id.toLowerCase() === loEntry.id.toLowerCase())
    : undefined;
  return (invalidEntry !== undefined)
    ? (
      <tooltip.Icon
        className='fblo-invalid-entry'
        name='feedback-error'
        tooltip={invalidEntry.reason}
      />
    ) : null;
}

function renderViewModIcon(props: IProps): JSX.Element {
  const { item, mods } = props;
  if (isExternal(item.loEntry) || item.loEntry.modId === item.loEntry.name) {
    return null;
  }
  const context = React.useContext(MainContext);
  const [t] = useTranslation(I18N_NAMESPACE);
  const onClick = React.useCallback(() => {
    const { modId } = item.loEntry;
    const mod = mods?.[modId];
    if (mod === undefined) {
      return;
    }
    const batched = [
      actions.setAttributeFilter('mods', 'name', util.renderModName(mod)),
    ];
    util.batchDispatch(context.api.store.dispatch, batched);
    context.api.events.emit('show-main-page', 'Mods');
  }, [item, mods, context]);
  return item.loEntry.modId !== undefined ? (
    <tooltip.IconButton
      className='witcher3-view-mod-icon'
      icon='open-ext'
      tooltip={t('View source Mod')}
      onClick={onClick}
    />
  ) : null;
}

function renderExternalBanner(item: types.ILoadOrderEntry): JSX.Element {
  const [t] = useTranslation(I18N_NAMESPACE);
  return isExternal(item) ? (
    <div className='load-order-unmanaged-banner'>
      <Icon className='external-caution-logo' name='feedback-warning' />
      <span className='external-text-area'>{t('Not managed by Vortex')}</span>
    </div>
  ) : null;
}

function renderDraggable(props: IProps): JSX.Element {
  const { loadOrder, className, item, profile } = props;
  const key = !!item?.loEntry?.name ? `${item.loEntry.name}` : `${item.loEntry.id}`;
  const dispatch = useDispatch();
  const position = loadOrder.findIndex(entry => entry.id === item.loEntry.id) + 1;

  let classes = ['load-order-entry'];
  if (className !== undefined) {
    classes = classes.concat(className.split(' '));
  }

  if (isExternal(item.loEntry)) {
    classes = classes.concat('external');
  }

  const onStatusChange = React.useCallback((evt: any) => {
    const entry = {
      ...item.loEntry,
      enabled: evt.target.checked,
    };
    dispatch(actions.setFBLoadOrderEntry(profile.id, entry))
  }, [dispatch, profile, item]);

  const checkBox = () => (item.displayCheckboxes)
    ? (
      <Checkbox
        className='entry-checkbox'
        checked={item.loEntry.enabled}
        disabled={isLocked(item.loEntry)}
        onChange={onStatusChange}
      />
    )
    : null;

  const lock = () => (isLocked(item.loEntry))
    ? (
      <Icon className='locked-entry-logo' name='locked' />
    ) : null;

  return (
    <ListGroupItem
      key={key}
      className={classes.join(' ')}
      ref={props.item.setRef}
    >
      <Icon className='drag-handle-icon' name='drag-handle' />
      <p className='load-order-index'>{position}</p>
      {renderValidationError(props)}
      <p className='load-order-name'>{key}</p>
      {renderExternalBanner(item.loEntry)}
      {renderViewModIcon(props)}
      {checkBox()}
      {lock()}
    </ListGroupItem>
  );
}

function isLocked(item: types.ILoadOrderEntry): boolean {
  return [true, 'true', 'always'].includes(item.locked);
}

function isExternal(item: types.ILoadOrderEntry): boolean {
  return (item.modId !== undefined) ? false : true;
}

const empty = {};
function mapStateToProps(state: types.IState): IConnectedProps {
  const profile: types.IProfile = selectors.activeProfile(state);
  return {
    profile,
    loadOrder: util.getSafe(state, ['persistent', 'loadOrder', profile.id], []),
    modState: util.getSafe(profile, ['modState'], empty),
    mods: util.getSafe(state, ['persistent', 'mods', GAME_ID], {}),
  };
}

export default ItemRenderer;
