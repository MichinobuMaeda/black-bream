# Add site

## Firebase project

https://console.firebase.google.com

- Create a project: <Site ID>
    - Configure Google Analytics
        - account: <Site ID>
        - location: Japan
        - [v] Use the default settings for sharing Google Analytics data
- Project settings
    - General
        - Project name: Grey bream
        - Environment type: Production
        - Your apps: </> (Web)
        - App nickname: Grey bream
- Usage and billing
    - Details & settings
        - Firebase billing plan: Blaze plan
- Authentication
    - Sign-in providers
        - Email/Password: Enable
            - Email link (passwordless sign-in): Enable
        - Google: Enable
            - Public-facing name for project: Grey bream
            - Support email for project: \*\*\*\*
    - Settings
        - User account linking
            - [v] Link accounts that use the same email
        - User actions
            - [ ] Enable create (sign-up)
            - [ ] Enable delete
            - [v] Email enumeration protection (recommended)
        - Blocking functions
            - Upgrade to Firebase Auth with Identity Platform to access this feature.
        - User activity logging
            - [v] Enable user activity logging
        - Password policy
            - [v] Require enforcement
            - [v] Require uppercase character
            - [v] Require lowercase character
            - [v] Require special character
            - [v] Require numeric character
            - Password length requirements: 8
- Firestore Database
    - Database ID: (default)
    - Location: asia-northeast2 (Osaka)
    - [v] Start in production mode
    - Start collection
        - Collection ID: service
        - Document ID: dataVersion
        - Field: email
        - Type: string
        - Value: \*\*\*\*
- Storage
    - Location: ASIA-NORTHEAST2
    - Access frequency: Standard
    - [v] Start in production mode

https://console.cloud.google.com/

- Cloud Tasks API
    - Enable
- Cloud Billing API
    - Enable
- Cloud Scheduler API
    - Enable
- reCAPTCHA
    - reCAPTCHA Enterprise API
        - Enable
    - Create key
        - Display name: Grey bream
        - platform type: Website
    - Domain list
        - <Site ID>.web.app
        - <Site ID>.firebaseapp.com

https://console.firebase.google.com

- App Check
    - Apps
        - Grey bream
            - reCAPTCHA Enterprise
                - Site key: \*\*\*\*

```bash
$ npx firebase use <Site ID>

$ npx firebase init

? Which Firebase features do you want to set up for this directory?
Press Space to select features, then Enter to confirm your choices.
Firestore: Configure security rules and indexes files for Firestore,
Functions: Configure a Cloud Functions directory and its files,
Hosting: Configure files for Firebase Hosting and
 (optionally) set up GitHub Action deploys,
Storage: Configure a security rules file for Cloud Storage,
Emulators: Set up local emulators for Firebase products

=== Project Setup

i  Using project <Site ID> (Grey bream)

=== Firestore Setup

? What file should be used for Firestore Rules? firestore.rules
? File firestore.rules already exists. Do you want to overwrite it
 with the Firestore Rules from the Firebase Console? No
? What file should be used for Firestore indexes?
 firestore.indexes.json
? File firestore.indexes.json already exists. Do you want to
 overwrite it with the Firestore Indexes from the Firebase Console? No

=== Functions Setup

? Would you like to initialize a new codebase, or overwrite an
 existing one? Overwrite
? What language would you like to use to write Cloud Functions?
 JavaScript
? Do you want to use ESLint to catch probable bugs and enforce style?
 No
? File functions/package.json already exists. Overwrite? No
? File functions/index.js already exists. Overwrite? No
? File functions/.gitignore already exists. Overwrite? No
? Do you want to install dependencies with npm now? No

=== Hosting Setup

? What do you want to use as your public directory? dist
? Configure as a single-page app (rewrite all urls to /index.html)?
 No
? Set up automatic builds and deploys with GitHub? Yes
? File dist/index.html already exists. Overwrite? No
? For which GitHub repository would you like to set up a GitHub
 workflow? (format: user/repository) MichinobuMaeda/black-bream
? Set up the workflow to run a build script before every deploy? Yes
? What script should be run before every deploy? npm ci && npm run build
? GitHub workflow file for PR previews exists. Overwrite?
 firebase-hosting-pull-request.yml No
? Set up automatic deployment to your site's live channel when a PR
 is merged? Yes
? What is the name of the GitHub branch associated with your site's
 live channel? <Site ID>

=== Storage Setup

? What file should be used for Storage Rules? storage.rules

=== Emulators Setup

? Which Firebase emulators do you want to set up? Press Space to
 select emulators, then Enter to confirm your choices. Authentication
  Emulator, Functions Emulator, Firestore Emulator, Hosting Emulator,
   Storage Emulator, Cloud Tasks Emulator
? Would you like to download the emulators now? Yes
```

## GitHub Settings

- Secrets and variables
    - Actions
        - `FIREBASE_API_KEY_GREY_BREAM`
        - `FIREBASE_RECAPTCHA_KEY_GREY_BREAM`

## Add workflow

## Add files

```text
+---.github
    +---sites
        +---<Site ID>
            |   .firebaserc
            |   theme.js
            +---functions
            |       .env
            +---src
            |       firebaseConfig.js
            +---public
                    favicon.svg
```

```bash
$ cp -r .github/sites/<Site ID>/* ./
```

Edit files `.github/workflows/on-merge-*.yml`

## Service account

firebase-adminsdk-\*@<Site ID>.iam.gserviceaccount.com

- Add roles
    - Cloud Tasks Admin

github-action-\*@<Site ID>.iam.gserviceaccount.com

- Add roles
    - Editor
    - Service Account User
- Change roles
    - Cloud Functions Developer to Cloud Function Admin

```bash
$ npx firebase deploy --only functions

- Error Failed to create function ...

$ npx firebase deploy --only functions

✔  Deploy complete!
```

... What's wrong?

## Clean up

```bash
$ cp -r .github/sites/black-bream/* ./
$ npx firebase use black-bream
```
