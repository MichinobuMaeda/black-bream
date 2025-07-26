<script>
  import { link, push } from "svelte-spa-router";
  import Content from "../../lib/components/Content.svelte";
  import Fields from "../../lib/components/Fields.svelte";
  import SvgAdd from "../../lib/icons/SvgAdd.svelte";
  import SvgTextSnippet from "../../lib/icons/SvgTextSnippet.svelte";
  import SvgNoteAdd from "../../lib/icons/SvgNoteAdd.svelte";
  import ButtonOutlined from "../../lib/coarse-paper/ButtonOutlined.svelte";
  import IconButton from "../../lib/coarse-paper/IconButton.svelte";
  import { t, store } from "../../lib/store.svelte.js";

  let templates = $derived(
    store.templates.filter((template) => store.manager || !template.deletedAt),
  );
</script>

<h3>
  <span class="flex grow">{t().list()}</span>
  {#if store.operator || store.manager}
    <ButtonOutlined
      id="create"
      icon={SvgAdd}
      label={t().create()}
      onClick={() => push("/templates/new")}
      dense
    />
  {/if}
</h3>
<Content>
  {#each templates as template (template.id)}
    <Fields>
      <div class="flex flex-row">
        <a class="flex flex-row gap-1" href="/templates/{template.id}" use:link>
          <span class="size-6"><SvgTextSnippet /></span>
          {template.name}
        </a>
        {#if !template.deletedAt}
          <div class="flex flex-row grow justify-end">
            <IconButton
              id={`post-${template.id}`}
              icon={SvgNoteAdd}
              onClick={() => push(`/templates/${template.id}/post`)}
            />
          </div>
        {/if}
      </div>
    </Fields>
    <p class="whitespace-pre-wrap">
      {template.title || template.message
        ? `${template.title}\n${template.message}`
        : template.text}
    </p>
  {/each}
</Content>
