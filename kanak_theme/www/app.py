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
    if frappe.db.exists("Themes", theme_doc):
        theme_rows = theme_doc.table_mogv or []

        # Convert Theme Menu table → Lookup dictionary
        if theme_rows:
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
                if cfg["use_image"] and cfg["image"]:
                    ws["image"] = cfg["image"]
                    ws["icon"] = None
                    continue

                # (2) Use Icon
                if cfg["icon"]:
                    ws["icon"] = cfg["icon"]
                    ws["image"] = None
                    continue
    return allowed_workspaces


def get_is_full_screen_menu_or_not(bootinfo):
    theme = get_active_theme()
    if theme:
        bootinfo['is_full_screen_menu'] = theme.as_dict().is_full_screen_menu
        bootinfo['enable_language_switcher'] = theme.as_dict().enable_language_switcher or 0


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
    if theme:
        allowed_workspaces = apply_theme_menu(theme, allowed_workspaces)
        primary_color = theme.as_dict().primary_color or '#000000'
        secondary_color = theme.as_dict().secondary_color or '#F2F2F2'
        background_color = theme.as_dict().background_color or '#ffffff'
        default_button_color = theme.as_dict().default_button_color or '#F2F2F2'
        shadow_hex, shadow_rgba = generate_shadow_color(primary_color or '#000000')
        theme_list = {
            "primary": primary_color or '#000000',
            "btn-primary": primary_color or '#000000',
            "control-bg": adjust_color(primary_color or '#000000', 96),
            "gray-500": adjust_color(primary_color or '#000000', 60),
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
            "side_bg_color": theme.as_dict().sidebar_background_color or '#000000',
            "side_hover_color": theme.as_dict().sidebar_hover_color or '#e64343',
            "side_font_color": theme.as_dict().sidebar_font_color or '#ffffff',
            "group_by_background_color": theme.as_dict().group_by_background_color or '#000000',
            "group_by_font_color": theme.as_dict().group_by_font_color or '#ffffff',
            "list_subject_color": theme.as_dict().list_subject_color,
            "font-family-style": theme.as_dict().font_family or 'Inter',
            "secondary_color": theme.as_dict().secondary_color or '#F2F2F2',
            "secondary_font_color": theme.as_dict().secondary_font_color or '#00000',
            "secondary_color_light": adjust_color(secondary_color or '#F2F2F2', 50),
            "secondary_color_light_70": adjust_color(secondary_color or '#F2F2F2', 70),
            "secondary_color_dark": adjust_color(secondary_color or '#F2F2F2', -50),
            "primary_color_light": adjust_color(primary_color, 50),
            "primary_color_dark": adjust_color(primary_color, -50),
            "default_color": theme.as_dict().default_button_color or '#F2F2F2',
            "default_font_color": theme.as_dict().default_button_font_color or '#000000',
            "default_color_light_70": adjust_color(default_button_color or '#F2F2F2', 70),
            "default_color_light": adjust_color(default_button_color or '#F2F2F2', 50),
            "default_color_dark": adjust_color(default_button_color or '#F2F2F2', -50),
            "date_picker_color": theme.as_dict().date_picker_color or '#000000',
            "date_picker_color_light": adjust_color(theme.as_dict().date_picker_color or '#000000', 96),
            "header_background_color": theme.as_dict().header_background_color or '#ffffff',
            "header_font_color": theme.as_dict().header_font_color or '#383838',
            "header_breadcrumb_disabled_color": theme.as_dict().header_breadcrumb_disabled_color or '#7c7c7c',
            "menu_bg_for_full_screen": theme.as_dict().menu_bg_for_full_screen or '#ffffff',
        }
        is_bg_auto = theme.as_dict().is_bg_auto
        if is_bg_auto:
            theme_list.update({
                "control-bg": adjust_color(background_color, 96),
                "fg-color": adjust_color(background_color, 70),
                "bg-color": adjust_color(background_color, 70),
            })
        context.update({
            'allowed_workspaces': allowed_workspaces,
            "company_name": company_name or _("No Company"),
            "company_logo": company_logo,
            "kanak_theme": theme.as_dict() if theme else {},
            "theme_list": theme_list,
            "list_style": theme.as_dict().list_style,
            "form_style": theme.as_dict().form_style,
            "button_style": theme.as_dict().button_style,
            "is_full_screen_menu": theme.as_dict().is_full_screen_menu,
            "menu_bg_img_for_full_screen": theme.as_dict().menu_bg_img_for_full_screen or '',
        })
    else:
        shadow_hex, shadow_rgba = generate_shadow_color('#000000')
        allowed_workspaces = apply_theme_menu(theme, allowed_workspaces)
        theme_list = {
            "primary": '#000000',
            "btn-primary": '#000000',
            "control-bg": adjust_color('#000000', 96),
            "gray-500": adjust_color('#000000', 60),
            "shadow-color-hex": shadow_hex,
            "shadow-color-rgba": shadow_rgba,
            "invert-neutral": '#000000',
            "gray-50": adjust_color('#000000', 98),
            "gray-100": adjust_color('#000000', 96),
            "focus-default": adjust_color('#000000', 96),
            "btn-default-hover-bg": adjust_color('#000000', 90),
            "tm-dark-color": adjust_color('#000000', -50),
            "switch-bg": adjust_color('#000000', 70),
            "bg-background-color": '#ffffff',
            "side_bg_color": '#000000',
            "side_hover_color": '#e64343',
            "side_font_color": '#ffffff',
            "group_by_background_color": '#000000',
            "group_by_font_color": 'white',
            "list_subject_color": '#000000',
            "font-family-style": 'Inter',
            "date_picker_color": '#000000',
            "date_picker_color_light": adjust_color('#000000', 96),
            "header_background_color": '#ffffff',
            "header_font_color": '#383838',
            "header_breadcrumb_disabled_color": '#7c7c7c',
            "menu_bg_for_full_screen": '#ffffff',
        }

        context.update({
            'allowed_workspaces': allowed_workspaces,
            "company_name": company_name or _("No Company"),
            "company_logo": company_logo,
            "kanak_theme": theme.as_dict() if theme else 'default',
            "theme_list": theme_list,
            "list_style": theme.as_dict().list_style if theme else 'None',
            "form_style": theme.as_dict().form_style if theme else 'None',
            "button_style": theme.as_dict().button_style if theme else 'None',
            "is_full_screen_menu": 0,
        })

    return context
