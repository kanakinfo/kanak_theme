if (!window.frappe) window.frappe = {};
frappe.provide("frappe.ui.form");
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
        this.label_span = this.label_area;  // ✅ Frappe expects this for set_label()

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
