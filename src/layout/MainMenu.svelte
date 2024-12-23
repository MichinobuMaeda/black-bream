<script>
  import active from "svelte-spa-router/active";
  import { link, location, pop, replace } from "svelte-spa-router";

  import { m } from "../lib/i18n.svelte";
  import { store } from "../lib/store.svelte.js";
  import SvgArrowBackIosNew from "../lib/icons/SvgArrowBackIosNew.svelte";
  import SvgHome from "../lib/icons/SvgHome.svelte";
  import SvgLogin from "../lib/icons/SvgLogin.svelte";
  import SvgGroup from "../lib/icons/SvgGroup.svelte";
  import SvgPerson from "../lib/icons/SvgPerson.svelte";
</script>

{#snippet navItem(
  /** @type {object} */ Icon,
  /** @type {string} */ label,
  /** @type {string} */ path,
  /** @type {string?} */ activePath,
)}
  <a
    class="hidden xl:flex flex-row text-base rounded-full h-10 p-2 w-[224px] gap-2
        justify-center xl:justify-start align-start xl:items-center no-underline
        bg-lightSecondaryContainer dark:bg-darkSecondaryContainer
        text-lightOnSecondaryContainer dark:text-darkOnSecondaryContainer"
    href={path}
    use:link
    use:active={{ path: activePath ?? path, className: "activeMainMenuItem" }}
  >
    <span class="flex h-6 w-6"><Icon /></span>
    {label}
  </a>
  <a
    class="xl:hidden flex flex-col text-sm items-center no-underline
      text-lightOnSecondaryContainer dark:text-darkOnSecondaryContainer"
    href={path}
    use:link
  >
    <span
      class="flex h-8 w-14 p-1 rounded-full
        bg-lightSecondaryContainer dark:bg-darkSecondaryContainer"
      use:active={{ path: activePath ?? path, className: "activeMainMenuItem" }}
      ><Icon /></span
    >
    {label}
  </a>
{/snippet}

<header
  class="flex flex-row sm:flex-col gap-4 xl:gap-4 p-2
    sm:h-screen sticky bottom-0 sm:top-0 items-center xl:items-start
    bg-lightSurfaceContainerLow dark:bg-darkSurfaceContainerLow
    text-lightOnSurface dark:text-darkOnSurface"
>
  <div class="flex flex-auto sm:flex-grow-0 gap-2 xl:items-start items-center">
    {#if $location === "/"}
      <button on:click={() => pop()}
        ><img src="/favicon.svg" alt={m().appTitle()} class="size-10" /></button
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
    <span class="hidden xl:flex p-1 text-xl">{m().appTitle()}</span>
  </div>
  {#if store.user}
    {@render navItem(SvgHome, m().home(), "/")}
    {@render navItem(SvgGroup, m().groups(), "/groups", "/groups|/groups/*")}
    {@render navItem(SvgPerson, m().users(), "/users", "/users|/users/*")}
  {:else}
    {@render navItem(SvgLogin, m().login(), "/")}
  {/if}
</header>
