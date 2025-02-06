<script>
  import Content from "../../lib/components/Content.svelte";
  import PostSummary from "../../lib/components/PostSummary.svelte";
  import { t, store } from "../../lib/store.svelte.js";

  let posts = $derived(
    store.posts.filter((post) => post.status === "completed").slice(0, 4),
  );
</script>

<h3>{t().recentPosts()}</h3>
<Content>
  {#each posts as post}
    <PostSummary {post} />
  {/each}
</Content>
