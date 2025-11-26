if (!window.frappe) window.frappe = {};
frappe.provide("frappe.ui.form");
frappe.provide("frappe.views");
window.addEventListener("load", () => {
  setTimeout(() => {
    document.getElementById("kanak_loading_overlay")?.classList.remove("active");
  }, 300);
});
frappe.after_ajax(() => {
    const sidebarEl = $(".sidebar.theme_sidebar");
    sidebarEl
        .off('mouseover.theme')
        .on('mouseover.theme', () => {
            sidebarEl.removeClass('mpclose');
        });

    sidebarEl
        .off('mouseout.theme')
        .on('mouseout.theme', () => {
            sidebarEl.addClass('mpclose');
        });

    $(document).off("click.theme", ".sidebar.theme_sidebar .arrow")
        .on("click.theme", ".sidebar.theme_sidebar .arrow", function(e) {
            e.preventDefault();
            $(this).closest("li").toggleClass("showMenu");
    });
    
});
frappe.router.on('change', () => {
    const fsMenu = document.getElementById("full-screen-menu");
    if(fsMenu){
        $(fsMenu).addClass('hidden');
    }
    const sidebarEl = $(".sidebar.theme_sidebar");
    if(sidebarEl){
        $(sidebarEl).addClass('mpclose');
    }
});
frappe.provide("frappe.ui.toolbar");
frappe.ui.toolbar.fullscreen_selected_parent = null;

frappe.ui.toolbar.add_theme_menu_item = function () {
    frappe.call({
        method: "kanak_theme.kanak_theme.api.api.get_themes",
        callback: function (r) {
            if (!r.message) return;

            let themes = r.message;

            let html = `<ul class="themeswitcher">`;

            themes.forEach(theme => {
                html += `
                <li class="themeswitcher__item">
                    <button class="themepicker__btn js-themepicker-themeselect"
                        data-theme="${theme.name}"
                        aria-label="select theme '${theme.theme_name}'">
                        
                        <span class="themepicker__name">${theme.theme_name}</span>
                        <span class="themepicker__palette">
                            <span class="themepicker__swatch" style="background:${theme.primary_color}; border:2px solid #fff;"></span>
                            <span class="themepicker__swatch" style="background:${theme.secondary_color}; border:2px solid #fff;"></span>
                            <span class="themepicker__swatch" style="background:${theme.background_color}" border:2px solid #fff;"></span>
                            <span class="themepicker__swatch" style="background:${theme.header_background_color}" border:2px solid #fff;"></span>
                            <span class="themepicker__swatch" style="background:${theme.default_button_color}" border:2px solid #fff;"></span>
                            <span class="themepicker__swatch" style="background:${theme.sidebar_background_color}" border:2px solid #fff;"></span>
                        </span>
                    </button>
                </li>`;
            });

            html += `</ul>`;

            let d = new frappe.ui.Dialog({
                title: __("Choose Theme"),
                size: "large",
                fields: [
                    {
                        fieldname: "theme_html",
                        fieldtype: "HTML",
                        options: html
                    }
                ]
            });

            d.show();
            setTimeout(() => {
                d.$wrapper.find(".js-themepicker-themeselect").on("click", function () {
                    const theme_name = $(this).data("theme");
                    apply_theme(theme_name);
                    d.hide();
                });
            }, 200);
        }
    });
};
frappe.ui.toolbar.Toolbar.prototype.bind_full_screen_menu_events = function(){
    var self = this;
    const fsMenu = document.getElementById("full-screen-menu");
    const openBtn = document.querySelector(".fs-menu-toggle");
    if (fsMenu && openBtn) {
        const openBtn = document.querySelector(".fs-menu-toggle");
        if(openBtn){
            openBtn.addEventListener("click", () => {
                if ($(fsMenu).hasClass("hidden")) {
                    $('.kanak_theme_main_cl').addClass('openmegamenu_cl');
                }else{
                    $('.kanak_theme_main_cl').removeClass('openmegamenu_cl');
                }
                $(fsMenu).toggleClass('hidden');
            });
        }
    }
    if(fsMenu){
        $(fsMenu).on('click', '.fs-menu-item', function(ev){
            ev.preventDefault();
            ev.stopPropagation();

            const route = $(this).data("route").trim();
            if (!route) return;
            $(fsMenu).addClass("hidden");
            $(".kanak_theme_main_cl").removeClass("openmegamenu_cl");
            frappe.router.set_route(route);
        });
    }
    if($(".sidebar-toggle-menu_btn").length){
        $(".sidebar-toggle-menu_btn").on('click', function(ev){
            $(".kanak_theme_main_cl .sidebar.theme_sidebar").toggleClass('mpclose');
        });
    }

};
frappe.ui.toolbar.Toolbar.prototype.setup_notifications = function(){
    this.bind_full_screen_menu_events();
    this.userprofiledetails = new frappe.ui.UserProfileInfo();
    if (frappe.boot.desk_settings.notifications && frappe.session.user !== "Guest") {
        this.notifications = new frappe.ui.CustomNotifications();
    }
};


function apply_theme(theme_name) {
    frappe.call({
        method: "kanak_theme.kanak_theme.api.api.apply_theme",
        args: { theme: theme_name },
        callback: function () {
            frappe.show_alert({
                message: __("Theme switched to ") + theme_name,
                indicator: "green"
            });

            setTimeout(() => {
                location.reload();
            }, 500);
        }
    });
}
const super_make_sidebar = frappe.views.Workspace.prototype.make_sidebar;

