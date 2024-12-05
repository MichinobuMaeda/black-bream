<script>
  import active from "svelte-spa-router/active";

  import { m } from "./i18n.svelte";
  import { getStore } from "./store.svelte.js";
  import SvgHome from "./icons/SvgHome.svelte";
  import SvgLogin from "./icons/SvgLogin.svelte";
  import SvgInfo from "./icons/SvgInfo.svelte";

  let store = getStore();
</script>

{#snippet navItem(Icon, label, path)}
  <a
    class="hidden xl:flex flex-row text-lg rounded-full h-10 p-2 w-[224px] gap-2
        justify-center xl:justify-start align-start xl:items-center
        text-lightOnSecondaryContainer dark:text-darkOnSecondaryContainer
        bg-lightSecondaryContainer dark:bg-darkSecondaryContainer"
    href={`/#${path}`}
    use:active={{ path: path, className: "activeMainMenuItem" }}
  >
    <span class="flex h-6 w-6"><Icon /></span>
    {label}
  </a>
  <a class="xl:hidden flex flex-col text-sm items-center" href={`/#${path}`}>
    <span
      class="flex h-8 w-14 p-1 rounded-full
        text-lightOnSecondaryContainer dark:text-darkOnSecondaryContainer
        bg-lightSecondaryContainer dark:bg-darkSecondaryContainer"
      use:active={{ path: path, className: "activeMainMenuItem" }}
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
    <img src="/favicon.svg" alt={m().appTitle()} class="size-10" />
    <span class="hidden xl:flex p-1 text-xl">{m().appTitle()}</span>
  </div>
  {#if !store.loading}
    {#if store.authUser === null}
      {@render navItem(SvgLogin, m().login(), "/")}
    {:else}
      {@render navItem(SvgHome, m().home(), "/")}
    {/if}
  {/if}
  {@render navItem(SvgInfo, m().info(), "/info")}
</header>
