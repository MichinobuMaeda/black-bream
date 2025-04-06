<script>
  import { link } from "svelte-spa-router";
  import TargetIcon from "./TargetIcon.svelte";
  import StatusIcon from "./StatusIcon.svelte";
  import { formatLongDateTime } from "../datetime.js";
  import { postTargets } from "../firebase.js";
  import { store, dow } from "../store.svelte.js";

  /**
   * @typedef {Object} Props
   * @property {object} post
   */

  /** @type {Props} */
  let { post } = $props();

  let targets = postTargets.filter((target) =>
    (store.conf.postTargets ?? []).includes(target),
  );
</script>

<div class="flex flex-col lg:flex-row gap-0.5 lg:gap-4">
  <div class="flex flex-row gap-2">
    <a class="flex flex-row gap-1 font-mono" href="/posts/{post.id}" use:link>
      <span class="size-6"><StatusIcon status={post.status} /></span>
      {formatLongDateTime(post.scheduledFor?.toDate(), dow())}
    </a>
    <span class="flex flex-row gap-1">
      {#each targets as target (target)}
        {#if Object.keys(post.targets ?? {}).includes(target)}
          {#if post.targets[target].status === "failed"}
            <span class="size-5 text-light-error dark:text-dark-error">
              <TargetIcon {target} />
            </span>
          {:else}
            <span class="size-5 text-light-primary dark:text-dark-primary">
              <TargetIcon {target} />
            </span>
          {/if}
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
