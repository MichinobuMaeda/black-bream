<script>
  import { link } from "svelte-spa-router";
  import Content from "../../lib/Content.svelte";
  import SvgTask from "../../lib/icons/SvgTask.svelte";
  import { t, store } from "../../lib/store.svelte.js";
  import { formatDateTime } from "../../lib/i18n";

  let posts = $derived(
    store.posts.filter((post) => post.status === "completed").slice(0, 4),
  );
</script>

<h3>{t().recentPosts()}</h3>
<Content>
  {#each posts as post}
    <div class="flex flex-col lg:flex-row gap-0.5 lg:gap-2">
      <div class="flex flex-row gap-2">
        <a class="flex flex-row gap-1" href="/posts/{post.id}" use:link>
          <span class="size-6">
            <SvgTask />
          </span>
          {formatDateTime(post.scheduledFor?.toDate())}
        </a>
        <span class="text-lightPrimary dark:text-darkPrimary"
          >{Object.keys(post.targets ?? {}).join(", ")}</span
        >
      </div>
      {post.text?.substr(0, 20)}
    </div>
  {/each}
</Content>
