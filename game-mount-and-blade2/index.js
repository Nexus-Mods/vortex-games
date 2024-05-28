const path = require('path');
function main(context) {
  context.registerGameStub({
    id: 'mountandblade2bannerlord',
    executable: () => path.join('bin', 'Win64_Shipping_Client', 'Bannerlord.exe'),
    mergeMods: false,
    name: 'Mount & Blade II:\tBannerlord',
    queryModPath: () => '.',
    requiredFiles: [],
  }, {
    name: "Game: Mount and Blade II: Bannerlord (BUTR)",
    modId: 875,
    fileId: 3270,
  });
}

module.exports = {
  default: main
};
