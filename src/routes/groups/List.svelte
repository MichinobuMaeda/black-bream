<script>
  import { link } from "svelte-spa-router";
  import SvgGroup from "../../lib/icons/SvgGroup.svelte";
  import Content from "../../lib/Content.svelte";
  import SvgGroupAdd from "../../lib/icons/SvgGroupAdd.svelte";
  import { m } from "../../lib/i18n.svelte";
  import { store } from "../../lib/store.svelte";
</script>

<h3>{m().list()}</h3>
<Content>
  {#if store.manager}
    <a
      class="flex flex-row gap-1 justify-end
    text-lightPrimary dark:text-darkPrimary"
      href="/groups/new"
      use:link
    >
      <span class="size-6"><SvgGroupAdd /></span>
      {m().create()}
    </a>
  {/if}
  {#each store.groups as group}
    <a
      class="flex flex-row gap-1
      text-lightLink dark:text-darkLink underline"
      href="/groups/{group.id}"
      use:link
    >
      <span class="size-6"><SvgGroup /></span>
      {group.name}
    </a>
  {/each}
</Content>
