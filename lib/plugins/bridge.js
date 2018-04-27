'use strict';
const ms = require('ms');
const {promisify} = require('util');
const createDexcomIterator = require('dexcom-share');
const minutes = v => ms(v) / ms('1m');

function init (env, entries) {
  const { bridge } = env.extendedSettings;
  if (bridge && bridge.userName && bridge.password) {
    return start(bridge, entries).catch(err => {
      console.error('Bridge error:', err);
      init(env, entries);
    });
  } else {
    console.info('Dexcom bridge not enabled');
  }
}

async function start (bridge, entries) {
  const create = promisify(entries.create.bind(entries));

  const iterator = createDexcomIterator({
    username: bridge.userName,
    password: bridge.password
  });

  // Upon startup, attempt to grab a lot of data
  let readings = await iterator.read({
    minutes: minutes('1d')
  });
  console.log('Requested one day of readings, got %d', readings.length);
  await create(readings);
  readings = null;

  // Read Dexcom sensor readings, forever
  for await (const reading of iterator) {
    await create([reading]);
  }
}

module.exports = init;
