frappe.provide("frappe.language_switcher");

frappe.language_switcher = {
	init: function () {
		// Add language switcher icon to navbar
		if(frappe.boot.enable_language_switcher){
			this.create_language_switcher();
			this.bind_events();
		}
		
	},

	create_language_switcher: function () {
		let seleclable = frappe.get_languages().find((x)=> x.value == frappe.boot.lang).label;
		const navbar_right = $(".body-sidebar .body-sidebar-bottom");
		const language_switcher = $(`
			<ul class="navbar-nav mb-3">
            <li class="nav-item dropdown language_switcher_knk_theme dropdown-help dropdown-mobile d-none d-lg-block">
                <button class="btn-reset nav-link" data-toggle="dropdown" aria-controls="language_dropdown" aria-label="Language Dropdown" aria-expanded="false">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#857d7d" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" data-lucide="languages" class="lucide lucide-languages stroke-[1] h-[15px] w-[15px]"><path d="m5 8 6 6"></path><path d="m4 14 6-6 2-3"></path><path d="M2 5h12"></path><path d="M7 2h1"></path><path d="m22 22-5-10-5 10"></path><path d="M14 18h6"></path></svg> 
					<span id="lang_badge" class="text-xs font-semibold tracking-wide">${frappe.boot.lang}</span>
                </button>       
                <div class="dropdown-menu dropdown-menu-right" id="languages_dropdown" role="menu">        
               		
                </div>
            </li>
            </ul>
        `);

		navbar_right.prepend(language_switcher);

		// Fetch and populate languages
		this.populate_languages();
	},

	populate_languages: async function () {

		const languages = frappe.boot.theme_lanagues || [];
		const dropdown_content = $("#languages_dropdown");

		for (const lang of languages) {
			const is_active = lang.name === frappe.boot.lang;
			const lang_item = $(`
                <a class="dropdown-item language-switcher" href="javascript:;" data-lang_code="${lang.name}">
                    ${lang.language_name}
					${is_active ? `
		               <span class="lang-check pull-right">
		                   <svg class="es-icon icon-sm text-primary">
		                       <use href="#es-line-check"></use>
		                   </svg>
		               </span>
		           ` : ""}
                </a>
            `);

			dropdown_content.prepend(lang_item);
		}
	},

	bind_events: function () {
		const me = this;

		// Handle language selection
		$(document).on("click", ".language-switcher", function () {
			const lang_code = $(this).data("lang_code");
			me.change_language(lang_code);
		});
	},

	change_language: async (lang_code) => {
		try {
			// Update the user's default language
			const userResponse = await frappe.call({
				method: "frappe.client.set_value",
				args: {
					doctype: "User",
					name: frappe.session.user,
					fieldname: "language",
					value: lang_code,
				},
				freaze: true,
				message: __("Updating user language..."),
			});

			// Reload the page to apply the new language
			if (!userResponse.message) {
				frappe.show_alert({
					message: __("Failed to update user language"),
					indicator: "red",
				});
				return;
			}
			frappe.show_alert({
				message: __("User language updated successfully."),
				indicator: "green",
			});

			frappe.ui.toolbar.clear_cache();
		} catch (error) {
			console.error("Error changing language:", error);
		}
	},
};

// Initialize the language switcher when Frappe is ready
$(document).ready(function () {
	if(frappe.boot.enable_language_switcher){
			frappe.language_switcher.init();
	}
});
