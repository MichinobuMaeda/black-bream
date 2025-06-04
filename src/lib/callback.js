export class CallbackHandler {
  /**
   * @constructor
   * @param {Location} location
   */
  constructor(location) {
    this.location = location;
    this.params = new URLSearchParams(location.search);
  }

  /**
   * Generate error message for invalid item
   *
   * @param {string} item
   * @returns  {string}
   */
  invalidItemError(item) {
    return `CallbackHandler receive invalid item: ${item}`;
  }

  /**
   * Generate error message for invalid action
   *
   * @param {string} item
   * @param {string} action
   * @returns {string}
   */
  invalidActionError(item, action) {
    return `CallbackHandler receive invalid action: ${item}/${action}`;
  }

  /**
   * Generate redirect path
   *
   * @param {string} item
   * @param {string} action
   * @param {string} status
   * @param {string} data
   * @returns {string}
   */
  generateRedirectPath(item, action, status, data) {
    return `/#/auth/${item}/${action}/${status}/${data}`;
  }

  /**
   * Generate redirect path for Threads callback
   *
   * @param {string} item
   * @param {string} action
   * @returns {string}
   */
  onThreadsCallback(item, action) {
    const code = (this.params.get("code") || "").replace(/#_/, "");
    const error = this.params.get("error") || "";
    return code
      ? this.generateRedirectPath(item, action, "ok", code)
      : this.generateRedirectPath(item, action, "ng", error);
  }

  /**
   * Generate redirect path for Tumblr callback
   *
   * @param {string} item
   * @param {string} action
   * @returns {string}
   */
  onTumblrCallback(item, action) {
    const state = this.params.get("state") || "ng";
    const code = this.params.get("code") || "error";
    return this.generateRedirectPath(item, action, state, code);
  }

  /**
   * Generate redirect path for Twitter callback
   *
   * @param {string} item
   * @param {string} action
   * @returns {string}
   */
  onTwitterCallback(item, action) {
    const state = this.params.get("state") || "ng";
    const code = this.params.get("code") || "error";
    return this.generateRedirectPath(item, action, state, code);
  }

  /**
   * Get redirect path
   *
   * @returns {{err: undefined|string, data: string|undefined}}
   */
  getRedirectPath() {
    let err = undefined;
    let data = undefined;

    if (this.location.pathname.startsWith("/auth/")) {
      const [item, action] = this.location.pathname.split("/").slice(2);

      switch (item) {
        case "threads":
          switch (action) {
            case "callback":
              data = this.onThreadsCallback(item, action);
              break;
            default:
              err = this.invalidActionError(item, action);
              break;
          }
          break;
        case "tumblr":
          switch (action) {
            case "callback":
              data = this.onTumblrCallback(item, action);
              break;
            default:
              err = this.invalidActionError(item, action);
              break;
          }
          break;
        case "twitter":
          switch (action) {
            case "callback":
              data = this.onTwitterCallback(item, action);
              break;
            default:
              err = this.invalidActionError(item, action);
              break;
          }
          break;
        default:
          err = this.invalidItemError(item);
          break;
      }
    }

    return { err, data };
  }

  /**
   * Handle callback
   *
   * @returns {void}
   */
  handle() {
    const { err, data } = this.getRedirectPath();
    if (err) {
      console.info(err);
    } else if (data) {
      console.log("Redirecting to:", data);
      this.location.replace(data);
    } else {
      console.info("No redirect path found.");
    }
  }
}
