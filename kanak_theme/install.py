import frappe


def after_install():
    create_system_settings_theme_field()
    create_default_theme()
    set_default_theme()


def create_system_settings_theme_field():
    if not frappe.db.exists("Custom Field", "System Settings-theme"):
        custom_field = frappe.get_doc({
            "doctype": "Custom Field",
            "dt": "System Settings",
            "module": "Kanak Theme",
            "description": "Select theme to apply",
            "name": "System Settings-theme",
            "fieldname": "theme",
            "fieldtype": "Link",
            "options": "Themes",
            "label": "Theme",
            "insert_after": "language"
        })
        custom_field.insert(ignore_permissions=True)
        frappe.db.commit()


def create_default_theme():
    if not frappe.db.exists("Themes", "Default Theme"):
        theme = frappe.get_doc({
            "doctype": "Themes",
            "theme_name": "Default Theme",
            "primary_color": "#4B7BEC",
            "secondary_color": "#A6B1E1",
            "sidebar_background_color": "#FFFFFF",
            "sidebar_hover_color": "#F1F1F1",
            "sidebar_font_color": "#333333",
        })
        theme.insert(ignore_permissions=True)


def set_default_theme():
    existing = frappe.db.get_single_value("System Settings", "theme")
    if not existing:
        frappe.db.set_single_value("System Settings", "theme", "Default Theme")
        frappe.db.commit()
