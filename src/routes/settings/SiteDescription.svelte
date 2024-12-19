<script>
  import Content from "../../lib/Content.svelte";
  import TextFieldOutlined from "../../lib/components/TextFieldOutlined.svelte";
  import ButtonFilled from "../../lib/components/ButtonFilled.svelte";
  import SvgCheck from "../../lib/icons/SvgCheck.svelte";
  import ButtonOutlined from "../../lib/components/ButtonOutlined.svelte";
  import SvgClose from "../../lib/icons/SvgClose.svelte";
  import { m } from "../../lib/i18n.svelte";
  import { store, updateDocument } from "../../lib/store.svelte";

  let desc = $state(store.conf.desc);
  let result = $state(undefined);
</script>

<h3>{m().siteDesc()}</h3>
<Content>
  <div class="flex flex-col">
    <TextFieldOutlined
      id="siteDesc"
      label={m().siteDesc()}
      type="text"
      bind:value={desc}
      lines={10}
      message={result !== null || desc !== store.conf.desc
        ? m().inMarkdown()
        : m().savedData()}
      error={desc ? "" : m().errorRequired()}
    />
    {#if result}
      <div class="flex mt-2 text-lightError dark:text-darkError">
        {m().errorOnDataSave()}
      </div>
    {/if}
  </div>
  <div class="flex flex-row gap-4 lg:gap-6 justify-end">
    <ButtonOutlined
      id="cancelUpdateSiteDesc"
      icon={SvgClose}
      label={m().cancel()}
      onClick={() => {
        desc = store.conf.desc;
      }}
      disabled={desc === store.conf.desc}
    />
    <ButtonFilled
      id="updateSiteDesc"
      icon={SvgCheck}
      label={m().save()}
      onClick={async () => {
        result = await updateDocument("service", "conf", { desc });
      }}
      disabled={!desc || desc === store.conf.desc}
    />
  </div>
</Content>
