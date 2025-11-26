import frappe
import os
import json


def after_install():
    create_system_settings_theme_field()
    import_themes_from_json()
    add_standard_navbar_items()


def import_themes_from_json():
    theme_dir = frappe.get_app_path(
        "kanak_theme", "theme_data"
    )

    for file in os.listdir(theme_dir):
        if not file.endswith(".json"):
            continue

        path = os.path.join(theme_dir, file)

        with open(path, "r") as f:
            data = json.load(f)

        if frappe.db.exists("Themes", data.get("theme_name")):
            continue

        doc = frappe.get_doc(data)
        doc.insert(ignore_permissions=True)
    frappe.db.commit()


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


# def create_default_theme():
#     if not frappe.db.exists("Themes", "Default Theme"):
#         theme = frappe.get_doc({
#             "doctype": "Themes",
#             "theme_name": "Kanak Theme",
#             "primary_color": "#4B7BEC",
#             "secondary_color": "#A6B1E1",
#             "sidebar_background_color": "#FFFFFF",
#             "sidebar_hover_color": "#F1F1F1",
#             "sidebar_font_color": "#333333",
#         })
#         theme.insert(ignore_permissions=True)


# def set_default_theme():
#     existing = frappe.db.get_single_value("System Settings", "theme")
#     if not existing:
#         frappe.db.set_single_value("System Settings", "theme", "Default Theme")
#         frappe.db.commit()


def add_standard_navbar_items():
    navbar_settings = frappe.get_single("Navbar Settings")
    if frappe.db.exists("Navbar Item", {"item_label": "Theme Switcher"}):
        return
    for navbar_item in navbar_settings.settings_dropdown[6:]:
        navbar_item.idx = navbar_item.idx + 1
    navbar_settings.append(
        "settings_dropdown",
        {
            "item_label": "Theme Switcher",
            "item_type": "Action",
            "action": "frappe.ui.toolbar.add_theme_menu_item()",
            "is_standard": 1,
            "idx": 7,
        },
    )

    navbar_settings.save()
