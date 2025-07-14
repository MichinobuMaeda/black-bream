<script>
  // import { pop } from "svelte-spa-router";
  // import { serverTimestamp, Timestamp } from "firebase/firestore";
  import SvgNoteAdd from "../../lib/icons/SvgNoteAdd.svelte";
  import Content from "../../lib/components/Content.svelte";
  // import Wrap from "../../lib/components/Wrap.svelte";
  // import Fields from "../../lib/components/Fields.svelte";
  import ButtonText from "../../lib/coarse-paper/ButtonText.svelte";
  // import SvgAddPhotoAlternate from "../../lib/icons/SvgAddPhotoAlternate.svelte";
  // import SvgRemoveSelection from "../../lib/icons/SvgRemoveSelection.svelte";
  // import TextFieldOutlined from "../../lib/coarse-paper/TextFieldOutlined.svelte";
  // import IconButton from "../../lib/coarse-paper/IconButton.svelte";
  // import SvgArrowBack from "../../lib/icons/SvgArrowBack.svelte";
  // import SvgArrowForward from "../../lib/icons/SvgArrowForward.svelte";
  // import GroupedCheckBox from "../../lib/coarse-paper/GroupedCheckBox.svelte";
  // import ActionSave from "../../lib/components/ActionSave.svelte";
  import { t, store } from "../../lib/store.svelte.js";
  import {
    generateJobPosting,
    //   createDocument,
    //   savePostedImage,
    //   postTargets,
    //   titleRequiredTargets,
    //   imageRequiredTargets,
  } from "../../lib/firebase.js";
  // let active = $state(false);

  // let templates = $state((store.templates ?? []).filter((t) => !t.deletedAt));
  // let showTemplates = $state(templates.length > 0);
  // const getTemplateSummary = (template) =>
  //   (template.title || template.message
  //     ? `${template.title}\n${template.message}`
  //     : template.text
  //   )
  //     .split("\n")
  //     .join(" / ");

  // Fields
  /** @type {FileList|null} */
  let selectedFiles = $state(null);
  /** @type {string} */
  let text = $state("");

  // let title = $state("");
  // let message = $state("");
  // let link = $state("");
  // let errorTitleMessage = $derived(
  //   title || message ? "" : t().requiredAorB(t().title(), t().message()),
  // );
  // let targetItems = postTargets
  //   .filter((target) => (store.conf.postTargets ?? []).includes(target))
  //   .map((target) => ({
  //     value: target,
  //     label: target,
  //   }));
  // let checkedTargets = $state(targetItems.map((item) => item.value));
  // let errorTargets = $derived(
  //   active ? "" : !checkedTargets.length ? t().required() : "",
  // );
  // let schedule = $state(dt().formatDateTime());
  // let errorSchedule = $derived(active ? "" : !schedule ? t().required() : "");
  // let showPreDefinedSchedule = $derived(
  //   store.conf.preDefinedSchedules?.wd.length > 0 &&
  //     store.conf.preDefinedSchedules?.h.length > 0 &&
  //     store.conf.preDefinedSchedules?.m.length > 0,
  // );

  // Actions
  // let result = $state(null);
  // let changed = $derived(!active);
  // let valid = $derived(!errorTitleMessage && !errorTargets && !errorSchedule);
  // let error = $derived(result?.err ? t().errorOnDataSave() : "");

  // const onCancel = async () => {
  // title = "";
  // message = "";
  // link = "";
  // checkedTargets = [];
  // schedule = dt().formatDateTime();
  // pop();
  // };

  // let selectedImages = $state(null);

  // const onSave = async () => {
  // active = true;
  // const status = "requested";
  // title = title?.trim() ?? "";
  // message = message?.trim() ?? "";
  // link = link?.trim() ?? "";
  // const files =
  //   selectedImages && selectedImages[0]
  //     ? [`1.${selectedImages[0].name.split(".").pop()}`]
  //     : [];
  // const targets = checkedTargets
  //   .filter(
  //     (target) => files.length || !imageRequiredTargets.includes(target),
  //   )
  //   .reduce(
  //     (acc, cur) => ({
  //       ...acc,
  //       [cur]: { status, createdAt: serverTimestamp() },
  //     }),
  //     {},
  //   );
  // const scheduledFor = Timestamp.fromDate(dt(schedule).dt);
  // const data = { title, message, link, files, targets, scheduledFor, status };
  // result = await createDocument("posts", data);
  // if (!result.err && result.data.id && selectedImages && selectedImages[0]) {
  //   result = await savePostedImage(
  //     result.data.id,
  //     selectedImages[0],
  //     document,
  //   );
  // }
  // active = false;
  // if (!result.err) {
  //   await onCancel();
  // }
  // };

  $effect(() => {
    if (selectedFiles) {
      Promise.resolve(
        generateJobPosting((value) => (text = value), selectedFiles[0], 10),
      ).then((result) => {
        const { err, data } = result;
        text = data || err;
      });
    }
  });
</script>

<h3>
  <span class="size-6"><SvgNoteAdd /></span>
  {t().jobPosting()}
</h3>
<Content>
  {#if (store.operator || store.manager) && store.conf?.jobPosting}
    <div class="flex flex-row gap-2">
      <ButtonText
        id="add-image"
        icon={SvgNoteAdd}
        label="Word"
        onClick={() => document.getElementById("add-image-field").click()}
      />
      {selectedFiles ? selectedFiles[0].name : "--"}
      <input
        id="add-image-field"
        type="file"
        accept="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        class="hidden"
        bind:files={selectedFiles}
      />
    </div>
    <pre>
      {text}
    </pre>
  {/if}
</Content>
