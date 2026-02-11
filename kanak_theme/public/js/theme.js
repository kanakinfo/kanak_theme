if (!window.frappe) window.frappe = {};
frappe.provide("frappe.ui.form");
frappe.provide("frappe.views");

window.addEventListener("load", () => {
  setTimeout(() => {
    document.getElementById("kanak_loading_overlay")?.classList.remove("active");
  }, 300);
});