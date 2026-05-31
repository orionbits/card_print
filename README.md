### Phase 1: Locate and Extract the ASAR Archive

Electron applications store their source code in a file named `app.asar`, usually located in the `resources` folder of your extracted directory.

1.  **Navigate to the `resources` folder**:
    Look inside the folder where you extracted the `exe`. The path usually looks like this:
    `DiziPrint_App_x64\resources\app.asar`

2.  **Install the official ASAR tool**:
    Open a command prompt or terminal (as Administrator).
    ```bash
    npm install -g asar
    ```
    *If you don't have Node.js installed, download it from nodejs.org first.*

3.  **Extract the source code**:
    Run the following command in the terminal, pointing to your `app.asar` file:
    ```bash
    asar extract app.asar ./source_code
    ```
    *Alternatively, if you want to avoid global installs:* `npx asar extract app.asar ./source_code` 

Once this completes, you will have a folder named `source_code` containing all the files that were packed inside your app.

---

### Phase 2: Restoring the Original Project Structure

When you look inside `source_code`, you might panic. Electron build tools (like Webpack or Electron Forge) usually compile the code into **one or two large, minified files** (e.g., `index.js`, `renderer.js`). It will not look like your neat development folders immediately .

**Do not try to edit the minified code directly.** You need to reverse the build process or simply set up a new project structure.

#### Method A: The "Drop-in" Recovery (Quickest)
If you just want to get the app running again so you can debug it or see the logic:

1.  **Copy the extracted folder** into a new directory.
2.  **Run `npm install`** inside that folder (if a `package.json` exists).
3.  **Run the app:** `npm start`
    *Note:* If the app was built with Webpack, `npm start` might fail because the "source" files are minified. However, the app will likely launch because the pre-compiled bundles are present.

#### Method B: The "Clean" Recovery (Recommended for Developers)
Since you want to **enhance features**, you should set up a new clean Electron project and migrate your unique business logic.

1.  **Create a new Electron project:**
    ```bash
    mkdir DiziPrint_New
    cd DiziPrint_New
    npm init -y
    npm install electron
    ```

2.  **Recreate your `main.js`**:
    Look at the extracted `main.js` (or `background.js`) in the `source_code` folder.
    - Copy the **window creation logic** (size, frameless options, etc.)
    - Copy the **IPC handlers** (`ipcMain.handle` calls).
    - Copy the **internal API endpoints** (the URLs your app calls).

3.  **Extract React/UI Components**:
    Look for a file named something like `renderer.js`, `app.js`, or `bundle.js`.
    - Use a formatter (like Prettier or JS Beautify) to make the code readable.
    - Search for your unique component names (e.g., `PhotoBatchStudio`, `ManualCropModal`).
    - Copy the logic from these functions into your new, clean component files.

---

### Phase 3: Dealing with "Minified" vs "Original" Code

You mentioned you are "not getting clean code." This is likely because your build process minified the code. Here is how to handle that:

1.  **Deobfuscate the code**:
    Use a tool like `js-beautify` to make the large JS files readable .
    ```bash
    npm install -g js-beautify
    js-beautify source_code/dist/bundle.js > cleaned_code.js
    ```

2.  **Check for Source Maps**:
    Look for `.map` files inside the extracted folder. If they exist, you can use them to reconstruct the original folder structure almost perfectly using tools like `source-map` or Webpack's `source-map-explorer` .

3.  **Check for ASAR Unpacked**:
    Look for a folder named `app.asar.unpacked`. This usually contains native Node.js modules (`.node` files) or large binaries that were excluded from the main archive. Copy this folder into your new project .

### Summary Checklist for Recovery

To get back to a working development state, ensure you have recovered these three things from the extracted `source_code`:

| Component | Where to find it | Why you need it |
| :--- | :--- | :--- |
| **Main Process Logic** | `main.js`, `background.js`, or `index.js` in the root of the extraction. | Handles window creation, file system access, and native OS interactions. |
| **Preload Script** | `preload.js` | Securely exposes APIs to the frontend. Vital for security. |
| **Business Logic** | Inside the `dist` or `build` folder (minified). | Your React/Vue components and the unique features of the Print Studio. |

Once you have these pieces, paste them into a fresh `electron-forge` or `electron-vite` project template. This will give you the "clean" development environment you need to add new features without the constraints of the old build system.
