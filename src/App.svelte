<script module>
  import { CallbackHandler } from "./lib/callback.js";
  import { store } from "./lib/store.svelte.js";
  import { fb } from "./lib/firebase.js";

  new CallbackHandler(window.location).handle();
  fb.initFirebase(window.location, store);
</script>

<script>
  import { localstorage } from "./lib/localstorage.js";
  import { saveLocale } from "./lib/store.svelte.js";
  import Layout from "./layout/layout.svelte";
  import Routes from "./routes.svelte";

  // On auth state changed
  $effect(() => {
    if (store.conf?.id && store.authUser?.uid) {
      fb.subscribeUserDataAll();
    }
  });

  // On locale changed
  $effect(() => {
    if (store.locale !== localstorage.locale.load()) {
      saveLocale();
      fb.setAuthLocale();
    }
  });
</script>

<Layout>
  <Routes />
</Layout>
