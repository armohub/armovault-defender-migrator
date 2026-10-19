// PROTOTYPE P4. MSAL v5 redirect bridge: hands the authorization response (URL fragment) to the main page over a
// same-origin BroadcastChannel, removes it from the address bar and closes the pop-up. No network access is needed here.
(function () {
  'use strict';
  var msg = document.getElementById('msg');
  if (!window.msalRedirectBridge) { msg.textContent = 'Sign-in helper did not load.'; return; }
  window.msalRedirectBridge.broadcastResponseToMainFrame().catch(function (e) {
    msg.textContent = 'Sign-in response could not be delivered (' + String((e && e.errorCode) || 'error').slice(0, 60) + '). Close this window and try again.';
  });
})();
