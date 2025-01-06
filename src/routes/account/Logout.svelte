<script>
  import { pop } from "svelte-spa-router";
  import Content from "../../lib/Content.svelte";
  import Wrap from "../../lib/Wrap.svelte";
  import Fields from "../../lib/Fields.svelte";
  import TextFieldOutlined from "../../lib/components/TextFieldOutlined.svelte";
  import ActionSave from "../../lib/ActionSave.svelte";
  import Switch from "../../lib/components/Switch.svelte";
  import ButtonFilled from "../../lib/components/ButtonFilled.svelte";
  import SvgLogout from "../../lib/icons/SvgLogout.svelte";
  import {
    getWatchdogTimeout,
    setWatchdogTimeout,
  } from "../../lib/watchdog.svelte.js";
  import { logout } from "../../lib/repository.svelte.js";
  import { m } from "../../lib/i18n.svelte.js";

  let changed = $state(getWatchdogTimeout());
  let logoutNow = $state(false);

  const onCancel = () => {
    changed = getWatchdogTimeout();
  };

  const onSave = () => {
    setWatchdogTimeout(changed);
  };
</script>

<h3>{m.logout()}</h3>
<Content>
  <div>{m.guideOfWatchdogTimeout()}</div>
  <Wrap>
    <Fields>
      <TextFieldOutlined
        id="displayName"
        label={m.timeoutMinutes()}
        type="number"
        bind:value={changed}
        message={m.current(getWatchdogTimeout())}
        error={changed < 0 ? m.greaterOrEqual(0) : ""}
      />
    </Fields>
    <Fields>
      <ActionSave
        id="updateProfile"
        changed={changed !== getWatchdogTimeout()}
        valid={0 <= changed}
        {onCancel}
        {onSave}
        cancelOnlyChanged
      />
    </Fields>
    <Fields>
      <div class="flex flex-wrap gap-4 items-center">
        <span class="flex grow gap-4 items-center">
          <Switch id="logoutNow" bind:checked={logoutNow} />
          {m.logoutNow()}
        </span>
        <ButtonFilled
          id="logout"
          icon={SvgLogout}
          label={m.logout()}
          onClick={() => logout(pop)}
          disabled={!logoutNow}
          danger
        />
      </div>
    </Fields>
  </Wrap>
</Content>
