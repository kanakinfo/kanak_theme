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
    primary_color = theme.as_dict().primary_color
    background_color = theme.as_dict().background_color
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
        "font-family-style": theme.as_dict().font_family or 'Inter'

    }

    context.update({
        'allowed_workspaces': allowed_workspaces,
        "company_name": company_name or _("No Company"),
        "company_logo": company_logo,
        "kanak_theme": theme.as_dict() if theme else {},
        "theme_list": theme_list,
        "list_style": theme.as_dict().list_style,
        "form_style": theme.as_dict().form_style
    })

    return context
