// main.js
const { app, BrowserWindow, Menu, ipcMain, dialog, globalShortcut } = require("electron");
const path = require("node:path");
const log = require("electron-log");
const { autoUpdater } = require("electron-updater");

let mainWindow, splashWindow;

// Configure logging
log.transports.file.level = "debug";
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";

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
    mainWindow.loadFile(path.join(__dirname,  "index.html"));
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

// Function to check for updates
const checkForUpdates = () => {
  log.info("Starting update check...");

  // Configure autoUpdater
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  // Event handlers
  autoUpdater.on("checking-for-update", () => {
    log.info("Checking for updates...");
    if (mainWindow) {
      mainWindow.webContents.send("update-checking");
    }
  });

  autoUpdater.on("update-available", (info) => {
    log.info("Update available:", info);
    if (mainWindow) {
      mainWindow.webContents.send("update-available", info);
    }
    dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "Update Available",
      message: `Version ${info.version} is available. Downloading...`,
      buttons: ["OK"]
    });
  });

  autoUpdater.on("update-not-available", (info) => {
    log.info("Update not available:", info);
    if (mainWindow) {
      mainWindow.webContents.send("update-not-available", info);
    }
  });

  autoUpdater.on("error", (err) => {
    log.error("Error in auto-updater:", err);
    if (mainWindow) {
      mainWindow.webContents.send("update-error", err.toString());
    }
    dialog.showErrorBox(
        "Update Error",
        "Failed to check for updates. Please try again later."
    );
  });

  autoUpdater.on("download-progress", (progressObj) => {
    let message = `Download speed: ${progressObj.bytesPerSecond}`;
    message += ` - Downloaded ${progressObj.percent}%`;
    message += ` (${progressObj.transferred}/${progressObj.total})`;
    log.info(message);

    // Update the UI with progress
    if (mainWindow) {
      mainWindow.webContents.send("update-progress", progressObj);
    }
  });

  autoUpdater.on("update-downloaded", (info) => {
    log.info("Update downloaded:", info);
    if (mainWindow) {
      mainWindow.webContents.send("update-downloaded", info);
    }
    dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "Update Ready",
      message: "Update has been downloaded. The application will be quit and updated...",
      buttons: ["Restart now", "Later"],
    }).then((returnValue) => {
      if (returnValue.response === 0) {
        autoUpdater.quitAndInstall(false, true);
      }
    });
  });

  // Check for updates
  try {
    log.info("Triggering update check...");
    autoUpdater.checkForUpdates()
        .then(result => {
          log.info("Update check completed successfully", result);
        })
        .catch(err => {
          log.error("Update check failed with error:", err);
        });
  } catch (error) {
    log.error("Exception when checking for updates:", error);
  }
};

// Add IPC handler for manual update checks
ipcMain.handle("check-for-updates", () => {
  log.info("Manual update check requested");
  checkForUpdates();
  return "Update check started";
});

// App event handlers
app.whenReady().then(() => {
  log.info("App is ready, creating windows");
  createWindow();

  // Initial update check
  log.info("Performing initial update check");
  setTimeout(() => {
    checkForUpdates();
  }, 3000); // Delay initial check by 3 seconds to ensure app is fully loaded

  // Check for updates every hour
  setInterval(() => {
    log.info("Performing scheduled update check");
    checkForUpdates();
  }, 60 * 60 * 1000);

  // Register DevTools shortcut
  globalShortcut.register('Ctrl+Shift+I', () => {
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
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// IPC handlers
ipcMain.handle('get-version', () => {
  return app.getVersion();
});