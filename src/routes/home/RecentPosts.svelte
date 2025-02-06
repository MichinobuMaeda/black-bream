<script>
  import { link } from "svelte-spa-router";
  import TargetIcon from "../../lib/components/TargetIcon.svelte";
  import Content from "../../lib/components/Content.svelte";
  import StatusIcon from "../../lib/components/StatusIcon.svelte";
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
          <span class="size-6"><StatusIcon status={post.status} /></span>
          {formatDateTime(post.scheduledFor?.toDate())}
        </a>
        {#each Object.keys(post.targets ?? {}) as target}
          <span class="size-5 text-lightPrimary dark:text-darkPrimary">
            <TargetIcon {target} />
          </span>
        {/each}
      </div>
      {post.text?.substr(0, 20)}
    </div>
  {/each}
</Content>
