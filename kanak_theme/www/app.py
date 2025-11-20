# Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
# License: MIT. See LICENSE
import frappe
from frappe import _
from frappe.www import app
from kanak_theme.utils.theme import get_active_theme


def hex_to_rgba(hex_color, alpha):
    hex_color = hex_color.lstrip('#')
    r = int(hex_color[0:2], 16)
    g = int(hex_color[2:4], 16)
    b = int(hex_color[4:6], 16)
    return f"rgba({r},{g},{b},{alpha})"


def invert_color(hex_color):
    """
    Invert a HEX color (same logic as JS invertColor function)
    Example: #3498db → #cb6734
    """
    hex_color = hex_color.lstrip('#')

    # Extract RGB
    r = 255 - int(hex_color[0:2], 16)
    g = 255 - int(hex_color[2:4], 16)
    b = 255 - int(hex_color[4:6], 16)

    # Convert back to HEX
    return "#{:02x}{:02x}{:02x}".format(r, g, b)


def adjust_color(hex_color, percentage):
    """
    Adjust color brightness.
    +percentage → lighten
    -percentage → darken
    """
    hex_color = hex_color.lstrip('#')
    r = int(hex_color[0:2], 16)
    g = int(hex_color[2:4], 16)
    b = int(hex_color[4:6], 16)

    def clamp(x): return max(0, min(255, x))

    if percentage >= 0:
        # LIGHTEN
        r = clamp(round(r + (255 - r) * (percentage / 100)))
        g = clamp(round(g + (255 - g) * (percentage / 100)))
        b = clamp(round(b + (255 - b) * (percentage / 100)))
    else:
        # DARKEN
        p = abs(percentage)
        r = clamp(round(r * (1 - p / 100)))
        g = clamp(round(g * (1 - p / 100)))
        b = clamp(round(b * (1 - p / 100)))

    return "#{:02x}{:02x}{:02x}".format(r, g, b)

# def lighten_hex(hex_color, percentage):
#     hex_color = hex_color.lstrip('#')
#     r = int(hex_color[0:2], 16)
#     g = int(hex_color[2:4], 16)
#     b = int(hex_color[4:6], 16)

#     r = round(r + (255 - r) * (percentage / 100))
#     g = round(g + (255 - g) * (percentage / 100))
#     b = round(b + (255 - b) * (percentage / 100))

#     return "#{:02x}{:02x}{:02x}".format(r, g, b)


def generate_shadow_color(primary_hex):
    gray_hex = adjust_color(primary_hex, 50)   # convert black → gray (#7C7C7C approx)
    rgba = hex_to_rgba(gray_hex, 0.25)        # add opacity
    return gray_hex, rgba


def apply_theme_menu(theme_doc, allowed_workspaces):
    """
    Apply Theme Menu settings to workspace list.
    theme_doc = Theme doctype (doc)
    allowed_workspaces = list of workspace dicts
    """

    theme_rows = theme_doc.table_mogv or []

    # Convert Theme Menu table → Lookup dictionary
    theme_map = {
        row.menu: {
            "use_image": row.use_image_as_icon,
            "icon": row.icon,
            "image": row.image_icon
        }
        for row in theme_rows
    }

    # Modify allowed workspaces in-place
    for ws in allowed_workspaces:
        ws_name = ws.get("name")
        cfg = theme_map.get(ws_name)

        if not cfg:
            continue

        # (1) Use Image First Priority
        if cfg["use_image"] and cfg["image"]:
            ws["image"] = cfg["image"]
            ws["icon"] = None
            continue

        # (2) Use Icon
        if cfg["icon"]:
            ws["icon"] = cfg["icon"]
            ws["image"] = None
            continue

        # (3) Default → keep original

    return allowed_workspaces


def get_context(context):
    context = app.get_context(context)
    boot = frappe.sessions.get()
    allowed_workspaces = boot.get('allowed_workspaces', [])
    company_name = frappe.defaults.get_user_default("company")
    company_logo = None
    if company_name:
        try:
            company_doc = frappe.get_doc("Company", company_name)
            company_logo = company_doc.company_logo
        except frappe.DoesNotExistError:
            pass
    theme = get_active_theme()
    allowed_workspaces = apply_theme_menu(theme, allowed_workspaces)
    primary_color = theme.as_dict().primary_color
    secondary_color = theme.as_dict().primary_color
    background_color = theme.as_dict().background_color
    default_button_color = theme.as_dict().default_button_color
    shadow_hex, shadow_rgba = generate_shadow_color(primary_color)
    theme_list = {
        "primary": primary_color,
        "btn-primary": primary_color,
        "control-bg": adjust_color(primary_color, 96),
        "gray-500": adjust_color(primary_color, 60),
        "shadow-color-hex": shadow_hex,
        "shadow-color-rgba": shadow_rgba,
        "invert-neutral": primary_color,
        "gray-50": adjust_color(primary_color, 98),
        "gray-100": adjust_color(primary_color, 96),
        "focus-default": adjust_color(primary_color, 96),
        "btn-default-hover-bg": adjust_color(primary_color, 90),
        "tm-dark-color": adjust_color(primary_color, -50),
        "switch-bg": adjust_color(primary_color, 70),
        "bg-background-color": background_color,
        "side_bg_color": theme.as_dict().sidebar_background_color,
        "side_hover_color": theme.as_dict().sidebar_hover_color,
        "side_font_color": theme.as_dict().sidebar_font_color,
        "group_by_background_color": theme.as_dict().group_by_background_color,
        "group_by_font_color": theme.as_dict().group_by_font_color,
        "list_subject_color": theme.as_dict().list_subject_color,
        "font-family-style": theme.as_dict().font_family or 'Inter',
        "secondary_color": theme.as_dict().secondary_color,
        "secondary_font_color": theme.as_dict().secondary_font_color,
        "secondary_color_light": adjust_color(secondary_color, 50),
        "secondary_color_light_70": adjust_color(secondary_color, 70),
        "secondary_color_dark": adjust_color(secondary_color, -50),
        "primary_color_light": adjust_color(primary_color, 50),
        "primary_color_dark": adjust_color(primary_color, -50),
        "default_color": theme.as_dict().default_button_color,
        "default_font_color": theme.as_dict().default_button_font_color,
        "default_color_light_70": adjust_color(default_button_color, 70),
        "default_color_light": adjust_color(default_button_color, 50),
        "default_color_dark": adjust_color(default_button_color, -50),
    }

    context.update({
        'allowed_workspaces': allowed_workspaces,
        "company_name": company_name or _("No Company"),
        "company_logo": company_logo,
        "kanak_theme": theme.as_dict() if theme else {},
        "theme_list": theme_list,
        "list_style": theme.as_dict().list_style,
        "form_style": theme.as_dict().form_style,
        "button_style": theme.as_dict().button_style
    })

    return context
