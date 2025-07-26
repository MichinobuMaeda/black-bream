<script>
  import { location, push, pop, replace } from "svelte-spa-router";
  import IconButton from "../lib/coarse-paper/IconButton.svelte";
  import SvgArrowBackIosNew from "../lib/icons/SvgArrowBackIosNew.svelte";
  import SvgLanguage from "../lib/icons/SvgLanguage.svelte";
  import SvgSettings from "../lib/icons/SvgSettings.svelte";
  import SvgAccountCircle from "../lib/icons/SvgAccountCircle.svelte";
  import SvgInfo from "../lib/icons/SvgInfo.svelte";
  import SvgClose from "../lib/icons/SvgClose.svelte";
  import SvgMenu from "../lib/icons/SvgMenu.svelte";
  import { locales } from "../i18n.js";
  import { t, store } from "../lib/store.svelte.js";

  const switchLanguage = () => {
    let index = locales.findIndex((l) => l.value === store.locale);
    index = (index + 1) % locales.length;
    store.locale = locales[index].value;
  };

  let timeoutId = null;

  $effect(() => {
    if (store.menu) {
      timeoutId = setTimeout(() => {
        store.menu = false;
      }, 3 * 1000);
    } else if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  });
</script>

{#snippet navItem(/** @type {Object} */ Icon, /** @type {string} */ path)}
  <IconButton
    id={`nav-${path}`}
    icon={Icon}
    onClick={() => push(path)}
    disabled={$location === path}
  />
{/snippet}

<div
  class="flex flex-row h-12 sm:h-10 items-start sm:items-center
    bg-light-surface-container-high dark:bg-dark-surface-container-high
    text-light-on-surface-variant dark:text-dark-on-surface-variant"
>
  <div class="flex flex-row gap-6 px-2 py-1 justify-start items-center grow">
    <div class="flex flex-row grow gap-2 justify-start items-center">
      {#if $location === "/"}
        <button onclick={() => pop()}
          ><img
            src="/favicon.svg"
            alt={t().appTitle()}
            class="size-6"
          /></button
        >
      {:else if history.length > 2}
        <button class="size-6" onclick={() => pop()}
          ><SvgArrowBackIosNew /></button
        >
      {:else}
        <button class="size-6" onclick={() => replace("/")}
          ><SvgArrowBackIosNew /></button
        >
      {/if}
      <span class="hidden sm:flex text-base">{t().appTitle()}</span>
    </div>
    <IconButton id="language" icon={SvgLanguage} onClick={switchLanguage} />
    {#if store.me}
      {#if store.admin || store.manager}
        {@render navItem(SvgSettings, "/settings")}
      {/if}
      {@render navItem(SvgAccountCircle, "/account")}
    {/if}
    {@render navItem(SvgInfo, "/info")}
  </div>
  {#if store.menu}
    <div
      class="flex sm:hidden justify-center items-center px-2 py-1
        bg-light-surface-container-low dark:bg-dark-surface-container-low
          text-light-on-surface dark:text-dark-on-surface"
    >
      <IconButton
        id="menu-close"
        icon={SvgClose}
        onClick={() => (store.menu = false)}
        disabled={!store.me}
      />
    </div>
  {:else}
    <div class="flex sm:hidden justify-center items-center px-2 py-1">
      <IconButton
        id="menu-open"
        icon={SvgMenu}
        onClick={() => (store.menu = true)}
        disabled={!store.me}
      />
    </div>
  {/if}
</div>
