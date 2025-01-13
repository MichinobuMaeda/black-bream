<script module>
  import { store } from "./lib/store.svelte.js";
  import { loadLocale } from "./lib/localstorage.js";
  import {
    initFirebaseConnections,
    setAuthLocale,
    handleDeepLinks,
    subscribeConf,
    subscribeAuthState,
  } from "./lib/firebase.js";

  store.locale = loadLocale();
  initFirebaseConnections(window.location.href);
  setAuthLocale(store.locale);
  handleDeepLinks(window.location.href, window.location);
  subscribeConf(store);
  subscribeAuthState(store);
</script>

<script>
  import { subscribeUserData, unsubscribeUserData } from "./lib/firebase.js";
  import Layout from "./layout/layout.svelte";
  import Routes from "./routes.svelte";

  $effect(() => {
    if (store.conf?.id && store.authUser?.uid) {
      subscribeUserData(store);
    }
  });

  $effect(() => {
    if (
      store.authUser &&
      store.users.length &&
      store.groups.length &&
      !store.user
    ) {
      console.error("No privileges: ${store.authUser.uid}");
      unsubscribeUserData(store);
    }
  });
</script>

<Layout>
  <Routes />
</Layout>
