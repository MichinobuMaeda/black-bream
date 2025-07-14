<script>
  import { push } from "svelte-spa-router";
  import Content from "../../lib/components/Content.svelte";
  import SvgNoteAdd from "../../lib/icons/SvgNoteAdd.svelte";
  import ButtonOutlined from "../../lib/coarse-paper/ButtonOutlined.svelte";
  import PostSummary from "../../lib/components/PostSummary.svelte";
  import { t, store } from "../../lib/store.svelte.js";

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
  <div class="flex flex-row justify-between items-center">
    <ButtonOutlined
      id="jobposting"
      icon={SvgNoteAdd}
      label={t().jobPosting()}
      onClick={() => push("/posts/jobposting")}
      dense
    />
  </div>
  {#each posts as post (post.id)}
    <PostSummary {post} />
  {/each}
</Content>
