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
    // this.$group_filter_bar = $(`
    //         <div class="custom-group-bar"></div>
    //     `).appendTo(this.page.main);
       super_setup_list_wrapper.call(this);
       // this.setup_custom_group_events();
       this.setup_custom_filter_events();
};
frappe.views.BaseList.prototype.setup_custom_group_events = function () {
    let me = this;
    const super_refresh = this.refresh;
    this.refresh = function () {
        super_refresh.apply(this, arguments);
        me.render_levels();
    };
    this.render_levels();
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
    if (this.is_grouped) {
        this.render_grouped_list();
    } else {
        super_render.call(this);
    }
    this.add_quick_icon_events();
    // this.bind_group_header_toggle();
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
const old_init = frappe.views.ListView.prototype.init;
frappe.views.ListView.prototype.init = function () {
    if (!this.group_levels) {
        this.group_levels = [];
    }
    return old_init.call(this);
};

frappe.views.ListView.prototype.render_group_by_options = function() {
    let fields = this.meta.fields || [];

    let select = this.$group_by_panel.find(".group-field");
    select.empty();
    select.append(`<option value="" disabled selected>Group By</option>`);
    const allowed_types = ["Data", "Select", "Link", "Int", "Date"];
    fields
      .filter(df => allowed_types.includes(df.fieldtype))
      .forEach(df => {
          select.append(`<option value="${df.fieldname}">${df.label}</option>`);
      });
};
frappe.views.ListView.prototype.bind_group_by_events = function () {
    this.$group_by_panel.on("click", ".add-level", () => {
        let selected = this.$group_by_panel.find(".group-field").val();
        if (!selected) return;
        if (this.group_levels.includes(selected)) return;
        this.group_levels.push(selected);
        this.render_levels();
        this.refresh_grouped_list();
    });
};
frappe.views.ListView.prototype.get_label_by_fieldname = function(fieldname) {
    const df = this.meta.fields.find(f => f.fieldname === fieldname);
    return df ? df.label : fieldname; // fallback
};
frappe.views.ListView.prototype.render_levels = function () {
    const container = this.$page.find(".custom-group-bar");
    if(container.length){
        let levelsdatas = this.group_levels?this.group_levels.length: 0;
        container.empty();
        if(!levelsdatas){
            this.$page.find(".custom-group-bar").hide();
            return;
        }else{
            this.$page.find(".custom-group-bar").show();
        }
    }
    
    this.group_levels.forEach((lvl, index) => {
        let label = this.get_label_by_fieldname(lvl);
        container.append(`
            <div class="group-custom-tag">
                <span class="group-label">${label}</span>
                <span class="remove-group" data-index="${index}">×</span>
            </div>
        `);
    });
    container.on("click", ".remove-group", (e) => {
        let i = $(e.currentTarget).data("index");
        this.group_levels.splice(i, 1);
        this.render_levels();
        this.refresh_grouped_list();
    });
};
frappe.views.ListView.prototype.refresh_grouped_list = function () {
    this.refresh();
};
const super_before_render = frappe.views.ListView.prototype.before_render;
frappe.views.ListView.prototype.before_render =function(){
    super_before_render.call(this);
    if(this.view_name == 'List'){
        const container = this.$page.find(".custom-group-bar");
        if(!container.length){
            this.$group_filter_bar = $(`
            <div class="custom-group-bar"></div>
            `).prependTo(this.page.main);
            this.$page.find('.page-form').after(this.$group_filter_bar);
            this.setup_custom_group_events();
        }
        const xgroupbycontainer = this.$page.find(".group-by-panel");
        if(!xgroupbycontainer.length){
            this.$group_by_panel = $(`
                <div class="group-by-panel">
                    <select class="group-field form-control" style="width:100px">
                    </select>
                    <button class="btn btn-sm btn-primary add-level">+</button>
                </div>
            `);
            this.$group_by_panel.prependTo(this.$page.find('.page-form .filter-section'));
            
            this.render_group_by_options();
            this.bind_group_by_events();
        }
    }else{
        $(".custom-group-bar").remove();
        $(".group-by-panel").remove();
    }
};
frappe.views.ListView.prototype.get_group_by = function () {
    return this.group_levels.length ? this.group_levels.join(",") : null;
};
const old_get_call_args = frappe.views.ListView.prototype.get_call_args;
frappe.views.ListView.prototype.get_call_args = function () {
    let args = old_get_call_args.call(this);
    if (args.args && args.args.view === "List") {
        if (this.group_levels.length) {
            args.args['group_by'] = this.group_levels.join(",");
        }
        args['method'] = "kanak_theme.kanak_theme.api.api.grouped_list";
    }
    return args;
};

const super_prepare_data = frappe.views.BaseList.prototype.prepare_data;
frappe.views.BaseList.prototype.prepare_data = function(r){
        let msg = r.message;
        if (msg.is_grouped) {
            this.is_grouped = true;
            this.group_data = msg.groups;
            return;
        }else{
            this.$result.empty();
            this.is_grouped = false;
        }
        super_prepare_data.call(this, r);
};
const old_render_list = frappe.views.ListView.prototype.render_list;
frappe.views.ListView.prototype.render_list = function () {
    if (this.is_grouped) {
        this.render_grouped_list();
    } else {
        old_render_list.call(this);
    }
};
frappe.views.ListView.prototype.render_grouped_list = function () {
    this.$result.empty();

    if (!this.group_data || !this.group_data.length) {
        this.$result.append(`<div class="text-muted mt-4">No records found</div>`);
        return;
    }

    this.render_group_nodes(this.group_data, 0, this.$result);
};
frappe.views.ListView.prototype.render_group_nodes = function (nodes, level, container) {
    let me = this;

    nodes.forEach((node) => {
        let header = $(`
            <div class="group-header knk-group-header-cl group-level-${level}">
                <span class="arrow" style="margin-right:8px;">▶</span>
                ${node.group} <span class="text-muted ml-2">(${node.total})</span>
            </div>
        `);

        container.append(header);
        let wrapper = $(`<div class="group-wrapper" style="display:none; margin-left:${20 + level * 15}px;"></div>`);
        container.append(wrapper);
        if (node.children.length && node.children[0].is_child_group) {
            this.render_group_nodes(node.children, level + 1, wrapper);
        }
        else {
            node.children.forEach(doc => {
                wrapper.append(me.render_grouped_row(doc));
            });
        }
        header.on("click", function () {
            let arrow = $(this).find(".arrow");

            if (wrapper.is(":visible")) {
                wrapper.slideUp(120);
                arrow.text("▶");
            } else {
                wrapper.slideDown(120);
                arrow.text("▼");
            }
        });
    });
};
frappe.views.ListView.prototype.render_grouped_row = function (doc) {
    return this.get_list_row_html(doc);
};



