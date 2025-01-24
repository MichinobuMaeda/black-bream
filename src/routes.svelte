<script>
  import Router from "svelte-spa-router";

  import Login from "./routes/login/page.svelte";
  import Home from "./routes/home/page.svelte";
  import Info from "./routes/info/page.svelte";
  import Account from "./routes/account/page.svelte";
  import Groups from "./routes/groups/page.svelte";
  import Users from "./routes/users/page.svelte";
  import Posts from "./routes/posts/page.svelte";
  import Settings from "./routes/settings/page.svelte";
  import Auth from "./routes/auth/page.svelte";
  import NotFound from "./routes/NotFound.svelte";
  import { store } from "./lib/store.svelte.js";
</script>

{#if store.user}
  {#if store.admin || store.manager}
    <Router
      routes={{
        "/": Home,
        "/account": Account,
        "/groups/:item?/:action?": Groups,
        "/users/:item?/:action?": Users,
        "/posts/:item?/:action?": Posts,
        "/info": Info,
        "/settings": Settings,
        "/auth/:item/:action/:status?/:data?": Auth,
        "*": NotFound,
      }}
    />
  {:else}
    <Router
      routes={{
        "/": Home,
        "/account": Account,
        "/groups/:item?/:action?": Groups,
        "/users/:item?/:action?": Users,
        "/posts/:item?/:action?": Posts,
        "/info": Info,
        "/auth/:item/:action/:status?/:data?": Auth,
        "*": NotFound,
      }}
    />
  {/if}
{:else}
  <Router
    routes={{
      "/info": Info,
      "/auth/:item/:action/:status?/:data?": Auth,
      "*": Login,
    }}
  />
{/if}
