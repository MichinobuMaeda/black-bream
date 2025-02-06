<script>
  import { link, push } from "svelte-spa-router";
  import TargetIcon from "../../lib/components/TargetIcon.svelte";
  import Content from "../../lib/components/Content.svelte";
  import SvgNoteAdd from "../../lib/icons/SvgNoteAdd.svelte";
  import ButtonOutlined from "../../lib/coarse-paper/ButtonOutlined.svelte";
  import StatusIcon from "../../lib/components/StatusIcon.svelte";
  import { t, store } from "../../lib/store.svelte.js";
  import { formatDateTime } from "../../lib/i18n.js";
  import { postTargets } from "../../lib/firebase.js";

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
        <a
          class="flex flex-row gap-1 font-mono"
          href="/posts/{post.id}"
          use:link
        >
          <span class="size-6"><StatusIcon status={post.status} /></span>
          {formatDateTime(post.scheduledFor?.toDate())}
        </a>
        {#each postTargets.filter( (target) => Object.keys(post.targets ?? {}).includes(target), ) as target}
          <span class="size-5 text-lightPrimary dark:text-darkPrimary">
            <TargetIcon {target} />
          </span>
        {/each}
      </div>
      <div>{post.text?.substr(0, 40)}</div>
    </div>
  {/each}
</Content>
