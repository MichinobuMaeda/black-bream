<script>
  import { link, push } from "svelte-spa-router";
  import Content from "../../lib/Content.svelte";
  import ButtonOutlined from "../../lib/components/ButtonOutlined.svelte";
  import SvgPersonAdd from "../../lib/icons/SvgPersonAdd.svelte";
  import SvgPerson from "../../lib/icons/SvgPerson.svelte";
  import SvgBlock from "../../lib/icons/SvgBlock.svelte";
  import { m } from "../../lib/i18n.svelte";
  import { store } from "../../lib/store.svelte";
</script>

<h3>
  <span class="flex grow">{m().list()}</span>
  {#if store.manager}
    <ButtonOutlined
      id="create"
      icon={SvgPersonAdd}
      label={m().create()}
      onClick={() => push("/users/new")}
      dense
    />
  {/if}
</h3>
<Content>
  {#each store.users.filter((user) => store.manager || !user.deletedAt) as user}
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
