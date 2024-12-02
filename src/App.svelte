<script module>
  import { initStore } from "./lib/store.svelte";

  initStore();
</script>

<script>
  import { activateI18n } from "./lib/i18n.svelte";
  import { activateStore } from "./lib/store.svelte";
  import Router from "svelte-spa-router";
  import PWABadge from "./lib/PWABadge.svelte";
  import { getStore } from "./lib/store.svelte";
  import Header from "./lib/Header.svelte";
  import Loading from "./lib/Loading.svelte";
  import Login from "./routes/Login.svelte";
  import Home from "./routes/Home.svelte";
  import Info from "./routes/Info.svelte";
  import Account from "./routes/Account.svelte";
  import Settings from "./routes/Settings.svelte";
  import NotFound from "./routes/NotFound.svelte";

  activateI18n();
  activateStore();
  let store = getStore();
</script>

<PWABadge />
<div
  class="flex flex-col-reverse sm:flex-row
    bg-lightSurfaceDim dark:bg-darkSurfaceDim"
>
  <Header />
  <div
    class="min-h-screen w-full lg:w-[1048px]
    bg-lightBackground dark:bg-darkBackground
    text-lightOnBackground dark:text-darkOnBackground"
  >
    <main class="flex flex-col mb-auto">
      {#if store.loading}
        <Loading />
      {:else}
        <Router
          routes={{
            "/": store.authUser ? Home : Login,
            "/account": store.authUser ? Account : Login,
            "/settings": store.authUser ? Settings : Login,
            "/info": Info,
            "*": NotFound,
          }}
        />
      {/if}
    </main>
  </div>
</div>
