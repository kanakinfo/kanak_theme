import frappe
from frappe import _
import os
import json


def after_install():
    extend_limit()
    create_system_settings_theme_field()
    init_marquee_settings()
    import_themes_from_json()
    add_standard_navbar_items()


def init_marquee_settings():
    """Seed the marquee (announcement) fields with their defaults at install time.

    The new columns come out empty, so turning Enable Announcement on later
    used to fail with mandatory errors for Scroll Amount/Behavior/Direction.
    """
    if not frappe.db.exists("DocType", "System Settings"):
        return

    meta = frappe.get_meta("System Settings")
    values = {}
    for df in meta.fields:
        if df.fieldname in MARQUEE_FIELDS and not frappe.db.get_single_value(
            "System Settings", df.fieldname
        ):
            values[df.fieldname] = df.default

    for fieldname, value in values.items():
        frappe.db.set_single_value("System Settings", fieldname, value)


def extend_limit():
    options = "\n" + "\n".join(str(i) for i in range(4, 31))
    frappe.make_property_setter(
        {
            "doctype": "List View Settings",
            "doctype_or_field": "DocField",
            "fieldname": "total_fields",
            "property": "options",
            "value": options,
            "property_type": "Text",
        }
    )


def safe_join_path(base_dir, filename):
    """Join ``filename`` to ``base_dir`` and ensure the result stays inside it.

    Prevents path traversal (e.g. ``../secrets.json``) when reading bundled
    theme files. Raises ``frappe.ValidationError`` for unsafe paths.
    """
    base_abs = os.path.abspath(base_dir)
    target_abs = os.path.abspath(os.path.join(base_abs, os.path.basename(filename)))

    if os.path.commonpath([base_abs, target_abs]) != base_abs:
        frappe.throw(_("Invalid file path: {0}").format(filename))

    return target_abs


def import_themes_from_json():
    theme_dir = frappe.get_app_path(
        "kanak_theme", "theme_data"
    )

    for file in os.listdir(theme_dir):
        if not file.endswith(".json"):
            continue

        path = safe_join_path(theme_dir, file)

        # Path comes from os.listdir() of the app's own theme_data folder and is
        # validated by safe_join_path(); no user input is involved.
        with open(path, "r") as f:  # nosemgrep: frappe-security-file-traversal
            data = json.load(f)

        if frappe.db.exists("Themes", data.get("theme_name")):
            continue

        doc = frappe.get_doc(data)
        doc.insert(ignore_permissions=True)
    # Manual commit is required here: after_install runs inside the app install
    # transaction, and these theme records must persist even if a later install
    # step fails and rolls back.
    frappe.db.commit()  # nosemgrep: frappe-manual-commit


def before_uninstall():
    frappe.db.delete("Property Setter", {"name": "List View Settings-total_fields-options"})
    frappe.db.delete("Custom Field", {"name": "System Settings-theme"})

    remove_theme_switcher_navbar_item()

    frappe.clear_cache()


def remove_theme_switcher_navbar_item():
    # The Theme Switcher row was added as ``is_standard=1``, and Frappe's
    # NavbarSettings.validate() refuses to save a doc that drops any standard
    # item ("Please hide the standard navbar items instead of deleting them").
    # Deleting the child row directly bypasses that validate hook, and leaving
    # it in place would crash every later Navbar Settings save on this site.
    nav_items = frappe.get_all(
        "Navbar Item",
        filters={"parent": "Navbar Settings", "item_label": "Theme Switcher"},
        pluck="name",
    )
    for name in nav_items:
        frappe.db.delete("Navbar Item", name)

    if not frappe.db.exists("Navbar Item", {"parent": "Navbar Settings"}):
        return

    # Re-number the remaining rows so the menu has no gaps.
    for idx, name in enumerate(
        frappe.get_all(
            "Navbar Item",
            filters={"parent": "Navbar Settings", "parentfield": "settings_dropdown"},
            order_by="idx asc",
            pluck="name",
        ),
        start=1,
    ):
        frappe.db.set_value("Navbar Item", name, "idx", idx, update_modified=False)

    frappe.clear_cache(doctype="Navbar Settings")


MARQUEE_FIELDS = ("mq_scrollamount", "mq_behavior", "mq_direction", "mq_scrolldelay", "mq_bgcolor")


def validate(doc, method=None):
    if doc.doctype != "System Settings":
        return

    if doc.enable_announcement:
        # Announcement is on, so the marquee fields are visible and required.
        # Values may be blank on records saved before the fields were filled,
        # so fall back to the field defaults (set at install time) instead of
        # failing the whole save with a mandatory error.
        for df in doc.meta.fields:
            if df.fieldname in MARQUEE_FIELDS and not doc.get(df.fieldname):
                doc.set(df.fieldname, df.default)
    else:
        # The marquee fields are reqd but only apply when enable_announcement is
        # on, so they are empty on most sites. Saving System Settings (e.g. just
        # to set the theme) would fail with a mandatory error; only the client
        # enforces depends_on, not the server.
        for df in doc.meta.fields:
            if df.fieldname.startswith("mq_") and df.reqd:
                doc.set(df.fieldname, df.default)


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
        # Manual commit is required here: System Settings depends on this Custom
        # Field existing, so it must persist independently of the install
        # transaction's outcome.
        frappe.db.commit()  # nosemgrep: frappe-manual-commit


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
