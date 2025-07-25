<script>
  import { link, push } from "svelte-spa-router";
  import Content from "../../lib/components/Content.svelte";
  import Fields from "../../lib/components/Fields.svelte";
  import SvgAdd from "../../lib/icons/SvgAdd.svelte";
  import SvgCognition from "../../lib/icons/SvgCognition.svelte";
  import SvgNoteAdd from "../../lib/icons/SvgNoteAdd.svelte";
  import ButtonOutlined from "../../lib/coarse-paper/ButtonOutlined.svelte";
  import IconButton from "../../lib/coarse-paper/IconButton.svelte";
  import { t, store } from "../../lib/store.svelte.js";

  let generators = $derived(
    store.generators.filter(
      (generator) => store.manager || !generator.deletedAt,
    ),
  );
</script>

<h3>
  <span class="flex grow">{t().list()}</span>
  {#if store.operator || store.manager}
    <ButtonOutlined
      id="create"
      icon={SvgAdd}
      label={t().create()}
      onClick={() => push("/generators/new")}
      dense
    />
  {/if}
</h3>
<Content>
  {#each generators as generator (generator.id)}
    <Fields>
      <div class="flex flex-row">
        <a
          class="flex flex-row gap-1"
          href="/generators/{generator.id}"
          use:link
        >
          <span class="size-6"><SvgCognition /></span>
          {generator.name}
        </a>
        <div class="flex flex-row grow justify-end">
          <IconButton
            id={`post-${generator.id}`}
            icon={SvgNoteAdd}
            onClick={() => push(`/generators/${generator.id}/post`)}
          />
        </div>
      </div>
    </Fields>
  {/each}
</Content>
