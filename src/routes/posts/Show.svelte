<script>
  import { push } from "svelte-spa-router";
  import IconButtonOutlined from "../../lib/components/IconButtonOutlined.svelte";
  import SvgEdit from "../../lib/icons/SvgEdit.svelte";
  import Content from "../../lib/Content.svelte";
  import { store } from "../../lib/store.svelte.js";
  import { formatDateTime } from "../../lib/i18n";

  /**
   * @typedef {Object} Props
   * @param {string} item
   */

  /** @type {Props} */
  let { item } = $props();

  let post = $derived(store.posts.find((post) => post.id === item));
</script>

<h3>
  <span class="flex grow">{formatDateTime(post.scheduledFor?.toDate())}</span>
  {#if store.operator}
    <IconButtonOutlined
      id="edit"
      icon={SvgEdit}
      onClick={() => push(`/posts/${post.id}/edit`)}
      dense
    />
  {/if}
</h3>
<Content>
  <pre>{post.text}</pre>
</Content>
