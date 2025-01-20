<script>
  import { push } from "svelte-spa-router";
  import IconButtonOutlined from "../../lib/components/IconButtonOutlined.svelte";
  import SvgEdit from "../../lib/icons/SvgEdit.svelte";
  import Content from "../../lib/Content.svelte";
  import Wrap from "../../lib/Wrap.svelte";
  import Fields from "../../lib/Fields.svelte";
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

{#if post}
  <h3>
    <span class="flex grow">
      {formatDateTime(post.scheduledFor?.toDate())}
      {post?.status}
    </span>
    {#if store.operator && post.status !== "completed"}
      <IconButtonOutlined
        id="edit"
        icon={SvgEdit}
        onClick={() => push(`/posts/${post.id}/edit`)}
        dense
      />
    {/if}
  </h3>
  <Content>
    <Wrap>
      <div class="flex flex-col gap-0.5 max-w-[440px] break-words">
        {#each post.text.split("\n") as line}
          <div>{line}</div>
        {/each}
      </div>
      <Fields>
        {#each Object.keys(post.targets ?? {}) as target}
          <div class="flex flex-row gap-4">
            <span class="text-lightPrimary dark:text-darkPrimary">
              {target}
            </span>
            {post.targets[target].status}
          </div>
        {/each}
      </Fields>
    </Wrap>
  </Content>
{/if}
