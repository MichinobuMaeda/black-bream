<script>
  import SvgSettings from "../../lib/icons/SvgSettings.svelte";
  import SiteDescription from "./SiteDescription.svelte";
  import LoginMethods from "./LoginMethods.svelte";
  import PreDefinedSchedules from "./PreDefinedSchedules.svelte";
  import AuthMastodon from "./AuthMastodon.svelte";
  import AuthBluesky from "./AuthBluesky.svelte";
  import AuthThreads from "./AuthThreads.svelte";
  import AuthInstagram from "./AuthInstagram.svelte";
  import { t, store } from "../../lib/store.svelte.js";
</script>

<h2><SvgSettings /> {t().settings()}</h2>
{#if store.admin || store.manager}
  <SiteDescription />
  <PreDefinedSchedules />
{/if}
{#if store.admin}
  <LoginMethods />
  <AuthMastodon />
  <AuthBluesky />
  <AuthThreads />
  <AuthInstagram />
{/if}
