# Svelte + Vite

This template should help get you started developing with Svelte in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Svelte](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode).

## Need an official Svelte framework?

Check out [SvelteKit](https://github.com/sveltejs/kit#readme), which is also powered by Vite. Deploy anywhere with its serverless-first approach and adapt to various platforms, with out of the box support for TypeScript, SCSS, and Less, and easily-added support for mdsvex, GraphQL, PostCSS, Tailwind CSS, and more.

## Technical considerations

**Why use this over SvelteKit?**

- It brings its own routing solution which might not be preferable for some users.
- It is first and foremost a framework that just happens to use Vite under the hood, not a Vite app.

This template contains as little as possible to get started with Vite + Svelte, while taking into account the developer experience with regards to HMR and intellisense. It demonstrates capabilities on par with the other `create-vite` templates and is a good starting point for beginners dipping their toes into a Vite + Svelte project.

Should you later need the extended capabilities and extensibility provided by SvelteKit, the template has been structured similarly to SvelteKit so that it is easy to migrate.

**Why `global.d.ts` instead of `compilerOptions.types` inside `jsconfig.json` or `tsconfig.json`?**

Setting `compilerOptions.types` shuts out all other types not explicitly listed in the configuration. Using triple-slash references keeps the default TypeScript setting of accepting type information from the entire workspace, while also adding `svelte` and `vite/client` type information.

**Why include `.vscode/extensions.json`?**

Other templates indirectly recommend extensions via the README, but this file allows VS Code to prompt the user to install the recommended extension upon opening the project.

**Why enable `checkJs` in the JS template?**

It is likely that most cases of changing variable types in runtime are likely to be accidental, rather than deliberate. This provides advanced typechecking out of the box. Should you like to take advantage of the dynamically-typed nature of JavaScript, it is trivial to change the configuration.

**Why is HMR not preserving my local component state?**

HMR state preservation comes with a number of gotchas! It has been disabled by default in both `svelte-hmr` and `@sveltejs/vite-plugin-svelte` due to its often surprising behavior. You can read the details [here](https://github.com/sveltejs/svelte-hmr/tree/master/packages/svelte-hmr#preservation-of-local-state).

If you have state that's important to retain within a component, consider creating an external store which would not be replaced by HMR.

```js
// store.js
// An extremely simple external store
import { writable } from 'svelte/store'
export default writable(0)
```

## Create this project

### Prerequisites

```bash
$ git --version
git version 2.46.2
$ gh --version
gh version 2.57.0 (2024-09-16)
$ node --version
v20.17.0
$ java --version
openjdk 23 2024-09-17
$ curl --version
curl 8.7.1
```

### Get a Firebase project ID

- <https://console.firebase.google.com/>
    - Create a project
        - Project name: black-bream
        - Configure Google Analytics
            - Create a new account: black-bream
            - Analytics location: Japan

### Create the local project

```bash
$ npm create @vite-pwa/pwa@latest black-bream -- --template svelte
✔ PWA Name: … black-bream
✔ PWA Short Name: … black-bream
✔ PWA Description: …
✔ Theme color: … #ffffff
✔ Select a strategy: › generateSW
✔ Select a behavior: › Prompt for update
✔ Enable periodic SW updates? … no / yes
✔ Show offline ready prompt? … no / yes
✔ Generate PWA Assets Icons on the fly? … no / yes

$ cd black-bream
$ npm install
$ npm run dev -- --open
```

### Configure the Git repository

```bash
$ git init && git add -A && git commit -m "Initial commit"
$ gh auth login
$ gh repo create
? What would you like to do? Push an existing local repository to GitHub
? Path to local repository .
? Repository name black-bream
? Description Initial push
? Visibility Public
✓ Created repository MichinobuMaeda/black-bream on GitHub
  https://github.com/MichinobuMaeda/black-bream
? Add a remote? Yes
? What should the new remote be called? origin
✓ Added remote https://github.com/MichinobuMaeda/black-bream.git
? Would you like to push commits from the current branch to "origin"? Yes
```

### Configure Firebase

<https://console.firebase.google.com/u/0/project/black-bream>

- Project overview
    - Usage and billing
        - Details & settings
            - Modify plan: Blaze plan
    - Project settings
        - General
            - Your apps: </> (web)
                - App nickname: Black bream
- Build
    - Firestore Database
        - Create database
            - Database ID: (default)
                - Location: asia-northeast2 (Osaka)
                - (o) Start in production mode
    - Storage
        - Get started
            - (o) Start in production mode

```bash
$ npm i -D firebase-tools
$ npx firebase init
$ npx firebase login
$ npx firebase init
? Which Firebase features do you want to set up for this directory?
 Firestore: Configure security rules and indexes files for Firestore,
 Functions: Configure a Cloud Functions directory and its files,
 Hosting: Configure files for Firebase Hosting and
  (optionally) set up GitHub Action deploys,
 Storage: Configure a security rules file for Cloud Storage,
 Emulators: Set up local emulators for Firebase products
? Please select an option: Use an existing project
? Select a default Firebase project for this directory: black-bream (black-bream)
? What file should be used for Firestore Rules? firestore.rules
? What file should be used for Firestore indexes? firestore.indexes.json
? What language would you like to use to write Cloud Functions? JavaScript
? Do you want to use ESLint to catch probable bugs and enforce style? No
? Do you want to install dependencies with npm now? No
? What do you want to use as your public directory? dist
? Configure as a single-page app (rewrite all urls to /index.html)? No
? Set up automatic builds and deploys with GitHub? Yes
? For which GitHub repository would you like to set up a GitHub workflow?
(format: user/repository) michinobumaeda/black-bream
? Set up the workflow to run a build script before every deploy? Yes
? What script should be run before every deploy? npm ci && npm run build
? Set up automatic deployment to your site's live channel when a PR is merged?
Yes
? What is the name of the GitHub branch associated with your site's live channel?
 main
? What file should be used for Storage Rules? storage.rules
? Which Firebase emulators do you want to set up?
 Authentication Emulator,
 Functions Emulator,
 Firestore Emulator,
 Storage Emulator,
 Cloud Tasks Emulator
? Which port do you want to use for the auth emulator? 9099
? Which port do you want to use for the functions emulator? 5001
? Which port do you want to use for the firestore emulator? 8080
? Which port do you want to use for the storage emulator? 9199
? Which port do you want to use for the tasks emulator? 9499
? Would you like to enable the Emulator UI? Yes
? Which port do you want to use for the Emulator UI (leave empty to use any
available port)? 4040
? Would you like to download the emulators now? Yes

$ rm -rf public
```

Modify `functions/package.json`

```json
  "engines": {
    "node": "18"
  },
```

```bash
npm --prefix functions install

$ gh secret list
NAME                                  UPDATED
FIREBASE_SERVICE_ACCOUNT_BLACK_BREAM  about 15 minutes ago
```
