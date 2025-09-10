# Note

## Create this project

### Prerequisites

```bash
$ git --version
git version 2.46.2
$ gh --version
gh version 2.57.0 (2024-09-16)
$ node --version
v20.17.0
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
$ npm create @vite-pwa/pwa@latest
✔ Project name: … black-bream
✔ Select a framework: › React
✔ Select a variant: › JavaScript
✔ PWA Name: … Black bream
✔ PWA Short Name: … Black bream
✔ PWA Description: …
✔ Theme color: … #c37d9e
✔ Select a strategy: › injectManifest
✔ Select a behavior: › Prompt for update
✔ Enable periodic SW updates? … no / yes
✔ Show offline ready prompt? … no / yes
✔ Generate PWA Assets Icons on the fly? … no / yes

$ cd black-bream
$ npm install
$ npm i tailwindcss @tailwindcss/vite
$ npm init @eslint/config@latest

✔ What do you want to lint? · javascript
✔ How would you like to use ESLint? · problems
✔ What type of modules does your project use? · esm
✔ Which framework does your project use? · react
✔ Does your project use TypeScript? · No / Yes
✔ Where does your code run? · browser
✔ Would you like to install them now? · No / Yes
✔ Which package manager do you want to use? · npm

$ npm i prop-types
$ npm i -D --save-exact prettier
$ node --eval "fs.writeFileSync('.prettierrc','{}\n')"
$ node --eval "fs.writeFileSync('.prettierignore','# Ignore artifacts:\nbuild\ncoverage\n')"

$ npm i react-i18next i18next
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
    - Authentication
        - Sign-in method
            - Sign-in providers
                - Email/Password: Enable
                - Email link (passwordless sign-in): Disable
                - Google: Enable
                    - Public-facing name for project: Black bream
            - Advanced
                - Identity Platform: Upgrade to enable
        - Settings
            - User account linking
                - (o) Link accounts that use the same email
            - User actions
                - [ ] Enable create (sign-up)
                - [ ] Enable delete
                - [v] Email enumeration protection (recommended)

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
    "node": "22"
  },
```

```bash
npm --prefix functions install

$ gh secret list
NAME                                  UPDATED
FIREBASE_SERVICE_ACCOUNT_BLACK_BREAM  about 15 minutes ago

$ gh secret set FIREBASE_API_KEY_BLACK_BREAM
? Paste your secret: <-- firebaseConfig.apiKey

$ gh secret list
NAME                                  UPDATED
FIREBASE_API_KEY_BLACK_BREAM          less than a minute ago
FIREBASE_SERVICE_ACCOUNT_BLACK_BREAM  about 15 days ago
```

#### Initial deployment

```bash
$ npx firebase deploy
 ... ...
? Cloud Storage for Firebase needs an IAM Role to use cross-service rules.
Grant the new role? Yes

```

Add "Service Account User" and "Editor" to
github-action-\*@black-bream.iam.gserviceaccount.com


