<script>
  import { location, push } from "svelte-spa-router";
  import ButtonText from "../lib/coarse-paper/ButtonText.svelte";
  import IconButton from "../lib/coarse-paper/IconButton.svelte";
  import SvgCheck from "../lib/icons/SvgCheck.svelte";
  import SvgSettings from "../lib/icons/SvgSettings.svelte";
  import SvgAccountCircle from "../lib/icons/SvgAccountCircle.svelte";
  import SvgInfo from "../lib/icons/SvgInfo.svelte";
  import { setAuthLocale } from "../lib/firebase";
  import { locales } from "../lib/i18n.js";
  import { saveLocale } from "../lib/localstorage";
  import { store } from "../lib/store.svelte.js";
</script>

{#snippet localeItem(/** @type {string} */ value, /** @type {string} */ label)}
  <ButtonText
    id={`locale-${value}`}
    icon={store.locale === value ? SvgCheck : null}
    {label}
    onClick={() => {
      store.locale = value;
      saveLocale(value);
      setAuthLocale(value);
    }}
    disabled={store.locale === value}
  />
{/snippet}

{#snippet navItem(/** @type {object} */ Icon, /** @type {string} */ path)}
  <IconButton
    id={`nav-${path}`}
    icon={Icon}
    onClick={() => push(path)}
    disabled={$location === path}
  />
{/snippet}

<div
  class="flex flex-row mb-0.5 px-2 sm:px-4 py-1 sm:py-1.5 gap-6 justify-end
    bg-light-surface-container-high dark:bg-dark-surface-container-high
    text-light-on-surface-variant dark:text-dark-on-surface-variant"
>
  <div class="flex gap-2">
    {#each locales as locale (locale.value)}
      {@render localeItem(locale.value, locale.label)}
    {/each}
  </div>
  {#if store.user}
    {#if store.admin || store.manager}
      {@render navItem(SvgSettings, "/settings")}
    {/if}
    {@render navItem(SvgAccountCircle, "/account")}
  {/if}
  {@render navItem(SvgInfo, "/info")}
</div>
