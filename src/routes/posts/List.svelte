<script>
  import { link, push } from "svelte-spa-router";
  import TargetIcon from "../../lib/TargetIcon.svelte";
  import Content from "../../lib/Content.svelte";
  import SvgNoteAdd from "../../lib/icons/SvgNoteAdd.svelte";
  import ButtonOutlined from "../../lib/components/ButtonOutlined.svelte";
  import StatusIcon from "../../lib/StatusIcon.svelte";
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
      <div>{post.text?.substr(0, 40)}</div>
    </div>
  {/each}
</Content>
