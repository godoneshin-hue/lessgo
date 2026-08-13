const { app, BrowserWindow, shell } = require('electron')

// Loads the live site directly, same idea as capacitor.config.ts's
// server.url — shipping a web update doesn't require a new desktop release.
const APP_URL = 'https://lessgo-mu.vercel.app'

function createWindow() {
  const win = new BrowserWindow({
    width: 420,
    height: 860,
    minWidth: 360,
    minHeight: 600,
    icon: __dirname + '/icon.ico',
    title: 'LessGo',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  win.loadURL(APP_URL)

  // Anything that tries to open a new window (OAuth popups, external links)
  // opens in the user's real browser instead of a second app window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
