<script>
  import { link, push } from "svelte-spa-router";
  import Content from "../../lib/Content.svelte";
  import ButtonOutlined from "../../lib/components/ButtonOutlined.svelte";
  import SvgNoteAdd from "../../lib/icons/SvgNoteAdd.svelte";
  import SvgTask from "../../lib/icons/SvgTask.svelte";
  import SvgScheduledTask from "../../lib/icons/SvgScheduledTask.svelte";
  import SvgScanDelete from "../../lib/icons/SvgScanDelete.svelte";
  import { t, store } from "../../lib/store.svelte.js";
  import { formatDateTime } from "../../lib/i18n";

  let posts = $derived(
    store.posts.filter((post) => store.manager || !post.deletedAt),
  );
</script>

<h3>
  <span class="flex grow">{t().list()}</span>
  {#if store.operator}
    <ButtonOutlined
      id="create"
      icon={SvgNoteAdd}
      label={t().create()}
      onClick={() => push("/posts/new")}
      dense
    />
  {/if}
</h3>
<Content>
  {#each posts as post}
    <div class="flex flex-row gap-2">
      <a class="flex flex-row gap-1" href="/posts/{post.id}" use:link>
        <span class="size-6">
          {#if post.deletedAt}
            <SvgScanDelete />
          {:else if post.status === "completed"}
            <SvgTask />
          {:else}
            <SvgScheduledTask />
          {/if}
        </span>
        {formatDateTime(post.scheduledFor?.toDate())}
      </a>
      {post.text?.substr(0, 20)}
    </div>
  {/each}
</Content>
