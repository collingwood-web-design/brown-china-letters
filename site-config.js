/**
 * Brown China Letters — runtime config for GitHub Pages.
 * Override locally: ?apiBase=http://127.0.0.1:8000&assets=/Original_Letters/
 */
(function (global) {
  "use strict";

  global.SiteConfig = {
    apiBase: "https://brown-china-fastapi-production.up.railway.app",
    assetBaseUrl: "https://cwd-cdn.com/",
  };
})(typeof window !== "undefined" ? window : this);
