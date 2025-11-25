frappe.provide("frappe.search");

frappe.ui.UserProfileInfo = class UserProfileInfo {
	constructor() {
		this.sidebar = $("#user-profile-sidebar");
        this.overlay = $("#profile-overlay");
        this.body = this.sidebar.find(".profile-sidebar-body");
        this.nav_items = frappe.boot.navbar_settings?.settings_dropdown || [];
        this.make();
	}
	make() {
		this.dropdownbtn = $(".navbar").find(".dropdown-navbar-user").removeClass("hidden");
		this.setup_dropdown_events();
		this.render_user_details();
        this.render_menu_list();
	}
	render_user_details() {
        let user = frappe.session.user;
        let info = frappe.boot.user_info[user];
        let has_image = info.image && info.image !== "" && info.image !== null;
        let html = `
        <div class="profile-header d-flex">
            <div class="profile-avatar">
                ${has_image ? `
                    <img class="avatar-img" src="${info.image}">
                ` : `
                    <div class="profile_avatar_letter">
                        ${frappe.get_abbr(info.fullname)}
                    </div>
                `}
            </div>
            <div class="profile-text">
                <div class="profile-username">${info.fullname}</div>
                <div class="profile-email">${info.email}</div>
            </div>
        </div>
    `;
        this.body.append(html);
    }
    render_menu_list() {
    let ul = $('<ul class="profile-menu"></ul>');

    this.nav_items.forEach(item => {

        // --- Skip hidden or invalid items ---
        if (!item) return;

        // ✔ Condition check (same as Jinja)
        let condition = true;
        if (item.condition) {
            try {
                condition = eval(item.condition); 
            } catch (e) {
                condition = false;
            }
        }
        if (!condition || item.hidden) return;

        // --- Separator Case ---
        if (item.item_type === "separator") {
            ul.append(`<li class="pm-separator"></li>`);
            return;
        }
        if (!item.item_label && !item.route && !item.action) return;
        let li = $(`
            <li class="pm-item">
                <span class="pm-label">${__(item.item_label)}</span>
            </li>
        `);
        li.on("click", (e) => {
            e.stopPropagation();
            if (item.route) {
            	window.location.href=item.route;
                return;
            }
            if (item.action) {
                try {
                    let fn = new Function(item.action); // Convert string to function
                    fn();
                } catch (err) {
                    console.error("Invalid action:", item.action);
                }
                return;
            }
        });

        ul.append(li);
    });

    this.body.append(ul);
}
    handle_action(item) {
        if (!item.action) return;

        try {
            eval(item.action);
        } catch (e) {
            console.warn("Invalid Action:", item.action);
        }
    }
    setup_dropdown_events() {
		this.dropdownbtn.on("show.bs.dropdown hide.bs.dropdown", (e) => {
			return false;
		});
		this.dropdownbtn.on("click", (e) => {
			e.preventDefault();
	        e.stopPropagation();
	        $("#profile-overlay").addClass("show");
	        $("#user-profile-sidebar").addClass("open");
		});
		$("#profile-overlay, .profile-close").on("click", () => {
	        $("#profile-overlay").removeClass("show");
	        $("#user-profile-sidebar").removeClass("open");
	    });
	}
}