<script>
  import { link } from "svelte-spa-router";
  import Content from "../../lib/Content.svelte";
  import SvgTask from "../../lib/icons/SvgTask.svelte";
  import { t, store } from "../../lib/store.svelte.js";
  import { formatDateTime } from "../../lib/i18n";

  let posts = $derived(
    store.posts.filter((post) => post.completedAt).slice(0, 4),
  );
</script>

<h3>{t().recentPosts()}</h3>
<Content>
  {#each posts as post}
    <a class="flex flex-row gap-1" href="/posts/{post.id}" use:link>
      <span class="size-6">
        <SvgTask />
      </span>
      {formatDateTime(post.scheduledFor?.toDate())}
      {post.text?.substr(0, 20)}
    </a>
  {/each}
</Content>
