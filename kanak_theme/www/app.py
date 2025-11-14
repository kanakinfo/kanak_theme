# Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
# License: MIT. See LICENSE
import frappe
from frappe import _
from frappe.www import app


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
    context.update({
        'allowed_workspaces': allowed_workspaces,
        "company_name": company_name or _("No Company"),
        "company_logo": company_logo,
    })

    return context
