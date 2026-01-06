// Copyright (c) 2025, Kanak infosystems LLP. and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Themes", {
// 	refresh(frm) {

// 	},
// });
frappe.ui.form.on("Theme Language", {
    language(frm, cdt, cdn) {
        const row = locals[cdt][cdn];
        if (!row.language) return;

        frappe.db.get_value("Language", row.language, "language_name")
            .then(r => {
                frappe.model.set_value(
                    cdt,
                    cdn,
                    "language_name",
                    r.message.language_name
                );
            });
    }
});

