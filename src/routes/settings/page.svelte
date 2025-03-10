<script>
  import SvgSettings from "../../lib/icons/SvgSettings.svelte";
  import Templates from "./Templates.svelte";
  import PreDefinedSchedules from "./PreDefinedSchedules.svelte";
  import SiteDescription from "./SiteDescription.svelte";
  import LoginMethods from "./LoginMethods.svelte";
  import AuthTwitter from "./AuthTwitter.svelte";
  import AuthMastodon from "./AuthMastodon.svelte";
  import AuthTumblr from "./AuthTumblr.svelte";
  import AuthMisskey from "./AuthMisskey.svelte";
  import AuthBluesky from "./AuthBluesky.svelte";
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
  <AuthTwitter />
  <AuthMastodon />
  <AuthMisskey />
  <AuthTumblr />
  <AuthBluesky />
  <AuthThreads />
  <AuthInstagram />
  <LoginMethods />
{/if}
