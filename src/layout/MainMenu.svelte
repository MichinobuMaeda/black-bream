<script>
  import { location, push } from "svelte-spa-router";
  import { t, store } from "../lib/store.svelte.js";
  import SvgHome from "../lib/icons/SvgHome.svelte";
  import SvgLogin from "../lib/icons/SvgLogin.svelte";
  import SvgGroup from "../lib/icons/SvgGroup.svelte";
  import SvgPerson from "../lib/icons/SvgPerson.svelte";
  import SvgTask from "../lib/icons/SvgTask.svelte";

  const linkColor = (location, path) =>
    location === path
      ? " bg-light-primary-container dark:bg-dark-primary-container" +
        " text-light-on-primary-container dark:text-dark-on-primary-container"
      : " bg-light-secondary-container dark:bg-dark-secondary-container" +
        " text-light-on-secondary-container dark:text-dark-on-secondary-container";

  const menuItemOnClick = (path) => {
    push(path);
    store.menu = false;
  };
</script>

{#snippet navItem(
  /** @type {Object} */ Icon,
  /** @type {string} */ label,
  /** @type {string} */ path,
)}
  <button
    class={"flex sm:hidden xl:flex flex-row text-lg h-10 px-4 w-[224px] gap-2" +
      " justify-start items-center rounded-full" +
      linkColor($location, path)}
    onclick={() => menuItemOnClick(path)}
  >
    <span class="flex size-6"><Icon /></span>
    {label}
  </button>
  <button
    class="hidden sm:flex xl:hidden flex-col items-center"
    onclick={() => menuItemOnClick(path)}
  >
    <div
      class={"flex h-8 w-14 justify-center items-center rounded-full" +
        linkColor($location, path)}
    >
      <span class="size-6"><Icon /></span>
    </div>
    <div class="text-sm text-lightOnSurface dark:text-darkOnSurface">
      {label}
    </div>
  </button>
{/snippet}

<div
  class="flex flex-col gap-4 xl:gap-4 px-2 py-4 z-50
    items-start sm:items-center xl:items-start
    bg-light-surface-container-low dark:bg-dark-surface-container-low
    text-light-on-surface dark:text-dark-on-surface"
>
  {#if store.me}
    {@render navItem(SvgHome, t().home(), "/")}
    {#if store.operator || store.manager}
      {@render navItem(SvgTask, t().posts(), "/posts")}
    {/if}
    {@render navItem(SvgGroup, t().groups(), "/groups")}
    {@render navItem(SvgPerson, t().users(), "/users")}
  {:else}
    {@render navItem(SvgLogin, t().login(), "/")}
  {/if}
</div>
