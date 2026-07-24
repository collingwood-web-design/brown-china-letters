/**
 * Brown China Letters — runtime config for GitHub Pages.
 * Override locally: ?apiBase=http://127.0.0.1:8000&assets=/Original_Letters/
 *
 * assetBaseUrl     — letter scan PNGs (R2 prefix: pages/)
 * siteAssetBaseUrl — site chrome media (R2 prefix: brownchina/)
 */
(function (global) {
  "use strict";

  global.SiteConfig = {
    apiBase: "https://web-production-7ed4a.up.railway.app",
    assetBaseUrl: "https://cwd-cdn.com/",
    siteAssetBaseUrl: "https://cwd-cdn.com/brownchina/",
    canonicalBase: "https://collingwood-web-design.github.io/brown-china-letters/",
  };
})(typeof window !== "undefined" ? window : this);
