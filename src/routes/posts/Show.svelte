<script>
  import { push } from "svelte-spa-router";
  import IconButtonOutlined from "../../lib/coarse-paper/IconButtonOutlined.svelte";
  import SvgEdit from "../../lib/icons/SvgEdit.svelte";
  import StatusIcon from "../../lib/components/StatusIcon.svelte";
  import SvgDelete from "../../lib/icons/SvgDelete.svelte";
  import Content from "../../lib/components/Content.svelte";
  import Wrap from "../../lib/components/Wrap.svelte";
  import Fields from "../../lib/components/Fields.svelte";
  import TargetIcon from "../../lib/components/TargetIcon.svelte";
  import { store, dt } from "../../lib/store.svelte.js";
  import { getSavedImageUrl, postTargets } from "../../lib/firebase.js";

  /**
   * @typedef {Object} Props
   * @param {string} item
   */

  /** @type {Props} */
  let { item } = $props();
  let post = $derived(store.posts.find((post) => post.id === item));
  let savedImages = $derived(post.files ?? []);
  let savedImageUrl = $derived(
    savedImages?.length ? getSavedImageUrl(post.id, savedImages[0]) : null,
  );

  const getLines = (post) =>
    (post.title || post.message
      ? [post.title, post.message, post.link].filter((item) => item).join("\n")
      : post.text
    ).split("\n");

  let targets = postTargets.filter((target) =>
    (store.conf.postTargets ?? []).includes(target),
  );
</script>

{#if post}
  <h3>
    <span class="flex grow gap-2">
      <span class="size-7">
        {#if post.deletedAt}
          <SvgDelete />
        {:else}
          <StatusIcon status={post.status} />
        {/if}
      </span>
      {dt(post.scheduledFor).formatDateTime()}
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
      <Fields>
        <div class="whitespace-pre-line">{getLines(post).join("\n")}</div>
        {#await savedImageUrl}
          <div>Loading...</div>
        {:then url}
          {#if url}
            <img id="image-saved" class="w-96" alt="selected" src={url} />
          {/if}
        {:catch}
          <div>Error loading image</div>
        {/await}
      </Fields>
      {#if store.admin}
        <div class="flex flex-col gap-0.5">
          {#each targets as target (target)}
            {#if post.targets[target]}
              <div class="flex flex-row gap-1">
                <span class="size-6 text-light-primary dark:text-dark-primary">
                  <TargetIcon {target} />
                </span>
                <code>{post.targets[target].status || "--"}</code>
              </div>
              {#if post.targets[target].err}
                <pre class="text-light-error dark:text-dark-error">{post
                    .targets[target].err}</pre>
              {/if}
            {/if}
          {/each}
        </div>
      {/if}
    </Wrap>
  </Content>
{/if}
