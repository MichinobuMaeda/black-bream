<script>
  import { link } from "svelte-spa-router";
  import SvgPerson from "../../lib/icons/SvgPerson.svelte";
  import Content from "../../lib/Content.svelte";
  import SvgPersonAdd from "../../lib/icons/SvgPersonAdd.svelte";
  import { m } from "../../lib/i18n.svelte";
  import { store } from "../../lib/store.svelte";
</script>

<h3>{m().list()}</h3>
<Content>
  {#if store.manager}
    <a
      class="flex flex-row gap-1 justify-end
    text-lightPrimary dark:text-darkPrimary"
      href="/users/new"
      use:link
    >
      <span class="size-6"><SvgPersonAdd /></span>
      {m().create()}
    </a>
  {/if}
  {#each store.users as user}
    <a
      class="flex flex-row gap-1
      text-lightLink dark:text-darkLink underline"
      href="/users/{user.id}"
      use:link
    >
      <span class="size-6"><SvgPerson /></span>
      {user.name}
    </a>
  {/each}
</Content>
