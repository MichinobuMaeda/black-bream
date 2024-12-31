export const locales = [
  { value: "ja", label: "日本語" },
  { value: "en", label: "English" },
];

export const messages = (() => {
  const m = { en: {}, ja: {} };

  m.en.appTitle = () => "Black bream";
  m.ja.appTitle = () => "Black bream";
  m.en.send = () => "Send";
  m.ja.send = () => "送信";
  m.en.login = () => "Login";
  m.ja.login = () => "ログイン";
  m.en.logout = () => "Logout";
  m.ja.logout = () => "ログアウト";
  m.en.cancel = () => "Cancel";
  m.ja.cancel = () => "中止";
  m.en.save = () => "Save";
  m.ja.save = () => "保存";
  m.en.goBack = () => "Go back";
  m.ja.goBack = () => "戻る";
  m.en.info = () => "Information";
  m.ja.info = () => "情報";
  m.en.home = () => "Home";
  m.ja.home = () => "ホーム";
  m.en.list = () => "List";
  m.ja.list = () => "一覧";
  m.en.edit = () => "Edit";
  m.ja.edit = () => "編集";
  m.en.create = () => "Create";
  m.ja.create = () => "新規作成";
  m.en.settings = () => "Settings";
  m.ja.settings = () => "設定";
  m.en.users = () => "Users";
  m.ja.users = () => "ユーザー";
  m.en.user = () => "User";
  m.ja.user = () => "ユーザー";
  m.en.members = () => "Members";
  m.ja.members = () => "メンバー";
  m.en.groups = () => "Groups";
  m.ja.groups = () => "グループ";
  m.en.group = () => "Group";
  m.ja.group = () => "グループ";
  m.en.memberOf = () => "Member of";
  m.ja.memberOf = () => "所属";
  m.en.account = () => "Account";
  m.ja.account = () => "アカウント";
  m.en.profile = () => "Profile";
  m.ja.profile = () => "プロフィール";
  m.en.displayName = () => "Display name";
  m.ja.displayName = () => "表示名";
  m.en.admin = () => "System administrator";
  m.ja.admin = () => "システム管理者";
  m.en.manager = () => "Manager";
  m.ja.manager = () => "管理者";
  m.en.siteDesc = () => "Site description";
  m.ja.siteDesc = () => "サイトの説明";
  m.en.current = () => "Current";
  m.ja.current = () => "変更前";
  m.en.unavailable = () => "Unavailable";
  m.ja.unavailable = () => "無効";
  m.en.email = () => "Email";
  m.ja.email = () => "メールアドレス";
  m.en.changeEmail = () => "Change email address";
  m.ja.changeEmail = () => "メールアドレス変更";
  m.en.password = () => "Password";
  m.ja.password = () => "パスワード";
  m.en.loginWithoutPassword = () => "Login without a password";
  m.ja.loginWithoutPassword = () => "パスワードを使わずにログイン";
  m.en.loginWithPassword = () => "Login with your email address and password";
  m.ja.loginWithPassword = () => "メールアドレスとパスワードでログイン";
  m.en.setPassword = () => "Set password";
  m.ja.setPassword = () => "パスワード設定";
  m.en.changePassword = () => "Change password";
  m.ja.changePassword = () => "パスワード変更";
  m.en.currentPassword = () => "Current password";
  m.ja.currentPassword = () => "現在のパスワード";
  m.en.newPassword = () => "New password";
  m.ja.newPassword = () => "新しいパスワード";
  m.en.confirmNewPassword = () => "Confirm new password";
  m.ja.confirmNewPassword = () => "パスワードの確認";
  m.en.timeoutMinutes = () => "Timeout minutes";
  m.ja.timeoutMinutes = () => "タイムアウト時間（分）";
  m.en.logoutNow = () => "Logout now";
  m.ja.logoutNow = () => "今すぐログアウトする";

  // Validation
  m.en.errorPasswordStrength = () => "Insufficient strength";
  m.ja.errorPasswordStrength = () => "強度が不十分です";
  m.en.errorPasswordConfirmation = () => "Password does not match";
  m.ja.errorPasswordConfirmation = () => "パスワードが一致しません";
  m.en.length = ({ len }) => `Length: ${len}`;
  m.ja.length = ({ len }) => `${len}文字`;
  m.en.required = () => "Required.";
  m.ja.required = () => "入力必須です。";
  m.en.greaterOrEqual = ({ num }) =>
    `Enter a value greater than or equal to ${num}.`;
  m.ja.greaterOrEqual = ({ num }) => `${num} 以上の値を入力してください。`;
  m.en.validEmailAddress = () => "Enter a valid email address";
  m.ja.validEmailAddress = () => "正しい形式のメールアドレスとしてください";
  m.en.nameInUse = () => "The name is already in use.";
  m.ja.nameInUse = () => "既に使われている名称です。";

  // Guidances
  m.en.updateApp = () => "Please update this app";
  m.ja.updateApp = () => "アプリを更新してください";
  m.en.inMarkdown = () => "Write in Markdown";
  m.ja.inMarkdown = () => "Markdown で記述してください";
  m.en.aboutLicense = ({ license }) =>
    `This app is distributed under the ${license} license.`;
  m.ja.aboutLicense = ({ license }) =>
    `このアプリは ${license} ライセンスに基づいて配布されます。`;
  m.en.passwordRequirements = () =>
    "Please make your password at least 8 characters long" +
    " and contain lowercase and uppercase letters, numbers, and symbols.";
  m.ja.passwordRequirements = () =>
    "パスワードは 8 文字以上で、小文字、大文字、数字、記号を使用してください。";
  m.en.guideChangingEmail = () =>
    "Please ask your administrator to change the email address for login.";
  m.ja.guideChangingEmail = () =>
    "ログイン用のメールアドレスの変更は管理者に依頼してください。";
  m.en.descPasswordLink = () =>
    "If this is your first time setting up a password or" +
    " if you have forgotten your password," +
    " we will send you an email with a link to set your password.";
  m.ja.descPasswordLink = () =>
    "はじめてパスワードを設定する場合、または、パスワードを忘れた場合、" +
    "パスワードを設定するリンクを掲載したメールを送信します。";
  m.en.guideOfWatchdogTimeout = () =>
    "Enter the time in minutes before automatically logging off" +
    " after the screen loses focus." +
    " If you do not want to use this feature, enter 0.";
  m.ja.guideOfWatchdogTimeout = () =>
    "画面がフォーカスを失った後、自動でログオフするまでの時間を" +
    "分単位で入力してください。" +
    "この機能を使用しない場合は、0 を入力してください。";
  m.en.allowEmailsFrom = ({ email }) =>
    `Please allow us to receive emails from ${email}`;
  m.ja.allowEmailsFrom = ({ email }) =>
    `${email} からのメールを受信できるようにしておいてください。`;

  // Success responses
  m.en.savedData = () => "The data has been saved.";
  m.ja.savedData = () => "データを保存しました。";
  m.en.sentEmailLink = () =>
    "An email with a login link has been sent to the address you provided.";
  m.ja.sentEmailLink = () =>
    "ログイン用のリンクを記載したメールを指定されたアドレスに送信しました。";
  m.en.sentPasswordLink = () =>
    "An email with a link to set your password" +
    " has been sent to your login email address.";
  m.ja.sentPasswordLink = () =>
    "パスワード設定用のリンクを記載したメールをログイン用のメールアドレスに送信しました。";

  // Error responses
  m.en.passwordAuthError = () => "Invalid user ID or password";
  m.ja.passwordAuthError = () => "ユーザーIDまたはパスワードが正しくありません";
  m.en.pageNotFound = () => "Page Not Found";
  m.ja.pageNotFound = () => "見つかりません";
  m.en.NavigationForPageNotFound = () =>
    "We're sorry, but the page you were looking for doesn't exist." +
    " It might have been removed, had its name changed," +
    " or is temporarily unavailable.";
  m.ja.NavigationForPageNotFound = () =>
    "申し訳ございませんが、お探しの項目は存在しません。" +
    "削除されたか、名前が変更されたか、一時的に利用できない状態になっている可能性があります。";
  m.en.tryAgain = () => "Change the settings and try again";
  m.ja.tryAgain = () => "設定を変更してやり直してください";

  // System errors
  m.en.onSystemError = () =>
    " Check your connection and try again. If the operation does not work," +
    " contact your system administrator.";
  m.ja.onSystemError = () =>
    "通信状態を確認してやり直してもうまくいかない場合は、" +
    "システム管理者に連絡してください。";
  m.en.authError = () =>
    "An error occurred during authentication." + m.en.onSystemError();
  m.ja.authError = () =>
    "認証の処理中にエラーが発生しました。" + m.ja.onSystemError();
  m.en.errorOnDataSave = () =>
    "An error occurred while saving data." + m.en.onSystemError();
  m.ja.errorOnDataSend = () =>
    "送信中にエラーが発生しました。" + m.ja.onSystemError();
  m.en.errorOnDataSend = () =>
    "An error occurred while sending data." + m.en.onSystemError();
  m.ja.errorOnDataSave = () =>
    "データの保存中にエラーが発生しました。" + m.ja.onSystemError();

  return m;
})();
