<script module>
  import { CallbackHandler } from "./lib/callback.js";
  import { store } from "./lib/store.svelte.js";
  import { fbs } from "./lib/firebase.js";

  new CallbackHandler(window.location).handle();
  fbs.initFirebase(window.location, store);
</script>

<script>
  import { localstorage } from "./lib/localstorage.js";
  import { saveLocale } from "./lib/store.svelte.js";
  import Layout from "./layout/layout.svelte";
  import Routes from "./routes.svelte";

  // On auth state changed
  $effect(() => {
    if (store.conf?.id && store.authUser?.uid) {
      fbs.subscribeUserDataAll();
    }
  });

  $effect(() => {
    store.me =
      store.authUser && store.users.length && store.groups.length
        ? store.users.find(
            (user) =>
              user.id === store.authUser.uid &&
              !user.restrictedAt &&
              !user.deletedAt,
          )
        : undefined;
  });

  // On locale changed
  $effect(() => {
    if (store.locale !== localstorage.locale.load()) {
      saveLocale();
      fbs.setAuthLocale();
    }
  });
</script>

<Layout>
  <Routes />
</Layout>
