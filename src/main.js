const {app, BrowserWindow, ipcMain, dialog} = require('electron');
const path = require('path');
const child_process = require("child_process")
const fs = require('fs')
const electron = require("electron");

require("update-electron-app")();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    titleBarStyle: 'hidden',
    width: 750,
    height: 750,
    minWidth: 750,
    minHeight: 750,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: true,
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({url}) => {
    electron.shell.openExternal(url);
    return {action: 'deny'}
  })

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // if (isDev) {
  //   console.log(chalk.bold("isDev"))
  //   // Open the DevTools.
  //   mainWindow.webContents.openDevTools();
  // }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

const runAnalysis = (event, analysis, dirPath, config) => {
  event.sender.send('fromMain', ['dir selected'])
  console.log(`"${path.join(__dirname, '/python/analyze')}" "${dirPath}" ${analysis} '${JSON.stringify(config)}'`)
  child_process.exec(`"${path.join(__dirname, '/python/analyze')}" "${dirPath}" ${analysis} '${JSON.stringify(config)}'`, (error, stdout, stderr) => {
    if (error) {
      event.sender.send('fromMain', ['error', {message: JSON.stringify(error)}])
    }
    if (stdout) {
      // If there is an error in here, handle appropriately, else send back success info
      if (stdout && JSON.parse(stdout)) {
        console.log(JSON.parse(stdout))
        let output = JSON.parse(stdout);
        if (output.error) {
          if (output.error === 'Exception(1)') {
            event.sender.send('fromMain', ['override_phases_duration', {
              filePaths: [dirPath],
              command: 'openFilesDialog',
              analysis,
              config,
            }])
          }
        } else {
          event.sender.send('fromMain', ['success', JSON.parse(stdout)])
        }
      } else {
        console.log(stdout)
        event.sender.send('fromMain', ['error', stdout])
      }
    }
    if (stderr) {
      console.log(stderr)
      event.sender.send('fromMain', ['error', {message: JSON.stringify({from: 'python', stderr})}])
    }
  })
}

ipcMain.on('toMain', (event, args) => {
  console.log('Evt received: ', args);
  // event.sender.send('fromMain', {
  //   file: path.join(__dirname, '/python/dist/analyze/analyze'),
  //   isFile: fs.lstatSync(path.join(__dirname, '/python/dist/analyze/analyze')).isFile(),
  //   isDir: fs.lstatSync(path.join(__dirname, '/python/dist/analyze/analyze')).isDirectory()
  // })
  if (args.command && args.command === 'open file') {
    child_process.exec(`open "${path.dirname(args.fileName)}"`, (error, stdout, stderr) => {
      if (error) {
        console.log(error)
      }
    })
  }

  if (args.command && args.command === "openFilesDialog") {
    if (args.filePaths) {
      // User dropped file/files into dropzone:
      //    - Check if uploaded a FOLDER
      //    - If not uploaded a folder, return an error

      let dirPath = args.filePaths[0];
      const isDirectory = fs.lstatSync(dirPath).isDirectory()
      if (isDirectory) {
        runAnalysis(event, args.analysis, dirPath, args.config)
      } else {
        event.sender.send('fromMain', ['error', {
          title: "Upload Folders Only",
          message: "It looks like you tried to upload individual file(s), please only upload folders."
        }])
      }
    } else {
      // User clicked on file upload, open dialog
      dialog.showOpenDialog({
        title: 'Choose Participant Folder',
        properties: ['openDirectory']
      }).then(dialogResponse => {

        if (!dialogResponse.canceled) {
          event.sender.send('fromMain', ['dir selected'])
          runAnalysis(event, args.analysis, dialogResponse.filePaths[0], args.config)
        }
      })
        .catch(err => console.log(err))
    }

  }
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
