/* kanak_theme navbar compat layer
 *
 * Frappe core computes scroll offsets using `$(".navbar").height()` (48px),
 * which ignores the custom navbar's effective footprint:
 *   7px top offset + 48px navbar + 10px margin-bottom = 65px
 * (see kanak_theme/public/scss/theme.scss .theme_header_cl).
 *
 * This caused `frappe.ui.scroll` / `scroll_to_field` / validation scrolling
 * to land fields under the custom navbar, and form-tabs to overlap it.
 *
 * This layer patches ONLY the offset calculation to read the effective
 * navbar height from the `--navbar-height` CSS var (set per-desk-page in
 * theme.scss) and preserves all other original behavior.
 */
(function () {
  "use strict";
  if (window.KanakTheme && window.KanakTheme._scrollPatched) return;
  window.KanakTheme = window.KanakTheme || {};
  window.KanakTheme._scrollPatched = true;

  // Effective navbar footprint = --navbar-height CSS var (65px on desk).
  var effectiveNavbarHeight = function () {
    var v = getComputedStyle(document.body).getPropertyValue("--navbar-height");
    var n = parseInt(v, 10);
    return isNaN(n) ? 65 : n;
  };

  // Patch frappe.ui.scroll (frappe/public/js/frappe/utils/common.js).
  // Original: var header_offset = $(".navbar").height() + $(".page-head").height();
  if (window.frappe && frappe.ui && typeof frappe.ui.scroll === "function") {
    window.KanakTheme._origUiScroll = frappe.ui.scroll;
    frappe.ui.scroll = function (element, animate, additional_offset) {
      var header_offset =
        effectiveNavbarHeight() + ($(".page-head").height() || 0);
      var top =
        $(element).offset().top - header_offset - cint(additional_offset);
      if (animate) {
        $("html, body").animate({ scrollTop: top });
      } else {
        $(window).scrollTop(top);
      }
    };
  }

  // Patch frappe.utils.get_scroll_position (frappe/public/js/frappe/utils/utils.js).
  // Original: header_offset = $(".navbar").height() + $(".page-head:visible").height()
  if (window.frappe && frappe.utils && typeof frappe.utils.get_scroll_position === "function") {
    window.KanakTheme._origGetScrollPosition = frappe.utils.get_scroll_position;
    frappe.utils.get_scroll_position = function (element, additional_offset) {
      var header_offset =
        effectiveNavbarHeight() + ($(".page-head:visible").height() || 0) ||
        effectiveNavbarHeight();
      return $(element).offset().top - header_offset - cint(additional_offset);
    };
  }
})();
