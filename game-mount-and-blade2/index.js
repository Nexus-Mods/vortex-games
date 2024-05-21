function main(context) {
  context.registerGameStub({
    id: 'mountandblade2bannerlord',
    executable: null,
    mergeMods: false,
    name: 'Mount & Blade II:\tBannerlord',
    queryModPath: () => '.',
    requiredFiles: [],
  }, {
    name: 'Game: Mount and Blade II: Bannerlord',
    modId: 875,
  });
}

module.exports = {
  default: main
};
