<script>
  import { activateI18n } from "./lib/i18n.svelte";
  import { activateStore } from "./lib/store.svelte";
  import Router from "svelte-spa-router";
  import PWABadge from "./lib/PWABadge.svelte";
  import { getStore } from "./lib/store.svelte";
  import MainMenu from "./lib/MainMenu.svelte";
  import Loading from "./lib/Loading.svelte";
  import Header from "./lib/Header.svelte";
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
  {#if store.loading}
    <Loading />
  {:else}
    <MainMenu />
    <div
      class="min-h-screen w-full lg:w-[1048px]
      bg-lightSurfaceContainerLowest dark:bg-darkSurfaceContainerLowest
      text-lightOnSurface dark:text-darkOnSurface"
    >
      <main class="flex flex-col mb-auto">
        <Header />
        {#if store.authUser}
          <Router
            routes={{
              "/": Home,
              "/account": Account,
              "/settings": Settings,
              "/info": Info,
              "*": NotFound,
            }}
          />
        {:else}
          <Router
            routes={{
              "/info": Info,
              "*": Login,
            }}
          />
        {/if}
      </main>
    </div>
  {/if}
</div>
