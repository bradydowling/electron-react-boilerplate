/* eslint global-require: 0, flowtype-errors/show-errors: 0 */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 *
 * @flow
 */
import { app, BrowserWindow, dialog } from 'electron';
import MenuBuilder from './menu';

const log = require('electron-log');
const { autoUpdater } = require('electron-updater');

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

let mainWindow = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  require('electron-debug')();
  const path = require('path');
  const p = path.join(__dirname, '..', 'app', 'node_modules');
  require('module').globalPaths.push(p);
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];

  return Promise.all(
    extensions.map(name => installer.default(installer[name], forceDownload))
  ).catch(console.log);
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', async () => {
  autoUpdater.checkForUpdates();
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728
  });

  mainWindow.loadURL(`file://${__dirname}/app.html`);

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();
});

autoUpdater.on('checking-for-update', () => {
  dialog.showMessageBox({
    type: 'info',
    title: 'mytitle',
    message: 'checking for updates'
  });
  console.log('checking for updates');
});
autoUpdater.on('update-available', info => {
  dialog.showMessageBox({
    type: 'info',
    title: 'mytitle',
    message: 'update available'
  });
  console.log('update available');
  console.log(info);
});
autoUpdater.on('update-not-available', info => {
  dialog.showMessageBox({
    type: 'info',
    title: 'update not available',
    message: typeof info === 'string' ? info : JSON.parse(info, null, 4)
  });
  console.log('update not available');
  console.log(info);
});
autoUpdater.on('error', err => {
  dialog.showMessageBox({
    type: 'error',
    title: 'update error',
    message: typeof info === 'string' ? err : JSON.parse(err, null, 4)
  });
  console.log(err);
});
autoUpdater.on('download-progress', () => {});
autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall();
});
