<script>
  import { location, push, pop, replace } from "svelte-spa-router";
  import { t, store } from "../lib/store.svelte.js";
  import SvgArrowBackIosNew from "../lib/icons/SvgArrowBackIosNew.svelte";
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
</script>

{#snippet navItem(
  /** @type {object} */ Icon,
  /** @type {string} */ label,
  /** @type {string} */ path,
)}
  <button
    class={"hidden xl:flex flex-row text-lg h-10 px-4 w-[224px] gap-2" +
      " justify-start items-center rounded-full" +
      linkColor($location, path)}
    on:click={() => push(path)}
  >
    <span class="flex size-6"><Icon /></span>
    {label}
  </button>
  <button
    class="xl:hidden flex flex-col items-center"
    on:click={() => push(path)}
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

<header
  class="flex flex-row sm:flex-col gap-4 xl:gap-4 p-2 z-50
    sm:h-screen sticky bottom-0 sm:top-0 items-center xl:items-start
    bg-light-surface-container-low dark:bg-dark-surface-container-low
    text-light-on-surface dark:text-dark-on-surface"
>
  <div class="flex flex-auto sm:grow-0 gap-2 xl:items-start items-center">
    {#if $location === "/"}
      <button on:click={() => pop()}
        ><img src="/favicon.svg" alt={t().appTitle()} class="size-10" /></button
      >
    {:else if history.length > 2}
      <button class="size-10 p-1.5" on:click={() => pop()}
        ><SvgArrowBackIosNew /></button
      >
    {:else}
      <button class="size-10 p-1.5" on:click={() => replace("/")}
        ><SvgArrowBackIosNew /></button
      >
    {/if}
    <span class="hidden xl:flex p-1 text-xl">{t().appTitle()}</span>
  </div>
  {#if store.user}
    {@render navItem(SvgHome, t().home(), "/")}
    {#if store.operator}
      {@render navItem(SvgTask, t().posts(), "/posts")}
    {/if}
    {@render navItem(SvgGroup, t().groups(), "/groups")}
    {@render navItem(SvgPerson, t().users(), "/users")}
  {:else}
    {@render navItem(SvgLogin, t().login(), "/")}
  {/if}
</header>
