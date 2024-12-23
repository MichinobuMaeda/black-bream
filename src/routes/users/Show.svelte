<script>
  import { link, push } from "svelte-spa-router";
  import IconButtonOutlined from "../../lib/components/IconButtonOutlined.svelte";
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

<h4>{m().memberOf()}</h4>
<Content>
  {#each store.groups.filter( (group) => (group.users ?? []).includes(user.id), ) as group}
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
