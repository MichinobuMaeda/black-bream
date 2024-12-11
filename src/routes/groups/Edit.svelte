<script>
  import SvgEdit from "../../lib/icons/SvgEdit.svelte";
  import Content from "../../lib/Content.svelte";
  import TextFieldOutlined from "../../lib/components/TextFieldOutlined.svelte";
  import { m } from "../../lib/i18n.svelte";
  import { store } from "../../lib/store.svelte";

  /**
   * @typedef {Object} Props
   * @param {string} item
   */

  /** @type {Props} */
  let { item } = $props();

  let group = store.groups.find((group) => group.id === item);
  let name = $state(group.name);
</script>

<h3 class="flex flex-row gap-2 h-11 items-center">
  <span class="size-6"><SvgEdit /></span>
  {m().edit()}
</h3>
{#if store.manager}
  <Content>
    <TextFieldOutlined id="name" bind:value={name} label={m().displayName()} />
  </Content>
{/if}
