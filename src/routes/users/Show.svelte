<script>
  import { link } from "svelte-spa-router";
  import SvgEdit from "../../lib/icons/SvgEdit.svelte";
  import SvgGroup from "../../lib/icons/SvgGroup.svelte";
  import Content from "../../lib/Content.svelte";
  import { store } from "../../lib/store.svelte";
  import { m } from "../../lib/i18n.svelte";

  /**
   * @typedef {Object} Props
   * @param {string} item
   */

  /** @type {Props} */
  let { item } = $props();

  let user = store.users.find((user) => user.id === item);
</script>

<h3 class="flex flex-row gap-2 h-11 items-center">
  {#if store.manager}
    <a
      class="h-8 w-8 px-1 py-0.5 border-none rounded-full text-base
    bg-lightPrimary dark:bg-darkPrimary
    text-lightOnPrimary dark:text-darkOnPrimary"
      href="/users/{user.id}/edit"
      use:link><SvgEdit /></a
    >
  {/if}
  {user.name}
</h3>

<h4>{m().memberOf()}</h4>
<Content>
  {#each store.groups.filter((group) => group.users.includes(user.id)) as group}
    <a
      class="flex flex-row gap-1
      text-lightLink dark:text-darkLink underline"
      href="/groups/{group.id}"
      use:link
    >
      <span class="size-6"><SvgGroup /></span>
      {group.name}
    </a>
  {/each}
</Content>
