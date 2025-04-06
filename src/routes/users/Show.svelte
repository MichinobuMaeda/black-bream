<script>
  import { link, push } from "svelte-spa-router";
  import IconButtonOutlined from "../../lib/coarse-paper/IconButtonOutlined.svelte";
  import SvgEdit from "../../lib/icons/SvgEdit.svelte";
  import SvgGroup from "../../lib/icons/SvgGroup.svelte";
  import SvgBlock from "../../lib/icons/SvgBlock.svelte";
  import Content from "../../lib/components/Content.svelte";
  import { t, store, groupsOfUser } from "../../lib/store.svelte.js";

  /**
   * @typedef {Object} Props
   * @param {string} item
   */

  /** @type {Props} */
  let { item } = $props();

  let user = $derived(store.users.find((user) => user.id === item));
  let groups = $derived(groupsOfUser(user.id));
</script>

<h3>
  <span class="flex grow">{user.name}</span>
  {#if store.manager}
    <IconButtonOutlined
      id="edit"
      icon={SvgEdit}
      onClick={() => push(`/users/${user.id}/edit`)}
      dense
    />
  {/if}
</h3>
<h4>{t().memberOf()}</h4>
<Content>
  {#each groups as group (group.id)}
    <a class="flex flex-row gap-1" href="/groups/{group.id}" use:link>
      <span class="size-6">
        {#if group.deletedAt}
          <SvgBlock />
        {:else}
          <SvgGroup />
        {/if}
      </span>
      {group.name}
    </a>
  {/each}
</Content>
