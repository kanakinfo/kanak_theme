if (!window.frappe) window.frappe = {};
frappe.provide("frappe.ui.form");
frappe.provide("frappe.views");
frappe.after_ajax(() => {
    const sidebarEl = $(".sidebar.theme_sidebar");
    sidebarEl.off('mouseover.theme').on('mouseover.theme', () => {
        sidebarEl.removeClass('mpclose');
    });

    sidebarEl.off('mouseout.theme').on('mouseout.theme', () => {
        sidebarEl.addClass('mpclose');
    });
    $(document).off("click.theme", ".sidebar.theme_sidebar .arrow")
        .on("click.theme", ".sidebar.theme_sidebar .arrow", function(e) {
            e.preventDefault();
            $(this).closest("li").toggleClass("showMenu");
        });
});
frappe.ui.form.ControlCheck = class ControlCheckToggle extends frappe.ui.form.ControlData {
    static html_element = "input";
    static input_type = "checkbox";

    make_wrapper() {
        this.$wrapper = $(`<div class="form-group frappe-control">
                       <div class="kanak-toggle d-flex align-items-center">
                        <label class="switch mb-0">
                            <input type="checkbox">
                            <span class="slider round"></span>
                        </label>
                        <span class="label-area ml-2">${__(this.df.label)}</span>
                        <span class="ml-1 help"></span>
                    </div>
            <p class="help-box small text-muted"></p>
        </div>`).appendTo(this.parent);
    }

    set_input_areas() {
        this.input_area = this.$wrapper.find("input").get(0);
        this.label_area = this.$wrapper.find(".label-area").get(0);
        this.label_span = this.label_area;

        // Set translated label
        this.$wrapper.find(".label-area").text(__(this.df.label || ""));
    }


    make_input() {
        this.input = this.$wrapper.find("input").get(0);
        this.$input = $(this.input);
        $(this.label_area).off('click.toggle').on('click.toggle', () => {
            // Check if field editable
            if (this.df.read_only || this.df.disabled) return;

            const newValue = !this.input.checked;
            this.input.checked = newValue;
            this.$input.trigger("change"); // 🔹 trigger event so frappe updates the docfield
        });
        this.bind_change_event();
    }

    get_input_value() {
        return this.input && this.input.checked ? 1 : 0;
    }

    validate(value) {
        return cint(value);
    }

    set_input(value) {
        this.last_value = this.value;
        value = cint(value);
        this.value = value;
        if (this.input) {
            this.input.checked = !!value;
        }
        this.set_mandatory(value);
    }
};


const super_setup_list_wrapper = frappe.views.BaseList.prototype.setup_list_wrapper;
frappe.views.BaseList.prototype.setup_list_wrapper = function(){
    this.$custom_filter_bar = $(`
            <div class="custom-filter-bar"></div>
        `).appendTo(this.page.main);
       super_setup_list_wrapper.call(this);
       this.setup_custom_filter_events();
};
frappe.views.BaseList.prototype.setup_custom_filter_events = function () {
    let me = this;
    const super_refresh = this.refresh;
    this.refresh = function () {
        super_refresh.apply(this, arguments);
        me.render_filter_tags();
    };
    this.render_filter_tags();
};

