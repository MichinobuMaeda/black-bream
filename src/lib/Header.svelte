<script>
  import appLogo from "/favicon.svg";
  import { APP_NAME } from "./const.svelte";

  /**
   * @typedef {Object} Props
   * @property {array} pages
   * @property {string} page
   */

  /** @type {Props} */
  let { pages, page = $bindable() } = $props();
</script>

{#snippet navItem(id, Icon, label, selected)}
  <div class="flex flex-col justify-center">
    <button
      {id}
      type="button"
      class={"flex flex-row text-base rounded-full py-1 px-4 xl:px-2 xl:w-[224px] gap-2 " +
        "justify-center xl:justify-start " +
        (selected
          ? "text-lightOnSecondaryContainer dark:text-darkOnSecondaryContainer " +
            "bg-lightSecondaryContainer dark:bg-darkSecondaryContainer"
          : "text-lightOnSurfaceVariant dark:text-darkOnSurfaceVariant")}
      onclick={() => {
        page = id;
      }}
    >
      <Icon />
      <div class="hidden xl:flex">{label}</div>
    </button>
    <div
      class={"flex flex-row justify-center text-xs xl:hidden " +
        (selected
          ? "text-lightOnSurface dark:text-darkOnSurface"
          : "text-lightOnSurfaceVariant dark:text-darkOnSurfaceVariant")}
    >
      {label}
    </div>
  </div>
{/snippet}

<header
  class="flex flex-row sm:flex-col gap-2 p-2 items-center
    sm:h-screen sticky bottom-8 sm:top-0 xl:w-[240px] xl:items-start
    bg-lightSurfaceContainerLow dark:bg-darkSurfaceContainerLow"
>
  <div class="flex flex-auto sm:flex-grow-0 gap-2">
    <img src={appLogo} alt={APP_NAME} class="size-10" />
    <span class="hidden xl:flex p-1 text-xl">{APP_NAME}</span>
  </div>
  {#each pages as item}
    {@render navItem(item.id, item.icon, item.label, page === item.id)}
  {/each}
</header>
