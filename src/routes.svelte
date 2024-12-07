<script>
  import Router from "svelte-spa-router";

  import Login from "./routes/login/page.svelte";
  import Home from "./routes/page.svelte";
  import Info from "./routes/info/page.svelte";
  import Account from "./routes/account/page.svelte";
  import Settings from "./routes/settings/page.svelte";
  import NotFound from "./routes/NotFound.svelte";
  import { store } from "./lib/store.svelte.js";
</script>

{#if store.admin || store.manager}
  <Router
    routes={{
      "/": Home,
      "/account": Account,
      "/settings": Settings,
      "/info": Info,
      "*": NotFound,
    }}
  />
{:else if store.user}
  <Router
    routes={{
      "/": Home,
      "/account": Account,
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
