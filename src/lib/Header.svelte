<script>
  import active from "svelte-spa-router/active";

  import SvgCheck from "./icons/SvgCheck.svelte";
  import SvgSettings from "./icons/SvgSettings.svelte";
  import SvgAccountCircle from "./icons/SvgAccountCircle.svelte";
  import { getStore } from "./store.svelte.js";
  import { locales, getLocale, setLocale } from "./i18n.svelte.js";

  let store = getStore();
</script>

{#snippet navItem(Icon, path)}
  <div class="flex flex-col justify-center">
    <a
      class="text-base text-lightPrimary dark:text-darkPrimary"
      href={`/#${path}`}
      use:active={{ path: path, className: "activeHeaderMenuItem" }}
    >
      <span class="flex h-6 w-6"><Icon /></span>
    </a>
  </div>
{/snippet}

<div
  class="flex flex-row mb-0.5 px-2 py-0.5 sm:px-4 sm:py-1 gap-2 sm:gap-4 justify-end
  bg-lightSurfaceContainerHigh dark:bg-darkSurfaceContainerHigh
  text-lightOnSurfaceVariant dark:text-darkOnSurfaceVariant"
>
  {#each locales as locale}
    {#if getLocale() === locale.value}
      <button id={`locale-${locale.value}`} type="button">
        <span class="flex flex-row gap-0.5 text-sm opacity-50 items-center">
          <span class="flex h-4 w-4"><SvgCheck /></span>
          {locale.label}
        </span>
      </button>
    {:else}
      <button
        id={`locale-${locale.value}`}
        type="button"
        onclick={() => setLocale(locale.value)}
      >
        <span class="flex flex-row gap-0.5 text-sm">
          {locale.label}
        </span>
      </button>
    {/if}
  {/each}
  {#if store.authUser}
    {@render navItem(SvgSettings, "/settings")}
    {@render navItem(SvgAccountCircle, "/account")}
  {/if}
</div>
