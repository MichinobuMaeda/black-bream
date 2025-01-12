# Test firestore rules

## Run test

```bash
npm run test:firestore
```

## Update test data

Start emulator with data

```bash
npx firebase emulators:start --import test/firestore/data
```

Edit data on the emulator UI

Export data

```bash
npx firebase emulators:export test/firestore/data
```

## Data

- Users
    - `t2uxXT9swc3lRw1dNQjntQ2ViJp8` : admin@example.com / password
    - `Mc5GICdls2i9nn01tbqZCrh0ut6Z` : manager@example.com / password
    - `pkwUgtcgMfqgZSYksZv6UmV3tAIg` : operator@example.com / password
    - `yluXLfKJt8RREHtlVwWSs4NvTJO1` : user01@example.com / password
    - `Mc5GICdls2i9nn01tbqZCrh0ut6Z` : user02@example.com / password
- Groups
    - `admins`
    - `managers`
    - `operators`
    - `FeYujtPSkilhusMAyoAs`
- Posts
    - `UR318jrobGTlOJ8pyE2Y`
