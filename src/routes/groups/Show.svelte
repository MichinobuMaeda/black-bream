<script>
  import { link, push } from "svelte-spa-router";
  import IconButtonOutlined from "../../lib/components/IconButtonOutlined.svelte";
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

<h4>{m().members()}</h4>
<Content>
  {#each store.users.filter( (user) => (group.users ?? []).includes(user.id), ) as user}
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
