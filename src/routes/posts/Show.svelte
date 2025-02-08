<script>
  import { push } from "svelte-spa-router";
  import IconButtonOutlined from "../../lib/coarse-paper/IconButtonOutlined.svelte";
  import SvgEdit from "../../lib/icons/SvgEdit.svelte";
  import StatusIcon from "../../lib/components/StatusIcon.svelte";
  import Content from "../../lib/components/Content.svelte";
  import Fields from "../../lib/components/Fields.svelte";
  import TextFieldOutlined from "../../lib/coarse-paper/TextFieldOutlined.svelte";
  import TargetIcon from "../../lib/components/TargetIcon.svelte";
  import { store } from "../../lib/store.svelte.js";
  import { formatDateTime } from "../../lib/datetime";
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

  let targets = postTargets.filter((target) =>
    (store.conf.postTargets ?? []).includes(target),
  );
</script>

{#if post}
  <h3>
    <span class="flex grow gap-2">
      <span class="size-7"><StatusIcon status={post?.status} /></span>
      {formatDateTime(post.scheduledFor?.toDate())}
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
    <Fields>
      <div class="flex flex-wrap gap-3">
        {#each targets as target}
          <span class="flex gap-1">
            <span class="size-6 text-lightPrimary dark:text-darkPrimary">
              <TargetIcon {target} />
            </span>
            <span
              class="size-6 text-lightOnBackground dark:text-darkOnBackground"
            >
              <StatusIcon status={post.targets[target].status} />
            </span>
          </span>
        {/each}
      </div>
      <TextFieldOutlined
        id="text"
        label="Text"
        lines={4}
        value={post.text}
        readonly
      />
      {#await savedImageUrl}
        <div>Loading...</div>
      {:then url}
        {#if url}
          <img id="image-saved" class="w-96" alt="selected" src={url} />
        {/if}
      {/await}
    </Fields>
  </Content>
{/if}
