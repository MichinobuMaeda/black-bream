<script>
  import Router from "svelte-spa-router";

  import Login from "./routes/login/page.svelte";
  import Home from "./routes/home/page.svelte";
  import Info from "./routes/info/page.svelte";
  import Account from "./routes/account/page.svelte";
  import Groups from "./routes/groups/page.svelte";
  import Users from "./routes/users/page.svelte";
  import Settings from "./routes/settings/page.svelte";
  import NotFound from "./routes/NotFound.svelte";
  import { store } from "./lib/store.svelte.js";
</script>

{#if store.admin || store.manager}
  <Router
    routes={{
      "/": Home,
      "/account": Account,
      "/groups/:item?/:action?": Groups,
      "/users/:item?/:action?": Users,
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
      "/groups/:item?": Groups,
      "/users/:item?": Users,
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
