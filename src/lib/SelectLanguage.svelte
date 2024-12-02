<script>
  import ButtonText from "./components/ButtonText.svelte";
  import { getLang, setLang } from "./i18n.svelte.js";

  const languages = [
    { value: "ja", label: "日本語" },
    { value: "en", label: "English" },
  ];
</script>

<div
  class="flex flex-row px-2 py-0.5 sm:px-4 sm:py-1 gap-2 sm:gap-4text-base justify-end
  bg-lightSurfaceContainerLowest dark:bg-darkSurfaceContainerLowest
  text-lightOnSurface dark:text-darkOnSurface"
>
  {#each languages as lang}
    <ButtonText
      id={`lang-${lang.value}`}
      label={lang.label}
      onClick={() => setLang(lang.value)}
      disabled={getLang() === lang.value}
    />
  {/each}
</div>
