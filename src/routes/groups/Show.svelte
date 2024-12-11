<script>
  import { link } from "svelte-spa-router";
  import SvgEdit from "../../lib/icons/SvgEdit.svelte";
  import SvgPerson from "../../lib/icons/SvgPerson.svelte";
  import Content from "../../lib/Content.svelte";
  import { store } from "../../lib/store.svelte";
  import { m } from "../../lib/i18n.svelte";

  /**
   * @typedef {Object} Props
   * @param {string} item
   */

  /** @type {Props} */
  let { item } = $props();

  let group = store.groups.find((group) => group.id === item);
</script>

<h3 class="flex flex-row gap-2 h-11 items-center">
  {#if store.manager}
    <a
      class="h-8 w-8 px-1 py-0.5 border-none rounded-full text-base
    bg-lightPrimary dark:bg-darkPrimary
    text-lightOnPrimary dark:text-darkOnPrimary"
      href="/groups/{group.id}/edit"
      use:link><SvgEdit /></a
    >
  {/if}
  {group.name}
</h3>

<h4>{m().members()}</h4>
<Content>
  {#each store.users.filter((user) => group.users.includes(user.id)) as user}
    <a
      class="flex flex-row gap-1
      text-lightLink dark:text-darkLink underline"
      href="/users/{user.id}"
      use:link
    >
      <span class="size-6"><SvgPerson /></span>
      {user.name}
    </a>
  {/each}
</Content>
