<script>
  import Content from "../../lib/components/Content.svelte";
  import PostSummary from "../../lib/components/PostSummary.svelte";
  import { t, store } from "../../lib/store.svelte.js";

  let posts = $derived(
    store.posts
      .filter((post) =>
        Object.values(post.targets ?? {}).some(
          (value) => value.status === "completed",
        ),
      )
      .slice(0, 8),
  );
</script>

<h3>{t().recentPosts()}</h3>
<Content>
  {#each posts as post (post.id)}
    <PostSummary {post} />
  {/each}
</Content>
