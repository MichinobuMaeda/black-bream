<script>
  import { pop } from "svelte-spa-router";
  import Content from "../../lib/Content.svelte";
  import Wrap from "../../lib/Wrap.svelte";
  import Fields from "../../lib/Fields.svelte";
  import ActionFields from "../../lib/ActionFields.svelte";
  import TextFieldOutlined from "../../lib/components/TextFieldOutlined.svelte";
  import ActionSave from "../../lib/ActionSave.svelte";
  import Switch from "../../lib/components/Switch.svelte";
  import ButtonFilled from "../../lib/components/ButtonFilled.svelte";
  import SvgLogout from "../../lib/icons/SvgLogout.svelte";
  import {
    getWatchdogTimeout,
    setWatchdogTimeout,
  } from "../../lib/watchdog.svelte.js";
  import { t, store } from "../../lib/store.svelte.js";
  import { logout } from "../../lib/firebase.js";

  let timeout = $state(getWatchdogTimeout());
  let changed = $derived(timeout !== getWatchdogTimeout());
  let logoutNow = $state(false);

  const onCancel = () => {
    timeout = getWatchdogTimeout();
  };

  const onSave = () => {
    timeout = Number(timeout) || 0;
    setWatchdogTimeout(timeout);
  };
</script>

<h3>{t().logout()}</h3>
<Content>
  <div>{t().guideOfWatchdogTimeout()}</div>
  <Wrap>
    <Fields>
      <TextFieldOutlined
        id="displayName"
        label={t().timeoutMinutes()}
        type="number"
        bind:value={timeout}
        message={t().current(getWatchdogTimeout())}
        error={timeout < 0 ? t().greaterOrEqual(0) : ""}
      />
    </Fields>
    <ActionFields>
      <ActionSave
        id="updateProfile"
        {changed}
        valid={0 <= timeout}
        {onCancel}
        {onSave}
        cancelOnlyChanged
      />
    </ActionFields>
    <Fields>
      <div class="flex flex-wrap gap-4 items-center">
        <span class="flex grow gap-4 items-center">
          <Switch id="logoutNow" bind:checked={logoutNow} />
          {t().logoutNow()}
        </span>
        <ButtonFilled
          id="logout"
          icon={SvgLogout}
          label={t().logout()}
          onClick={() => logout(store, pop)}
          disabled={!logoutNow}
          danger
        />
      </div>
    </Fields>
  </Wrap>
</Content>
