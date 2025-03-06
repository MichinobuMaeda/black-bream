<script>
  import { link, push } from "svelte-spa-router";
  import IconButtonOutlined from "../../lib/coarse-paper/IconButtonOutlined.svelte";
  import SvgEdit from "../../lib/icons/SvgEdit.svelte";
  import SvgPerson from "../../lib/icons/SvgPerson.svelte";
  import SvgBlock from "../../lib/icons/SvgBlock.svelte";
  import Content from "../../lib/components/Content.svelte";
  import { t, store } from "../../lib/store.svelte.js";

  /**
   * @typedef {Object} Props
   * @param {string} item
   */

  /** @type {Props} */
  let { item } = $props();

  let group = $derived(store.groups.find((group) => group.id === item));
  let users = $derived(
    store.users.filter(
      (user) =>
        (store.manager || !user.deletedAt) &&
        (group.users ?? []).includes(user.id),
    ),
  );
</script>

<h3>
  <span class="flex grow">{group.name}</span>
  {#if store.manager}
    <IconButtonOutlined
      id="edit"
      icon={SvgEdit}
      onClick={() => push(`/groups/${group.id}/edit`)}
      dense
    />
  {/if}
</h3>

<h4>{t().members()}</h4>
<Content>
  {#each users as user (user.id)}
    <a class="flex flex-row gap-1" href="/users/{user.id}" use:link>
      <span class="size-6">
        {#if user.deletedAt}
          <SvgBlock />
        {:else}
          <SvgPerson />
        {/if}
      </span>
      {user.name}
    </a>
  {/each}
</Content>
