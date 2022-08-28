const path = require('path');
const { fs, log, util } = require('vortex-api');

const GAME_ID = 'armouredcommander2';
const STEAMAPP_ID = '1292020';

function findGame() {
	return util.GameStoreHelper.findByAppId([STEAMAPP_ID]).then(game => game.gamePath);
};

function modFolder() {
	return path.join(require('os').homedir(), 'ArmCom2', 'mods')
};

function main(context) {	
	context.registerGame({
		id: GAME_ID,
		name: 'Armoured Commander II',
		mergeMods: false,
		queryPath: findGame,
		queryModPath: modFolder,
		logo: 'gameart.jpg',
		executable: () => 'armcom2.exe',
		requiredFiles: [
			'armcom2.exe'
		],
		setup: undefined,
		environment: {
			SteamAPPId: STEAMAPP_ID
		},
		details: {
			steamAppId: STEAMAPP_ID
		}
	});
	
	return true
};

module.exports = {
	default: main
};