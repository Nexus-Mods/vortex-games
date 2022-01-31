// domain name
const GAME_ID = 'bladeandsorcery';
const I18N_NAMESPACE = 'game-bladeandsorcery';

// official mod manifest file.
const MOD_MANIFEST = 'manifest.json';

const BAS_DB = 'bas.jsondb';

class GameNotDiscoveredException extends Error {
  constructor() {
    super('bladeandsorcery was not discovered');
    this.name = this.constructor.name;
  }
}

module.exports = {
  BAS_DB,
  GAME_ID,
  I18N_NAMESPACE,
  MOD_MANIFEST,
  GameNotDiscoveredException,
}