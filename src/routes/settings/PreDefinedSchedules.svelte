<script>
  import Content from "../../lib/components/Content.svelte";
  import GroupedCheckBox from "../../lib/coarse-paper/GroupedCheckBox.svelte";
  import ActionSave from "../../lib/components/ActionSave.svelte";
  import ButtonText from "../../lib/coarse-paper/ButtonText.svelte";
  import SvgEdit from "../../lib/icons/SvgEdit.svelte";
  import { t, store } from "../../lib/store.svelte.js";
  import { updateDocument } from "../../lib/firebase.js";

  let active = $state(false);
  let edit = $state(false);

  // Fields
  let wd = $state(store.conf.preDefinedSchedules?.wd ?? []);
  let h = $state(store.conf.preDefinedSchedules?.h ?? []);
  let m = $state(store.conf.preDefinedSchedules?.m ?? []);

  const wdItems = [
    {
      value: 0,
      label: t().sunday(),
    },
    {
      value: 1,
      label: t().monday(),
    },
    {
      value: 2,
      label: t().tuesday(),
    },
    {
      value: 3,
      label: t().wednesday(),
    },
    {
      value: 4,
      label: t().thursday(),
    },
    {
      value: 5,
      label: t().friday(),
    },
    {
      value: 6,
      label: t().saturday(),
    },
  ];
  const hItems = Array.from({ length: 24 }, (_, i) => i).map((i) => ({
    value: i,
    label: i.toString().padStart(2, "0"),
  }));
  const mItems = Array.from({ length: 60 }, (_, i) => i).map((i) => ({
    value: i,
    label: i.toString().padStart(2, "0"),
  }));

  // Actions
  let result = $state(null);
  let changed = $derived(
    !active &&
      (wd.length !== (store.conf.preDefinedSchedules?.wd ?? []).length ||
        wd.some((v) => !store.conf.preDefinedSchedules?.wd?.includes(v)) ||
        h.length !== (store.conf.preDefinedSchedules?.h ?? []).length ||
        h.some((v) => !store.conf.preDefinedSchedules?.h?.includes(v)) ||
        m.length !== (store.conf.preDefinedSchedules?.m ?? []).length ||
        m.some((v) => !store.conf.preDefinedSchedules?.m?.includes(v))),
  );
  let valid = true;
  let error = $derived(result?.err ? t().errorOnDataSave() : "");

  const onCancel = () => {
    wd = store.conf.preDefinedSchedules?.wd ?? [];
    h = store.conf.preDefinedSchedules?.h ?? [];
    m = store.conf.preDefinedSchedules?.m ?? [];
    edit = false;
  };

  const onSave = async () => {
    active = true;
    result = await updateDocument("service", "conf", {
      preDefinedSchedules: { wd, h, m },
    });
    active = false;
    edit = false;
  };
</script>

<h3>{t().preDefinedSchedules()}</h3>
{#if edit}
  <Content>
    <div class="flex flex-row gap-1">
      <div class="flex flex-col w-1/4">
        <h5>{t().dayOfWeek()}</h5>
        <GroupedCheckBox
          id="preDefinedSchedulesWd"
          items={wdItems}
          bind:value={wd}
        />
      </div>
      <div class="flex flex-col w-1/4">
        <h5>{t().hour()}</h5>
        <GroupedCheckBox
          id="preDefinedSchedulesH"
          items={hItems}
          bind:value={h}
        />
      </div>
      <div class="flex flex-col w-1/4">
        <h5>{t().minute()}</h5>
        <GroupedCheckBox
          id="preDefinedSchedulesM"
          items={mItems}
          bind:value={m}
        />
      </div>
    </div>
    <ActionSave
      id="updateBluesky"
      {changed}
      {valid}
      {onCancel}
      {onSave}
      {error}
      wide
    />
  </Content>
{:else}
  <Content>
    <ButtonText
      id="editPreDefinedSchedules"
      icon={SvgEdit}
      label={t().edit()}
      onClick={() => (edit = true)}
    />
    <div class="flex flex-row gap-2">
      <span class="text-lightPrimary dark:text-darkPrimary w-12">
        {t().dayOfWeek()}
      </span>
      <span class="font-mono">
        {wd.map((v) => wdItems.find((i) => i.value === v).label).join(" ")}
      </span>
    </div>
    <div class="flex flex-row gap-2">
      <span class="text-lightPrimary dark:text-darkPrimary w-12">
        {t().hour()}
      </span>
      <span class="font-mono">{h.join(", ")}</span>
    </div>
    <div class="flex flex-row gap-2">
      <span class="text-lightPrimary dark:text-darkPrimary w-12">
        {t().minute()}
      </span>
      <span class="font-mono">{m.join(", ")}</span>
    </div>
  </Content>
{/if}
