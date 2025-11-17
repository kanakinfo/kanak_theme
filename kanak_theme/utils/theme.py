import frappe
import os


def get_active_theme(user=None):
    """Return theme doc for user → system → default"""
    if not user:
        user = frappe.session.user

    # User-specific theme
    user_theme = frappe.db.get_value("User", user, "theme")
    if user_theme:
        return frappe.get_doc("Themes", user_theme)

    # System settings theme
    system_theme = frappe.db.get_single_value("System Settings", "theme")
    if system_theme:
        return frappe.get_doc("Themes", system_theme)

    # Fallback to first active theme
    theme = frappe.get_all("Themes", filters={}, limit=1)
    if theme:
        return frappe.get_doc("Themes", theme[0].name)

    return None
