// main.js
const {
  app,
  BrowserWindow,
  Menu,
  ipcMain,
  globalShortcut,
} = require("electron");
const path = require("node:path");

let mainWindow, splashWindow;

// Function to create the main window and splash screen
const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, "bizonance_logo.png"),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Splash window settings
  splashWindow = new BrowserWindow({
    width: 600,
    height: 600,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  splashWindow.loadFile(path.join(__dirname, "splash.html"));

  // Load React app
  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "index.html"));
  }

  // Handle splash screen transition
  mainWindow.webContents.once("did-finish-load", () => {
    setTimeout(() => {
      splashWindow.webContents.executeJavaScript(
        "document.body.style.transition='opacity 1s ease-out';document.body.style.opacity=0;",
        true
      );
      splashWindow.webContents
        .executeJavaScript(
          "new Promise(resolve => { document.body.addEventListener('transitionend', resolve, { once: true }); })"
        )
        .then(() => {
          splashWindow.close();
          mainWindow.show();
        });
    }, 500);
  });

  // Hide the menu bar
  Menu.setApplicationMenu(null);
};

// App event handlers
app.whenReady().then(() => {
  app.setAppUserModelId("com.bizonance.adminpanel");

  createWindow();

  // Register DevTools shortcut
  globalShortcut.register("Ctrl+Shift+I", () => {
    if (mainWindow) {
      mainWindow.webContents.openDevTools();
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Handle window closing
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Cleanup on quit
app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

// IPC handlers
ipcMain.handle("get-version", () => {
  return app.getVersion();
});
