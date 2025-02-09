<script>
  import SvgSettings from "../../lib/icons/SvgSettings.svelte";
  import Templates from "./Templates.svelte";
  import PreDefinedSchedules from "./PreDefinedSchedules.svelte";
  import SiteDescription from "./SiteDescription.svelte";
  import LoginMethods from "./LoginMethods.svelte";
  import AuthMastodon from "./AuthMastodon.svelte";
  import AuthBluesky from "./AuthBluesky.svelte";
  import AuthTwitter from "./AuthTwitter.svelte";
  import AuthThreads from "./AuthThreads.svelte";
  import AuthInstagram from "./AuthInstagram.svelte";
  import { t, store } from "../../lib/store.svelte.js";
</script>

<h2><SvgSettings /> {t().settings()}</h2>
{#if store.admin || store.manager}
  <Templates />
  <PreDefinedSchedules />
  <SiteDescription />
{/if}
{#if store.admin}
  <LoginMethods />
  <AuthMastodon />
  <AuthBluesky />
  <AuthTwitter />
  <AuthThreads />
  <AuthInstagram />
{/if}
