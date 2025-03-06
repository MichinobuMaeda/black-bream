<script>
  import { link, push } from "svelte-spa-router";
  import Content from "../../lib/components/Content.svelte";
  import ButtonOutlined from "../../lib/coarse-paper/ButtonOutlined.svelte";
  import SvgPersonAdd from "../../lib/icons/SvgPersonAdd.svelte";
  import SvgPerson from "../../lib/icons/SvgPerson.svelte";
  import SvgBlock from "../../lib/icons/SvgBlock.svelte";
  import { t, store } from "../../lib/store.svelte.js";

  let users = $derived(
    store.users.filter((user) => store.manager || !user.deletedAt),
  );
</script>

<h3>
  <span class="flex grow">{t().list()}</span>
  {#if store.manager}
    <ButtonOutlined
      id="create"
      icon={SvgPersonAdd}
      label={t().create()}
      onClick={() => push("/users/new")}
      dense
    />
  {/if}
</h3>
<Content>
  {#each users as user (user.id)}
    <a class="flex flex-row gap-1" href="/users/{user.id}" use:link>
      <span class="size-6">
        {#if user.deletedAt}
          <SvgBlock />
        {:else}
          <SvgPerson />
        {/if}
      </span>
      {user.name}
    </a>
  {/each}
</Content>
