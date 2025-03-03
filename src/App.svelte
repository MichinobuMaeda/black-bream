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
    if (store.authUser && store.users.length && store.groups.length) {
      store.user = store.users.find(
        (user) =>
          user.id === store.authUser.uid &&
          !user.deletedAt &&
          !user.restrictedAt,
      );

      if (store.user) {
        store.admin = !!store.groups
          .find((group) => group.id === "admins")
          ?.users.includes(store.user?.id);
        store.manager = !!store.groups
          .find((group) => group.id === "managers")
          ?.users.includes(store.user?.id);
        store.operator = !!store.groups
          .find((group) => group.id === "operators")
          ?.users.includes(store.user?.id);
      } else {
        console.error("No privileges: ${store.authUser.uid}");
        unsubscribeUserData(store);
      }
    } else {
      store.user = undefined;
      store.admin = false;
      store.manager = false;
      store.operator = false;
    }
  });
</script>

<Layout>
  <Routes />
</Layout>