frappe.views.BaseList.prototype.render_filter_tags = function () {
    let me = this;

    if (!this.$custom_filter_bar) return;
    this.$custom_filter_bar.empty();

    let filters = this.filter_area?.filter_list?.filters;
    if (!filters || filters.length === 0) {
        this.$custom_filter_bar.hide();
        return;
    }
    this.$custom_filter_bar.show();

    filters.forEach((f, i) => {
        let label = f.get_filter_button_text();

        const filter_tag = $(`
            <div class="filter-custom-tag">
                <span class="filter-label">${label}</span>
                <span class="remove-filter" data-filter-index="${i}">×</span>
            </div>
        `);

        filter_tag.find('.remove-filter').on('click', (ev) => {
            let index = $(ev.currentTarget).data('filter-index');
            let flt = me.filter_area.filter_list.filters[index];
            if (!flt) return;

            flt.remove();
            me.filter_area.filter_list.apply();
        });

        me.$custom_filter_bar.append(filter_tag);
    });
};
frappe.ui.form.QuickUpdateForm = class QuickUpdateForm {
    constructor(doctype, docname, wrapper) {
        this.doctype = doctype;
        this.docname = docname;
        this.wrapper = wrapper;
        this.doc = null;
        this.fg = null;
    }

    async setup() {
        this.doc = await frappe.db.get_doc(this.doctype, this.docname);
        this.meta = frappe.get_meta(this.doctype);

        let fields = this.meta.fields.filter(df =>
            (df.reqd || df.allow_in_quick_entry) &&
            !df.read_only &&
            !df.is_virtual &&
            df.fieldtype !== "Table" &&
            !["Section Break", "Column Break", "Tab Break"].includes(df.fieldtype)
        );

        this.render_inline(fields);
    }

    render_inline(fields) {
        this.wrapper.innerHTML = "";

        const form_container = document.createElement("div");
        form_container.classList.add("quick-edit-form");
        form_container.style.padding = "10px";
        form_container.style.background = "#ffffff";
        form_container.style.border = "1px solid #dcdcdc";
        form_container.style.marginTop = "8px";
        form_container.style.borderRadius = "6px";
        this.wrapper.appendChild(form_container);

        // FieldGroup
        this.fg = new frappe.ui.FieldGroup({
            fields: fields,
            parent: form_container,
            doc: this.doc,
        });

        this.fg.make();

        frappe.after_ajax(() => {
            // set values
            fields.forEach(df => {
                let field = this.fg.fields_dict[df.fieldname];
                if (field?.set_value) {
                    field.set_value(this.doc[df.fieldname]);
                }
            });

            // Buttons
            let btns = document.createElement("div");
            btns.style.marginTop = "12px";

            btns.innerHTML = `
                <button class="btn btn-primary btn-sm quick-save">Save</button>
                <button class="btn btn-secondary btn-sm quick-cancel">Cancel</button>
            `;
            form_container.appendChild(btns);

            // SAVE button
            btns.querySelector(".quick-save").onclick = () => {
                let values = this.fg.get_values();
                if (!values) return;
                this.update(values);
            };

            // CANCEL button
            btns.querySelector(".quick-cancel").onclick = () => {
                this.wrapper.remove();
            };
        });
    }

    update(values) {
        let me = this;

        frappe.call({
            method: "frappe.client.save",
            args: {
                doc: Object.assign(this.doc, values),
            },
            freeze: true,
            callback(r) {
                me.wrapper.remove();
                frappe.show_alert("Updated successfully");

                // Refresh list automatically
                me.refresh_list();
            },
        });
    }

    refresh_list() {
        if (cur_list) cur_list.refresh();
    }
};
function create_quick_element(doctype) {
    const quick = document.createElement("span");
    quick.classList.add("quick-action", "mr-1");
    quick.innerHTML = frappe.utils.icon("edit", "sm", "quick-icon");
    quick.dataset.doctype = doctype;
    return quick;
};
frappe.views.ListView.prototype.show_quick_form_under_row = function (row, docname) {
    this.$result.find(".quick-form-wrapper").remove();
    let container = $(`
        <div class="quick-form-wrapper">
        </div>
    `);
    row.after(container);
    let quick_form = new frappe.ui.form.QuickUpdateForm(this.doctype, docname, container[0]);
    quick_form.setup();
};
const super_render = frappe.views.ListView.prototype.render;
frappe.views.ListView.prototype.render = function () {
    this._element_factory.templates.quick = create_quick_element(this.doctype);
    super_render.call(this);
    this.add_quick_icon_events();
};
frappe.views.ListView.prototype.add_quick_icon_events = function () {
    let me = this;

    this.$result.find(".list-row").each(function () {
        let row = $(this);
        if (row.find(".quick-action").length) return;

        let quick_icon = $(me._element_factory.templates.quick).clone();
        row.find(".list-row-col:first .level-item:first").after(quick_icon);

        quick_icon.on("click", function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            ev.stopImmediatePropagation();

            let docname = row.find('.list-row-checkbox').attr("data-name");

            // ==== Toggle logic ====
            let existing = row.next(".quick-form-wrapper");

            if (existing.length) {
                existing.remove();  // close if already open
                return;
            }

            me.show_quick_form_under_row(row, docname);
        });
    });
};

frappe.ui.form.on("Themes", {
    after_save(frm) {
        frappe.show_alert("Theme Saved. Reloading…");
        setTimeout(() => {
            window.location.reload();
        }, 600);
    }
});



