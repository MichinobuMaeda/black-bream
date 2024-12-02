<script>
  import active from "svelte-spa-router/active";

  import { m } from "./i18n.svelte";
  import { getStore } from "./store.svelte.js";
  import SvgHome from "./icons/SvgHome.svelte";
  import SvgSettings from "./icons/SvgSettings.svelte";
  import SvgAccountCircle from "./icons/SvgAccountCircle.svelte";
  import SvgLogin from "./icons/SvgLogin.svelte";
  import SvgInfo from "./icons/SvgInfo.svelte";

  let store = getStore();
</script>

{#snippet navItem(Icon, label, path)}
  <div class="flex flex-col justify-center">
    <a
      class="flex flex-row text-base rounded-full py-1 px-4 xl:px-2 xl:w-[224px] gap-2
        justify-center xl:justify-start
        text-lightOnSecondaryContainer dark:text-darkOnSecondaryContainer
        bg-lightSecondaryContainer dark:bg-darkSecondaryContainer"
      href={`/#${path}`}
      use:active={{ path: path, className: "activeMenuItem" }}
    >
      <Icon />
      <div class="hidden xl:flex">{label}</div>
    </a>
  </div>
{/snippet}

<header
  class="flex flex-row sm:flex-col gap-2 p-2 items-center
    sm:h-screen sticky bottom-0 sm:top-0 xl:w-[240px] xl:items-start
    bg-lightSurfaceContainerLow dark:bg-darkSurfaceContainerLow"
>
  <div class="flex flex-auto sm:flex-grow-0 gap-2">
    <img src="/favicon.svg" alt={m().appTitle()} class="size-10" />
    <span class="hidden xl:flex p-1 text-xl">{m().appTitle()}</span>
  </div>
  {#if !store.loading}
    {#if store.authUser === null}
      {@render navItem(SvgLogin, m().login(), "/")}
    {:else}
      {@render navItem(SvgHome, m().home(), "/")}
      {@render navItem(SvgSettings, m().settings(), "/settings")}
      {@render navItem(SvgAccountCircle, m().account(), "/account")}
    {/if}
  {/if}
  {@render navItem(SvgInfo, m().info(), "/info")}
</header>
