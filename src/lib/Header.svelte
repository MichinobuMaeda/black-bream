<script>
  import appLogo from "/favicon.svg";
  import {
    APP_NAME,
    PAGE_OVERVIEW,
    PAGE_SETTINGS,
    PAGE_LOGIN,
    PAGE_INFO,
  } from "./const.svelte";
  import ButtonText from "./ButtonText.svelte";
  import IconButton from "./IconButton.svelte";
  import SvgOverview from "./SvgOverview.svelte";
  import SvgSettings from "./SvgSettings.svelte";
  import SvgLogin from "./SvgLogin.svelte";
  import SvgInfo from "./SvgInfo.svelte";

  /**
   * @typedef {Object} Props
   * @property {boolean} [top]
   * @property {string} user
   * @property {string} page
   * @property {function} onClick
   */

  /** @type {Props} */
  let { top, user, page, onClick } = $props();

  const items =
    user === null
      ? [
          { id: PAGE_LOGIN, icon: SvgLogin, label: "ログイン" },
          { id: PAGE_INFO, icon: SvgInfo, label: "情報" },
        ]
      : [
          { id: PAGE_OVERVIEW, icon: SvgOverview, label: "概要" },
          { id: PAGE_SETTINGS, icon: SvgSettings, label: "設定" },
          { id: PAGE_INFO, icon: SvgInfo, label: "情報" },
        ];

  if (items.map((item) => item.id).indexOf(page) < 0) {
    onClick(items[0].id);
  }
</script>

{#if top}
  <header
    class="flex flex-row sticky top-0 h-9 invisible sm:visible
      bg-lightPrimaryContainer dark:bg-darkPrimaryContainer
      text-lightOnPrimaryContainer dark:text-darkOnPrimaryContainer"
  >
    <div class="flex flex-auto">
      <img
        src={appLogo}
        alt={APP_NAME}
        class="size-10 relative top-0.5 ml-0.5"
      />
    </div>
    <div class="flex flex-row gap-2 px-2 py-0.5">
      {#each items as item}
        <div
          class={page === item.id
            ? "py-1 border-b-2 border-lightPrimary dark:border-darkPrimary"
            : "py-1"}
        >
          <ButtonText
            id={item.id}
            icon={item.icon}
            label={item.label}
            onClick={() => (page === item.id ? null : onClick(item.id))}
          />
        </div>
      {/each}
    </div>
  </header>
{:else}
  <header
    class="flex flex-row sticky bottom-0 h-9 visible sm:invisible
      bg-lightPrimaryContainer dark:bg-darkPrimaryContainer
      text-lightOnPrimaryContainer dark:text-darkOnPrimaryContainer"
  >
    <div class="flex flex-auto">
      <img
        src={appLogo}
        alt={APP_NAME}
        class="size-10 relative bottom-0.5 ml-0.5"
      />
    </div>
    <div class="flex flex-row gap-1 px-2 py-0.5">
      {#each items as item}
        <div
          class={page === item.id
            ? "py-1 border-t-2 border-lightPrimary dark:border-darkPrimary"
            : "py-1"}
        >
          <IconButton
            id={item.id}
            icon={item.icon}
            onClick={() => (page === item.id ? null : onClick(item.id))}
          />
        </div>
      {/each}
    </div>
  </header>
{/if}