frappe.views.Workspace.prototype.prepare_child_side_bar = function(){
        let menuname = frappe.router.slug(this.get_page_to_show().name);
        let menus = this.get_menu_with_children(menuname);
        this.wrapper.find(".menuchild_layout-side-section").remove();
        if (frappe.boot.is_full_screen_menu && menus.length > 1) {
            let sidebar = $(`
                <div class="col-lg-2 menuchild_layout-side-section">
                    <div class="child-menu-wrapper"></div>
                </div>
            `);
            this.wrapper.find(".layout-side-section").after(sidebar);
            let child_container = sidebar.find(".child-menu-wrapper");
            menus.forEach(slug => {
                child_container.append(`
                    <div class="child-menu-item" data-slug="${slug}">
                        <span>${this.get_menu_label(slug)}</span>
                    </div>
                `);
            });
            let current_slug = frappe.router.slug(menuname);
            child_container.find(`[data-slug="${current_slug}"]`).addClass("active");
            child_container.on("click", ".child-menu-item", (e) => {
                let item = $(e.currentTarget);
                let slug = $(e.currentTarget).data("slug");
                child_container.find(".child-menu-item").removeClass("active");
                item.addClass("active");
                let is_private = this.is_private_workspace(slug);
                if (is_private) {
                    frappe.set_route(`/private/${slug}`);
                } else {
                    frappe.set_route(slug);
                }
            });
        }
};
frappe.views.Workspace.prototype.get_menu_with_children = function(menu_name){
        let all = frappe.boot.allowed_workspaces;
        let input_slug = frappe.router.slug(menu_name);
        let current = all.find(ws => frappe.router.slug(ws.name) === input_slug);

        if (!current) return [];

        let parent_slug;
        if (current.parent_page) {
            parent_slug = frappe.router.slug(current.parent_page);
        } 
        else {
            parent_slug = frappe.router.slug(current.name);
        }
        let children = all
            .filter(ws => ws.parent_page && frappe.router.slug(ws.parent_page) === parent_slug)
            .map(ws => frappe.router.slug(ws.name));
        return [parent_slug, ...children];
};
frappe.views.Workspace.prototype.get_menu_label = function(slug){
    let ws = frappe.boot.allowed_workspaces
            .find(w => frappe.router.slug(w.name) === slug);
    return ws ? ws.label || ws.name : slug;
};
frappe.views.Workspace.prototype.is_private_workspace = function(slug){
    let ws = frappe.boot.allowed_workspaces
            .find(w => frappe.router.slug(w.name) === slug);
    return ws && ws.private ? true : false;
};
const super_show = frappe.views.Workspace.prototype.show;
frappe.views.Workspace.prototype.show = function () {
    super_show.call(this);
    this.prepare_child_side_bar();
};
frappe.views.Workspace.prototype.make_sidebar = function(){
    super_make_sidebar.call(this);
    this.prepare_child_side_bar();
};
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
        this.$wrapper.find(".label-area").text(__(this.df.label || ""));
    }
    make_input() {
        this.input = this.$wrapper.find("input").get(0);
        this.$input = $(this.input);
        $(this.label_area).off('click.toggle').on('click.toggle', () => {
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
        this.fg = new frappe.ui.FieldGroup({
            fields: fields,
            parent: form_container,
            doc: this.doc,
        });

        this.fg.make();
        frappe.after_ajax(() => {
            fields.forEach(df => {
                let field = this.fg.fields_dict[df.fieldname];
                if (field?.set_value) {
                    field.set_value(this.doc[df.fieldname]);
                }
            });

            let btns = document.createElement("div");
            btns.style.marginTop = "12px";

            // Add buttons
            btns.innerHTML = `
                <button class="btn btn-primary btn-sm quick-save">Save</button>
                <button class="btn btn-secondary btn-sm quick-cancel">Cancel</button>
                <button class="btn btn-primary btn-sm quick-open-form" title="Open Full Form">
                    <svg class="icon icon-sm mb-1">
                        <use href="#icon-right"></use>
                    </svg>
                </button>
            `;
            form_container.appendChild(btns);
            if (this.doc.docstatus !== 0) {
                btns.querySelector(".quick-save").style.display = "none";
            }
            btns.querySelector(".quick-save").onclick = () => {
                let values = this.fg.get_values();
                if (!values) return;
                this.update(values);
            };

            btns.querySelector(".quick-cancel").onclick = () => {
                this.wrapper.remove();
            };
            btns.querySelector(".quick-open-form").onclick = () => {
                frappe.set_route("Form", this.doctype, this.docname);
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
    if (this.meta && this.meta.quick_entry) {
        this.add_quick_icon_events();
    }
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
            let existing = row.next(".quick-form-wrapper");

            if (existing.length) {
                existing.remove();
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
                    <button class="btn btn-sm btn-default add-level">+</button>
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

const super_set_actions = frappe.widget.widget_factory.onboarding.prototype.set_actions;
frappe.widget.widget_factory.onboarding.prototype.set_actions = function(){
    if (this.in_customize_mode) return;

        this.action_area.empty();
        const dismiss = $(
            `<button class="btn btn-sm btn-secondary small" style="cursor:pointer;">${__(
                "Dismiss",
                null,
                "Stop showing the onboarding widget."
            )}</button>`
        );
        dismiss.on("click", () => {
            let dismissed = JSON.parse(localStorage.getItem("dismissed-onboarding") || "{}");
            dismissed[this.title] = frappe.datetime.now_datetime();

            localStorage.setItem("dismissed-onboarding", JSON.stringify(dismissed));
            this.delete(true, true);
            this.widget.closest(".ce-block").hide();
            frappe.telemetry.capture("dismissed_" + frappe.scrub(this.title), "frappe_onboarding");
        });
        dismiss.appendTo(this.action_area);
};
