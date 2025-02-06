<script>
  import { link } from "svelte-spa-router";
  import TargetIcon from "./TargetIcon.svelte";
  import StatusIcon from "./StatusIcon.svelte";
  import { formatDateTime } from "../i18n.js";
  import { postTargets } from "../firebase.js";

  /**
   * @typedef {Object} Props
   * @property {object} post
   */

  /** @type {Props} */
  let { post } = $props();
</script>

<div class="flex flex-col lg:flex-row gap-0.5 lg:gap-4">
  <div class="flex flex-row gap-2">
    <a class="flex flex-row gap-1 font-mono" href="/posts/{post.id}" use:link>
      <span class="size-6"><StatusIcon status={post.status} /></span>
      {formatDateTime(post.scheduledFor?.toDate())}
    </a>
    <span class="flex flex-row gap-1">
      {#each postTargets as target}
        {#if Object.keys(post.targets ?? {}).includes(target)}
          <span class="size-5 text-lightPrimary dark:text-darkPrimary">
            <TargetIcon {target} />
          </span>
        {:else}
          <span class="size-5 opacity-20">
            <TargetIcon {target} />
          </span>
        {/if}
      {/each}
    </span>
  </div>
  <span class="line-clamp-1 text-ellipsis sm:w-96">{post.text}</span>
</div>
