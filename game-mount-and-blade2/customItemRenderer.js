const React = require('react');
const BS = require('react-bootstrap');
const { connect } = require('react-redux');
const path = require('path');
const mnb2extension = require('./index');
const { actions, TriStateCheckbox, FlexLayout, tooltip, selectors, util } = require('vortex-api');

const TWLOGO = path.join(__dirname, 'TWLogo.png');

class CustomItemRenderer extends React.Component {
  constructor(props) {
    super(props);
  }

  renderAddendum(props) {
    // Extra stuff we want to add to the LO entry.
    //  Currently renders the open directory button for
    const { item, order, mods } = props;
    const managedModKeys = Object.keys(mods);
    const isLocked = !!order[item.id]?.locked;

    const renderLock = () => {
      return React.createElement(tooltip.Icon, { name: 'locked', tooltip: 'Entry is locked in position' });
    }

    const renderInfo = () => {
      return React.createElement(tooltip.Icon, { name: 'dialog-info', tooltip: 'Not managed by Vortex' });
    }

    return (this.isItemInvalid(item))
      ? this.renderOpenDirButton(props)
      : (isLocked)
        ? renderLock()
        : !managedModKeys.includes(item.id)
          ? renderInfo()
          : null
  }

  // TODO: move all style configuration into a stylesheet
  renderOfficialEntry(item) {
    return React.createElement('div', { style: { display: 'flex', alignItems: 'center' } }, 
      React.createElement('img', {
      src: TWLOGO,
      className: 'official-submodule-logo',
      style: {
        width:'1.5em',
        height:'1.5em',
        marginRight:'5px',
      },
    }),
    React.createElement('p', {}, item.name));
  }

  renderEntry(props) {
    const { item, order } = props;
    const isEnabled = !!order[item.id]?.locked || order[item.id].enabled;
    return React.createElement(TriStateCheckbox, {
      checked: isEnabled,
      disabled: !!item?.locked,
      indeterminate: !!order[item.id]?.locked,
      onContextMenu: (chkStat) => this.onRighClick(chkStat, props),
      onChangeCB: (evt) => this.onStatusChange(evt, props)}, item.name);
  }

  renderInvalidEntry(item) {
    const invalidReason = this.itemInvalidReason(item);
    const reasonElement = () => (invalidReason !== undefined) 
      ? React.createElement(tooltip.Icon, { style: {color: 'red'}, name: 'feedback-error', tooltip: invalidReason })
      : null;
    return React.createElement(TriStateCheckbox, {
      checked: false,
      inditerminate: false,
      disabled: true }, item.name, ' ', reasonElement());
  }

  render() {
    const { order, className, item } = this.props;
    const position = (item.prefix !== undefined)
      ? item.prefix
      : order[item.id].pos + 1;

    let classes = ['load-order-entry'];
    if (className !== undefined) {
      classes = classes.concat(className.split(' '));
    }

    const key = `${item.name}-${position}`;
    return React.createElement(BS.ListGroupItem, {
      className: 'load-order-entry',
      ref: (ref) => this.setRef(ref, this.props),
      key,
      style: { height: '48px' },
    },
    React.createElement(FlexLayout, { type: 'row', height: '20px' },
      React.createElement(FlexLayout.Flex, {
        style: {
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
          height: '20px',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
        }
      }, (this.isItemInvalid(item))
        ? this.renderInvalidEntry(item)
        : (item.official)
          ? this.renderOfficialEntry(item)
          : this.renderEntry(this.props)
        ),
      React.createElement(FlexLayout.Flex, {
        style: {
          display: 'flex',
          justifyContent: 'flex-end',
        }
      }, this.renderAddendum(this.props))));
  }

  isItemInvalid(item) {
    const indexPath = path.join(__dirname, 'index.js');
    const validFunc = mnb2extension.dynreq(indexPath).getValidationInfo;
    const infoObj = validFunc(item.id);
    return ((infoObj.missing.length > 0) || (infoObj.cyclic.length > 0));
  }

  itemInvalidReason(item) {
    const indexPath = path.join(__dirname, 'index.js');
    const validFunc = mnb2extension.dynreq(indexPath).getValidationInfo;
    const infoObj = validFunc(item.id);

    if (infoObj.missing.length > 0) {
      // This mod is missing a dependency, that's
      //  somewhat more pressing at the moment.
      return `Missing dependencies: ${infoObj.missing.join(';')}`;
    }

    if (infoObj.cyclic.length > 0) {
      return `Cyclic dependencies: ${infoObj.cyclic.join(';')}`;
    }

    return undefined;
  }

  renderOpenDirButton(props) {
    const { item, mods, modsPath, installPath } = props;
    const managedModKeys = Object.keys(mods);
    const itemPath = managedModKeys.includes(item.id)
      ? path.join(installPath, mods[item.id].installationPath)
      : path.join(modsPath, 'Modules', item.id);
    return React.createElement(tooltip.IconButton, {
      icon: 'open-ext',
      tooltip: 'Open path',
      className: 'btn-embed btn-dismiss',
      onClick: () => util.opn(itemPath).catch(err => null) });
  }

  onRighClick(checkBoxStatus, props) {
    const { profile, order, item, onSetLoadOrderEntry } = props;
    const isLockState = (checkBoxStatus === 'locked');
    const entry = {
      pos: order[item.id].pos,
      enabled: (!!isLockState) ? true : order[item.id].enabled,
      locked: isLockState,
    }

    onSetLoadOrderEntry(profile.id, item.id, entry);
  }

  onStatusChange(evt, props) {
    const { profile, order, item, onSetLoadOrderEntry } = props;
    const entry = {
      pos: order[item.id].pos,
      enabled: evt.target.checked,
      locked: false,
    }

    onSetLoadOrderEntry(profile.id, item.id, entry);
  }

  setRef (ref, props) {
    return props.onRef(ref);
  }
}

function mapStateToProps(state) {
  const profile = selectors.activeProfile(state);
  const game = util.getGame(profile.gameId);
  const discovery = selectors.discoveryByGame(state, profile.gameId);
  const modsPath = game.getModPaths(discovery.path)[''];
  const installPath = selectors.installPathForGame(state, profile.gameId);
  return {
    profile,
    modsPath,
    installPath,
    mods: util.getSafe(state, ['persistent', 'mods', profile.gameId], {}),
    order: util.getSafe(state, ['persistent', 'loadOrder', profile.id], []),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onSetLoadOrderEntry: (profileId, modId, entry) =>
      dispatch(actions.setLoadOrderEntry(profileId, modId, entry)),
    onSetDeploymentRequired: () =>
      dispatch(actions.setDeploymentNecessary('mountandblade2bannerlord', true)),
  };
}

module.exports = {
  default : connect(mapStateToProps, mapDispatchToProps)(CustomItemRenderer),
}