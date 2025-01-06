<script>
  import { link, push } from "svelte-spa-router";
  import Content from "../../lib/Content.svelte";
  import ButtonOutlined from "../../lib/components/ButtonOutlined.svelte";
  import SvgGroupAdd from "../../lib/icons/SvgGroupAdd.svelte";
  import SvgGroup from "../../lib/icons/SvgGroup.svelte";
  import SvgBlock from "../../lib/icons/SvgBlock.svelte";
  import { m } from "../../lib/i18n.svelte.js";
  import { store } from "../../lib/store.svelte.js";

  let groups = $derived(
    store.groups.filter((group) => store.manager || !group.deletedAt),
  );
</script>

<h3>
  <span class="flex grow">{m.list()}</span>
  {#if store.manager}
    <ButtonOutlined
      id="create"
      icon={SvgGroupAdd}
      label={m.create()}
      onClick={() => push("/groups/new")}
      dense
    />
  {/if}
</h3>
<Content>
  {#each groups as group}
    <a class="flex flex-row gap-1" href="/groups/{group.id}" use:link>
      <span class="size-6">
        {#if group.deletedAt}
          <SvgBlock />
        {:else}
          <SvgGroup />
        {/if}
      </span>
      {group.name}
    </a>
  {/each}
</Content>
