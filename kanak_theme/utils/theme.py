import frappe
import os


def get_active_theme(user=None):
    """Return theme doc for user → system → default"""
    if not user:
        user = frappe.session.user

    user_theme = frappe.db.get_value("User", user, "theme")
    if user_theme:
        if frappe.db.exists("Themes", user_theme):
            return frappe.get_doc("Themes", user_theme)
    system_theme = frappe.db.get_single_value("System Settings", "theme")
    if system_theme:
        if frappe.db.exists("Themes", system_theme):
            return frappe.get_doc("Themes", system_theme)
    return None
