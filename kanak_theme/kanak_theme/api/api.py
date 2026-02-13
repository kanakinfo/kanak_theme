from __future__ import unicode_literals
import frappe
from frappe import _
import json
from frappe.utils import cint
from frappe.permissions import has_permission
from frappe.utils import now


def build_where_clause(filters):
    """Build safe SQL WHERE clause manually."""
    if not filters:
        return "", []

    sql_parts = []
    params = []

    for f in filters:
        field, op, val = f
        sql_parts.append(f"`{field}` {op} %s")
        params.append(val)

    where_sql = "WHERE " + " AND ".join(sql_parts)
    return where_sql, params


def get_group_values(doctype, filters, group_field):
    rows = frappe.get_all(
        doctype,
        filters=filters,
        pluck=group_field,
    )
    values = sorted({r for r in rows if r})
    return values


def get_group_docs(doctype, fields, filters):
    return frappe.get_list(
        doctype,
        fields=fields,
        filters=filters,
        limit_page_length=5000,
    )


def build_group_tree(doctype, fields, levels, base_filters, level_index=0):
    """
    Recursively build multi-level group hierarchy.
    levels = ["item_group", "brand", "model"]
    """

    # If no levels left → fetch docs
    if level_index >= len(levels):
        docs = get_group_docs(doctype, fields, base_filters)
        return docs

    current_level = levels[level_index]

    # Step 1: Get distinct values for this level
    group_values = get_group_values(doctype, base_filters, current_level)

    result = []

    for value in group_values:
        # Step 2: Build filters for next level
        new_filters = base_filters.copy()
        new_filters.append([current_level, "=", value])

        # Step 3: Recursively get children
        child_data = build_group_tree(
            doctype, fields, levels, new_filters, level_index + 1
        )

        # Step 4: Count items under this node
        total_count = (
            len(child_data)
            if isinstance(child_data, list) and len(child_data) and isinstance(child_data[0], dict)
            else sum(x.get("total", 0) if isinstance(x, dict) else 0 for x in child_data)
        )

        result.append({
            "group": value,
            "total": total_count,
            "is_child_group": True,
            "children": child_data if isinstance(child_data, list) else [],
        })

    return result


@frappe.whitelist()
def grouped_list(doctype, fields, filters=None, group_by=None, order_by=None, limit=None, page_length=None, start=None):
    fields = json.loads(fields) if isinstance(fields, str) else fields
    filters = json.loads(filters or "[]") if isinstance(filters, str) else filters

    limit = cint(limit) if limit else None
    start = cint(start) if start else None

    # ----------------------------------------------------------
    # NORMAL MODE
    # ----------------------------------------------------------
    if not group_by:
        return frappe.get_list(
            doctype,
            fields=fields,
            filters=filters,
            order_by=order_by,
            limit_start=start,
            limit_page_length=page_length
        )

    # ----------------------------------------------------------
    # GROUP MODE (MULTI-LEVEL)
    # ----------------------------------------------------------
    levels = [g.strip() for g in group_by.split(",") if g.strip()]

    grouped_data = build_group_tree(
        doctype=doctype,
        fields=fields,
        levels=levels,
        base_filters=filters,
        level_index=0
    )

    # detect if only single-level and no children
    single_level = (
        len(levels) == 1 and
        all(len(node.get("children", [])) == 0 for node in grouped_data)
    )
    return {
        "is_grouped": True,
        "groups": grouped_data,
    }


@frappe.whitelist()
def get_themes():
    return frappe.get_all(
        "Themes",
        fields=["name", "theme_name", "primary_color", "secondary_color",
                "background_color", "default_button_color", "sidebar_background_color"]
    )


@frappe.whitelist()
def apply_theme(theme):
    user = frappe.session.user
    frappe.db.set_value("User", user, "theme", theme)
    frappe.db.commit()
    return True

@frappe.whitelist()
def list_notes():
    """Return list of Sticky Note docs for current user."""
    user = frappe.session.user
    notes = frappe.get_all("Sticky Note",
                          filters={"owner": user},
                          fields=["name", "title", "content", "x", "y", "width", "height", "z_index", "visible", "pinned", "color", "creation", "modified"])
    return notes

@frappe.whitelist()
def create_note(title="", content="", x=0, y=0, width=250, height=200, color="#fff380", pinned=0, visible=1):
    user = frappe.session.user
    doc = frappe.new_doc("Sticky Note")
    doc.title = title or ""
    doc.content = content or ""
    doc.x = float(x) if x else 0
    doc.y = float(y) if y else 0
    doc.width = float(width) if width else 250
    doc.height = float(height) if height else 200
    doc.color = color or "#fff380"
    doc.pinned = int(pinned)
    doc.visible = int(visible)
    doc.insert(ignore_permissions=True)
    frappe.db.commit()
    return doc.as_dict()

@frappe.whitelist()
def update_note(name, **kwargs):
    """Update fields of a note. Only owner may update."""
    user = frappe.session.user
    doc = frappe.get_doc("Sticky Note", name)
    if doc.owner != user and not frappe.has_permission("Sticky Note", "write"):
        frappe.throw(_("Not permitted"))
    for k, v in kwargs.items():
        if k in ("title","content","color"):
            setattr(doc, k, v)
        elif k in ("x","y","width","height"):
            try:
                setattr(doc, k, float(v))
            except:
                pass
        elif k in ("z_index","pinned","visible"):
            try:
                setattr(doc, k, int(v))
            except:
                pass
    doc.save(ignore_permissions=True)
    frappe.db.commit()
    return doc.as_dict()

@frappe.whitelist()
def delete_note(name):
    user = frappe.session.user
    doc = frappe.get_doc("Sticky Note", name)
    if doc.owner != user and not frappe.has_permission("Sticky Note", "delete"):
        frappe.throw(_("Not permitted"))
    doc.delete()
    frappe.db.commit()
    return {"deleted": True}
