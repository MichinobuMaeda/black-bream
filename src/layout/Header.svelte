<script>
  import active from "svelte-spa-router/active";
  import { link } from "svelte-spa-router";

  import SvgCheck from "../lib/icons/SvgCheck.svelte";
  import SvgSettings from "../lib/icons/SvgSettings.svelte";
  import SvgAccountCircle from "../lib/icons/SvgAccountCircle.svelte";
  import SvgInfo from "../lib/icons/SvgInfo.svelte";
  import { locales, getLocale, setLocale } from "../lib/i18n.svelte.js";
  import { store } from "../lib/store.svelte.js";
</script>

{#snippet localeItem(value, label)}
  <button id={`locale-${value}`} type="button" onclick={() => setLocale(value)}>
    <span class="flex flex-row gap-0.5 text-sm items-center">
      {#if getLocale() === value}
        <span class="flex h-4 w-4 opacity-50"><SvgCheck /></span>
        <span class="opacity-50">{label}</span>
      {:else}
        {label}
      {/if}
    </span>
  </button>
{/snippet}

{#snippet navItem(Icon, path)}
  <a
    class="text-base mx-1 text-lightPrimary dark:text-darkPrimary"
    href={path}
    use:link
    use:active={{ path: path, className: "activeHeaderMenuItem" }}
  >
    <span class="flex h-6 w-6"><Icon /></span>
  </a>
{/snippet}

<div
  class="flex flex-row mb-0.5 px-2 sm:px-4 py-0.5 sm:py-1 gap-4 justify-end
    bg-lightSurfaceContainerHigh dark:bg-darkSurfaceContainerHigh
    text-lightOnSurfaceVariant dark:text-darkOnSurfaceVariant"
>
  {#each locales as locale}
    {@render localeItem(locale.value, locale.label)}
  {/each}
  {#if store.user}
    {#if store.admin || store.manager}
      {@render navItem(SvgSettings, "/settings")}
    {/if}
    {@render navItem(SvgAccountCircle, "/account")}
  {/if}
  {@render navItem(SvgInfo, "/info")}
</div>
