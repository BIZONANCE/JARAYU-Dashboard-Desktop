
# Electron Application

This Electron application is designed with a splash screen that displays during the loading process and transitions to the main window once the content has finished loading. The app loads a React build and features session management with cookies.

## Features

- **Splash Screen**: A transparent splash screen appears first, which fades out and closes once the main window is ready.
- **Main Window**: Displays the React app from a local build directory.
- **Session Handling**: The app includes a session handling mechanism with cookies.
- **Custom Icon**: The main window features a custom application icon.

## Prerequisites

Before running the application, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v12 or higher)
- [Electron](https://www.electronjs.org/)

## Installation

1. Clone or download this repository.
2. Open a terminal and navigate to the project directory.
3. Install the necessary dependencies by running:

   ```bash
   npm install
   ```

4. To build the React app, run:

   ```bash
   npm run build
   ```

5. Run the Electron app:

   ```bash
   npm start
   ```

## File Structure

- `main.js`: The entry point of the Electron app where the main window and splash screen are created, and session handling is set up.
- `preload.js`: A preload script for setting up context isolation and other features.
- `splash.html`: HTML file for the splash screen.
- `build/`: The directory containing the React app build (`index.html` is the entry point of the React app).
- `singonaa_logo.png`: The custom logo for the app.
- `package.json`: The configuration file for the project, including dependencies and scripts.

## How It Works

1. **Main Window**: The `mainWindow` is created with a width of 800px and a height of 600px. It loads the React app from the `build` directory if the build exists.
   
2. **Splash Window**: The `splashWindow` appears first with a transparent background and no window frame. It stays on top and is non-resizable.
   
3. **Loading and Transition**: Once the main window's content is fully loaded, the splash screen fades out and is closed. The main window then becomes visible.

4. **Session Management**: The app uses Electron's session API to listen for cookie changes, but no specific logic is implemented for cookies in the current version.

## Code Explanation

The app is set up as follows:

### 1. Main and Splash Window Creation:

```javascript
let mainWindow, splashWindow;
const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, "singonaa_logo.png"),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  splashWindow = new BrowserWindow({
    width: 600,
    height: 600,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    resizable: false,
    webPreferences: { preload: path.join(__dirname, "preload.js") },
  });

  splashWindow.loadFile(path.join(__dirname, "splash.html"));
};
```

- `mainWindow`: The main app window with a custom icon, which is hidden until fully loaded.
- `splashWindow`: A transparent, always-on-top window shown first as a splash screen.

### 2. Loading React Build:

```javascript
const reactBuildPath = path.join(__dirname, "build", "index.html");
if (fs.existsSync(reactBuildPath)) mainWindow.loadFile(reactBuildPath);
```

- The app checks if the React build exists (`build/index.html`), and if it does, the `mainWindow` loads the React app.

### 3. Transition from Splash Screen to Main Window:

```javascript
mainWindow.webContents.once("did-finish-load", () => {
  setTimeout(() => {
    splashWindow.webContents.executeJavaScript(
      "document.body.style.transition='opacity 1s ease-out';document.body.style.opacity=0;",
      true
    );
    splashWindow.webContents
      .executeJavaScript(
        "new Promise(resolve=>{document.body.addEventListener('transitionend',resolve,{once:true});})"
      )
      .then(() => {
        splashWindow.close();
        mainWindow.show();
      });
  }, 5000);
});
```

- After 5 seconds, the splash screen fades out and the main window becomes visible.

### 4. Session Management:

```javascript
const handleSession = () => {
  session.defaultSession.cookies.on("changed", () => {});
};
```

- This code listens for cookie changes, though no specific actions are taken yet.

### 5. Application Menu and Window Behavior:

```javascript
Menu.setApplicationMenu(null);
app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
```

- The application menu is disabled, and window behavior is set so that the app quits when all windows are closed (except on macOS).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
