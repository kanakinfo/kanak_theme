# Copyright (c) 2025, Kanak infosystems LLP. and contributors
# For license information, please see license.txt

# import frappe
from __future__ import unicode_literals
import frappe
from frappe.model.document import Document


class StickyNote(Document):
    def before_save(self):
        # ensure owner set and defaults
        if not self.z_index:
            self.z_index = 0
        if self.width is None:
            self.width = 250
        if self.height is None:
            self.height = 200
