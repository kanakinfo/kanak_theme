(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __publicField = (obj, key, value) => {
    __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
    return value;
  };

  // ../kanak_theme/kanak_theme/public/js/profile.js
  var require_profile = __commonJS({
    "../kanak_theme/kanak_theme/public/js/profile.js"(exports, module) {
      frappe.provide("frappe.search");
      frappe.ui.UserProfileInfo = class UserProfileInfo {
        constructor() {
          var _a2;
          this.sidebar = $("#user-profile-sidebar");
          this.overlay = $("#profile-overlay");
          this.body = this.sidebar.find(".profile-sidebar-body");
          this.nav_items = ((_a2 = frappe.boot.navbar_settings) == null ? void 0 : _a2.settings_dropdown) || [];
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
          this.nav_items.forEach((item) => {
            if (!item)
              return;
            let condition = true;
            if (item.condition) {
              try {
                condition = eval(item.condition);
              } catch (e) {
                condition = false;
              }
            }
            if (!condition || item.hidden)
              return;
            if (item.item_type === "separator") {
              ul.append(`<li class="pm-separator"></li>`);
              return;
            }
            if (!item.item_label && !item.route && !item.action)
              return;
            let li = $(`
            <li class="pm-item">
                <span class="pm-label">${__(item.item_label)}</span>
            </li>
        `);
            li.on("click", (e) => {
              e.stopPropagation();
              if (item.route) {
                window.location.href = item.route;
                return;
              }
              if (item.action) {
                try {
                  let fn = new Function(item.action);
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
          if (!item.action)
            return;
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
      };
    }
  });

  // ../kanak_theme/kanak_theme/public/js/notification.js
  frappe.provide("frappe.search");
  frappe.ui.CustomNotifications = class CustomNotifications {
    constructor() {
      this.tabs = {};
      this.notification_settings = frappe.boot.notification_settings;
      this.make();
    }
    make() {
      this.dropdownbtn = $(".navbar").find(".dropdown-notifications").removeClass("hidden");
      this.dropdown = $("#notif-sidebar");
      this.dropdown_list = this.dropdown.find(".notifications-list");
      this.header_items = this.dropdown_list.find(".header-items");
      this.header_actions = this.dropdown_list.find(".header-actions");
      this.body = this.dropdown_list.find(".notification-list-body");
      this.panel_events = this.dropdown_list.find(".panel-events");
      this.panel_notifications = this.dropdown_list.find(".panel-notifications");
      this.panel_changelog_feed = this.dropdown_list.find(".panel-changelog-feed");
      this.user = frappe.session.user;
      this.setup_headers();
      this.setup_dropdown_events();
    }
    setup_headers() {
      $(`<span class="notification-settings pull-right" data-action="go_to_settings">
			${frappe.utils.icon("setting-gear")}
		</span>`).on("click", (e) => {
        e.stopImmediatePropagation();
        $("#notif-overlay").removeClass("show");
        $("#notif-sidebar").removeClass("open");
        frappe.set_route("Form", "Notification Settings", frappe.session.user);
      }).appendTo(this.header_actions).attr("title", __("Notification Settings")).tooltip({ delay: { show: 600, hide: 100 }, trigger: "hover" });
      $(`<span class="mark-all-read pull-right" data-action="mark_all_as_read">
			${frappe.utils.icon("mark-as-read")}
		</span>`).on("click", (e) => this.mark_all_as_read(e)).appendTo(this.header_actions).attr("title", __("Mark all as read")).tooltip({ delay: { show: 600, hide: 100 }, trigger: "hover" });
      this.categories = [
        {
          label: __("Notifications"),
          id: "notifications",
          view: NotificationsView,
          el: this.panel_notifications
        },
        {
          label: __("Events"),
          id: "todays_events",
          view: EventsView,
          el: this.panel_events
        },
        {
          label: __("What's New"),
          id: "changelog_feed",
          view: ChangelogFeedView,
          el: this.panel_changelog_feed
        }
      ];
      let get_headers_html = (item2) => {
        let active = item2.id == "notifications" ? "active" : "";
        return `<li class="notifications-category ${active}"
   					id="${item2.id}"
   					data-toggle="collapse"
   				>${item2.label}</li>`;
      };
      let navitem = $(`<ul class="notification-item-tabs nav nav-tabs" role="tablist"></ul>`);
      this.categories = this.categories.map((item2) => {
        item2.$tab = $(get_headers_html(item2));
        item2.$tab.on("click", (e) => {
          e.stopImmediatePropagation();
          this.switch_tab(item2);
        });
        navitem.append(item2.$tab);
        return item2;
      });
      navitem.appendTo(this.header_items);
      this.categories.forEach((category) => {
        this.make_tab_view(category);
      });
      this.switch_tab(this.categories[0]);
    }
    switch_tab(item2) {
      this.categories.forEach((item3) => {
        item3.$tab.removeClass("active");
      });
      item2.$tab.addClass("active");
      Object.keys(this.tabs).forEach((tab_name) => this.tabs[tab_name].hide());
      this.tabs[item2.id].show();
    }
    make_tab_view(item2) {
      let tabView = new item2.view(item2.el, this.dropdown, this.notification_settings);
      this.tabs[item2.id] = tabView;
    }
    mark_all_as_read(e) {
      e.stopImmediatePropagation();
      this.dropdown_list.find(".unread").removeClass("unread");
      frappe.call("frappe.desk.doctype.notification_log.notification_log.mark_all_as_read");
    }
    setup_dropdown_events() {
      this.dropdownbtn.on("show.bs.dropdown hide.bs.dropdown", (e) => {
        return false;
      });
      this.dropdownbtn.on("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        $("#notif-overlay").addClass("show");
        $("#notif-sidebar").addClass("open");
      });
      $("#notif-overlay, .notif-close").on("click", () => {
        $("#notif-overlay").removeClass("show");
        $("#notif-sidebar").removeClass("open");
      });
    }
  };
  var BaseNotificationsView = class {
    constructor(wrapper, parent, settings) {
      this.wrapper = wrapper;
      this.parent = parent;
      this.settings = settings;
      this.max_length = 20;
      this.container = $(`<div></div>`).appendTo(this.wrapper);
      this.make();
    }
    show() {
      this.container.show();
    }
    hide() {
      this.container.hide();
    }
  };
  var NotificationsView = class extends BaseNotificationsView {
    make() {
      this.notifications_icon = this.parent.find(".notifications-icon");
      this.notifications_icon.attr("title", __("Notifications")).tooltip({ delay: { show: 600, hide: 100 }, trigger: "hover" });
      this.setup_notification_listeners();
      this.get_notifications_list(this.max_length).then((r) => {
        if (!r.message)
          return;
        this.dropdown_items = r.message.notification_logs;
        frappe.update_user_info(r.message.user_info);
        this.render_notifications_dropdown();
        if (this.settings.seen == 0 && this.dropdown_items.length > 0) {
          this.toggle_notification_icon(false);
        }
      });
    }
    update_dropdown() {
      this.get_notifications_list(1).then((r) => {
        if (!r.message)
          return;
        let new_item = r.message.notification_logs[0];
        frappe.update_user_info(r.message.user_info);
        this.dropdown_items.unshift(new_item);
        if (this.dropdown_items.length > this.max_length) {
          this.container.find(".recent-notification").last().remove();
          this.dropdown_items.pop();
        }
        this.insert_into_dropdown();
      });
    }
    change_activity_status() {
      if (this.container.find(".activity-status")) {
        this.container.find(".activity-status").replaceWith(
          `<a class="recent-item text-center text-muted"
					href="/app/List/Notification Log">
					<div class="full-log-btn">${__("View Full Log")}</div>
				</a>`
        );
      }
    }
    mark_as_read(docname, $el) {
      frappe.call("frappe.desk.doctype.notification_log.notification_log.mark_as_read", {
        docname
      }).then(() => {
        $el.removeClass("unread");
      });
    }
    insert_into_dropdown() {
      let new_item = this.dropdown_items[0];
      let new_item_html = this.get_dropdown_item_html(new_item);
      $(new_item_html).prependTo(this.container);
      this.change_activity_status();
    }
    get_dropdown_item_html(notification_log) {
      let doc_link = this.get_item_link(notification_log);
      let read_class = notification_log.read ? "" : "unread";
      let message = notification_log.subject;
      let title = message.match(/<b class="subject-title">(.*?)<\/b>/);
      message = title ? message.replace(title[1], frappe.ellipsis(strip_html(title[1]), 100)) : message;
      let timestamp = frappe.datetime.comment_when(notification_log.creation);
      let message_html = `<div class="message">
			<div>${message}</div>
			<div class="notification-timestamp text-muted">
				${timestamp}
			</div>
		</div>`;
      let user = notification_log.from_user;
      let user_avatar = frappe.avatar(user, "avatar-medium user-avatar");
      let item_html = $(`<a class="recent-item notification-item ${read_class}"
				href="${doc_link}"
				data-name="${notification_log.name}"
			>
				<div class="notification-body">
					${user_avatar}
					${message_html}
				</div>
				<div class="mark-as-read" title="${__("Mark as Read")}">
				</div>
			</a>`);
      if (!notification_log.read) {
        let mark_btn = item_html.find(".mark-as-read");
        mark_btn.tooltip({ delay: { show: 600, hide: 100 }, trigger: "hover" });
        mark_btn.on("click", (e) => {
          e.preventDefault();
          e.stopImmediatePropagation();
          this.mark_as_read(notification_log.name, item_html);
        });
      }
      item_html.on("click", () => {
        !notification_log.read && this.mark_as_read(notification_log.name, item_html);
        this.notifications_icon.trigger("click");
      });
      return item_html;
    }
    render_notifications_dropdown() {
      if (this.settings && !this.settings.enabled) {
        this.container.html(`<li class="recent-item notification-item">
				<span class="text-muted">
					${__("Notifications Disabled")}
				</span></li>`);
      } else {
        if (this.dropdown_items.length) {
          this.container.empty();
          this.dropdown_items.forEach((notification_log) => {
            this.container.append(this.get_dropdown_item_html(notification_log));
          });
          this.container.append(`<a class="list-footer"
					href="/app/List/Notification Log">
						<div class="full-log-btn">${__("See all Activity")}</div>
					</a>`);
        } else {
          this.container.append(
            $(`<div class="notification-null-state">
					<div class="text-center">
						<img src="/assets/frappe/images/ui-states/notification-empty-state.svg" alt="Generic Empty State" class="null-state">
						<div class="title">${__("No New notifications")}</div>
						<div class="subtitle">
							${__("Looks like you haven\u2019t received any notifications.")}
					</div></div></div>`)
          );
        }
      }
    }
    get_notifications_list(limit) {
      return frappe.call(
        "frappe.desk.doctype.notification_log.notification_log.get_notification_logs",
        { limit }
      );
    }
    get_item_link(notification_doc) {
      if (notification_doc.link) {
        return notification_doc.link;
      }
      const link_doctype = notification_doc.document_type ? notification_doc.document_type : "Notification Log";
      const link_docname = notification_doc.document_name ? notification_doc.document_name : notification_doc.name;
      return frappe.utils.get_form_link(link_doctype, link_docname);
    }
    toggle_notification_icon(seen) {
      this.notifications_icon.find(".notifications-seen").toggle(seen);
      this.notifications_icon.find(".notifications-unseen").toggle(!seen);
    }
    toggle_seen(flag) {
      frappe.call(
        "frappe.desk.doctype.notification_settings.notification_settings.set_seen_value",
        {
          value: cint(flag),
          user: frappe.session.user
        }
      );
    }
    setup_notification_listeners() {
      frappe.realtime.on("notification", () => {
        this.toggle_notification_icon(false);
        this.update_dropdown();
      });
      frappe.realtime.on("indicator_hide", () => {
        this.toggle_notification_icon(true);
      });
      this.parent.on("show.bs.dropdown", () => {
        this.toggle_seen(true);
        if (this.notifications_icon.find(".notifications-unseen").is(":visible")) {
          this.toggle_notification_icon(true);
          frappe.call(
            "frappe.desk.doctype.notification_log.notification_log.trigger_indicator_hide"
          );
        }
      });
    }
  };
  var EventsView = class extends BaseNotificationsView {
    make() {
      let today = frappe.datetime.get_today();
      frappe.call({
        method: "frappe.desk.doctype.event.event.get_events",
        args: {
          start: today,
          end: today
        },
        type: "GET",
        callback: ({ message }) => {
          this.render_events_html(message);
        }
      });
    }
    render_events_html(event_list) {
      let html = "";
      if (event_list.length) {
        let get_event_html = (event) => {
          let time = __("All Day");
          if (!event.all_day) {
            let start_time = frappe.datetime.get_time(event.starts_on);
            let days_diff = frappe.datetime.get_day_diff(event.ends_on, event.starts_on);
            let end_time = frappe.datetime.get_time(event.ends_on);
            if (days_diff > 1) {
              end_time = __("Rest of the day");
            }
            time = `${start_time} - ${end_time}`;
          }
          let particpants = "";
          if (event.particpants) {
            particpants = frappe.avatar_group(event.particpants, 3);
          }
          let location2 = "";
          if (event.location) {
            location2 = `, ${event.location}`;
          }
          return `<a class="recent-item event" href="/app/event/${event.name}">
					<div class="event-border" style="border-color: ${event.color}"></div>
					<div class="event-item">
						<div class="event-subject">${event.subject}</div>
						<div class="event-time">${time}${location2}</div>
						${particpants}
					</div>
				</a>`;
        };
        html = event_list.map(get_event_html).join("");
      } else {
        html = `
				<div class="notification-null-state">
					<div class="text-center">
					<img src="/assets/frappe/images/ui-states/event-empty-state.svg" alt="Generic Empty State" class="null-state">
					<div class="title">${__("No Upcoming Events")}</div>
					<div class="subtitle">
						${__("There are no upcoming events for you.")}
				</div></div></div>
			`;
      }
      this.container.html(html);
    }
  };
  var ChangelogFeedView = class extends BaseNotificationsView {
    make() {
      this.render_changelog_feed_html(frappe.boot.changelog_feed || []);
    }
    render_changelog_feed_html(changelog_feed) {
      let html = "";
      if (changelog_feed.length) {
        this.container.empty();
        const get_changelog_feed_html = (changelog_feed_item) => {
          const timestamp = frappe.datetime.prettyDate(
            changelog_feed_item.posting_timestamp
          );
          const message_html = `<div class="message">
							<div>${changelog_feed_item.title}</div>
							<div class="notification-timestamp text-muted">
							${changelog_feed_item.app_title} | ${timestamp}
							</div>
						</div>`;
          const item_html = `<a class="recent-item notification-item"
								href="${changelog_feed_item.link}"
								data-name="${changelog_feed_item.title}"
								target="_blank" rel="noopener noreferrer"
							>
							<div class="notification-body">
								${message_html}
							</div>
							</div>
						</a>`;
          return item_html;
        };
        html = changelog_feed.map(get_changelog_feed_html).join("");
      } else {
        html = `<div class="notification-null-state">
						<div class="text-center">
							<img src="/assets/frappe/images/ui-states/notification-empty-state.svg" alt="Generic Empty State" class="null-state">
							<div class="title">${__("Nothing New")}</div>
							<div class="subtitle">
								${__("There is nothing new to show you right now.")}
							</div>
						</div>
					</div>
					`;
      }
      this.container.html(html);
    }
  };

  // ../kanak_theme/kanak_theme/public/js/kanak_theme.bundle.js
  var import_profile = __toESM(require_profile());

  // frappe-html:/Users/kanak/frappe/frappe-bench/apps/kanak_theme/kanak_theme/public/js/frappe/ui/toolbar/navbar.html
  frappe.templates["navbar"] = `<div class="sticky-top theme_header_cl container">
	<header class="navbar container navbar-expand" role="navigation">
		<div class="container">
			<ul class="nav navbar-nav">
				{% if frappe.boot.is_full_screen_menu %}
			    <div class="fs-menu-toggle">
			        <i class="fa fa-th"></i>
			    </div>
			    {% else %}
			      <button class="btn-reset sidebar-toggle-menu_btn" title="" aria-label="Toggle Sidebar" data-original-title="Toggle Sidebar">      
			      	<svg class="es-icon icon-md sidebar-toggle-placeholder">       
			      		<use href="#es-line-align-justify"></use>      
			      	</svg> 
			       </button>
			    {% endif %}
			</ul>
			<ul class="nav navbar-nav d-none d-sm-flex" id="navbar-breadcrumbs">
				
			</ul>
			<div class="collapse navbar-collapse justify-content-end">
				<form class="form-inline fill-width justify-content-end" role="search" onsubmit="return false;">
					{% if (frappe.boot.read_only) { %}
						<span class="indicator-pill yellow no-indicator-dot" title="{%= __("Your site is undergoing maintenance or being updated.") %}">
							{%= __("Read Only Mode") %}
						</span>
					{% } %}
					{% if (frappe.boot.user.impersonated_by) { %}
						<span class="indicator-pill red no-indicator-dot" title="{%= __("You are impersonating as another user.") %}">
							{%= __("Impersonating {0}", [frappe.boot.user.name]) %}
						</span>
					{% } %}
					<div class="input-group search-bar text-muted mx-auto hidden">
						<input
							id="navbar-search"
							type="text"
							class="form-control"
							placeholder="{%= __('Search or type a command ({0})', [frappe.utils.is_mac() ? '\u2318 + G' : 'Ctrl + G']) %}"
							aria-haspopup="true"
						>
						<span class="search-icon">
							<svg class="icon icon-sm"><use href="#icon-search"></use></svg>
						</span>
					</div>
				</form>
				<ul class="navbar-nav">
					<li class="nav-item dropdown dropdown-notifications dropdown-mobile hidden">
						<button
							class="btn-reset nav-link notifications-icon text-muted"
							data-toggle=""
							aria-haspopup="true"
							aria-expanded="false"
						>
							<span class="notifications-seen">
								<span class="sr-only">{{ __("No new notifications") }}</span>
								<svg class="es-icon icon-sm" style="stroke:none;"><use href="#es-line-notifications"></use></svg>
							</span>
							<span class="notifications-unseen">
								<span class="sr-only">{{ __("You have unseen notifications") }}</span>
								<svg class="es-icon icon-sm"><use href="#es-line-notifications-unseen"></use></svg>
							</span>
						</button>
					</li>
					<li class="nav-item dropdown dropdown-message dropdown-mobile hidden">
						<button
							class="btn-reset nav-link notifications-icon text-muted"
							data-toggle="dropdown"
							aria-haspopup="true"
							aria-expanded="true"
						>
							<span>
								<svg class="es-icon icon-sm"><use href="#es-line-chat-alt"></use></svg>
							</span>
						</button>
					</li>
					<li class="vertical-bar d-none d-sm-block"></li>
					<li class="nav-item dropdown dropdown-help dropdown-mobile d-none d-lg-block">
						<button
							class="btn-reset nav-link"
							data-toggle="dropdown"
							aria-controls="toolbar-help"
							aria-label="{{ __("Help Dropdown") }}"
						>
							<span>
								{{ __("Help") }}
								<svg class="es-icon icon-xs"><use href="#es-line-down"></use></svg>
							</span>
						</button>
						<div class="dropdown-menu dropdown-menu-right" id="toolbar-help" role="menu">
							<div id="help-links"></div>
							<div class="dropdown-divider documentation-links"></div>
							{% for item in navbar_settings.help_dropdown %}
								{% if (!item.hidden) { %}
									{% if (item.route) { %}
										<a class="dropdown-item" href="{{ item.route }}">
											{%= __(item.item_label) %}
										</a>
									{% } else if (item.action) { %}
										<button class="btn-reset dropdown-item" onclick="return {{ item.action }}">
											{%= __(item.item_label) %}
										</button>
									{% } else { %}
										<div class="dropdown-divider"></div>
									{% } %}
								{% } %}
							{% endfor %}
						</div>
					</li>
					<li class="nav-item dropdown dropdown-navbar-user dropdown-mobile">
						<button
							class="btn-reset nav-link"
							data-toggle="dropdown"
							aria-label="{{ __("User Menu") }}"
						>
							{{ avatar }}
						</button>
												<div class="dropdown-menu dropdown-menu-right" id="toolbar-user" role="menu">
							{% for item in navbar_settings.settings_dropdown %}
								{% var condition = item.condition ? eval(item.condition) : true %}
								{% if (condition && !item.hidden) { %}
									{% if (item.route) { %}
										<a class="dropdown-item" href="{{ item.route }}">
											{%= __(item.item_label) %}
										</a>
									{% } else if (item.action) { %}
										<button class="btn-reset dropdown-item" onclick="return {{ item.action }}">
											{%= __(item.item_label) %}
										</button>
									{% } else { %}
										<div class="dropdown-divider"></div>
									{% } %}
								{% } %}
							{% endfor %}
						</div>
					</li>
				</ul>
			</div>
		</div>
	</header>

	{% if !localStorage.getItem("dismissed_announcement_widget") && strip_html(navbar_settings.announcement_widget) != '' %}
	<div class="announcement-widget form-message p-2 m-0" style="position: relative; z-index: -1; border-radius: 0; background-color: var(--bg-blue);">
		<div class="container flex justify-between align-center mx-auto">
			{{ navbar_settings.announcement_widget }}
			<div class="close-message p-0 mr-2" style="position: relative;">
			{{ frappe.utils.icon("close") }}
			</div>
		</div>
	</div>
	{% endif %}

</div>
`;

  // ../kanak_theme/kanak_theme/public/js/lanaguage_switch.js
  frappe.provide("frappe.language_switcher");
  frappe.language_switcher = {
    init: function() {
      this.create_language_switcher();
      this.bind_events();
    },
    create_language_switcher: function() {
      let seleclable = frappe.get_languages().find((x) => x.value == frappe.boot.lang).label;
      const navbar_right = $("#navbar-breadcrumbs + .navbar-collapse .navbar-nav");
      const language_switcher = $(`
            <li class="nav-item dropdown language_switcher_knk_theme dropdown-help dropdown-mobile d-none d-lg-block">
                <button class="btn-reset nav-link" data-toggle="dropdown" aria-controls="language_dropdown" aria-label="Language Dropdown" aria-expanded="false">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#857d7d" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" data-lucide="languages" class="lucide lucide-languages stroke-[1] h-[15px] w-[15px]"><path d="m5 8 6 6"></path><path d="m4 14 6-6 2-3"></path><path d="M2 5h12"></path><path d="M7 2h1"></path><path d="m22 22-5-10-5 10"></path><path d="M14 18h6"></path></svg> 
					<span id="lang_badge" class="text-xs font-semibold tracking-wide">${frappe.boot.lang}</span>
                </button>       
                <div class="dropdown-menu dropdown-menu-right" id="languages_dropdown" role="menu">        
               		
                </div>
            </li>
        `);
      navbar_right.prepend(language_switcher);
      this.populate_languages();
    },
    populate_languages: async function() {
      await frappe.call({
        method: "frappe.client.get_list",
        args: {
          doctype: "Language",
          filters: {
            is_show_in_lang_switcher: 1
          },
          fields: ["name", "language_name"]
        },
        callback: (response) => {
          const languages = response.message || [];
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
        }
      });
    },
    bind_events: function() {
      const me = this;
      $(document).on("click", ".language-switcher", function() {
        const lang_code = $(this).data("lang_code");
        me.change_language(lang_code);
      });
    },
    change_language: async (lang_code) => {
      try {
        const userResponse = await frappe.call({
          method: "frappe.client.set_value",
          args: {
            doctype: "User",
            name: frappe.session.user,
            fieldname: "language",
            value: lang_code
          },
          freaze: true,
          message: __("Updating user language...")
        });
        if (!userResponse.message) {
          frappe.show_alert({
            message: __("Failed to update user language"),
            indicator: "red"
          });
          return;
        }
        frappe.show_alert({
          message: __("User language updated successfully."),
          indicator: "green"
        });
        frappe.ui.toolbar.clear_cache();
      } catch (error) {
        console.error("Error changing language:", error);
      }
    }
  };
  $(document).ready(function() {
    if (frappe.boot.enable_language_switcher) {
      frappe.language_switcher.init();
    }
  });

  // ../kanak_theme/kanak_theme/public/js/theme.js
  if (!window.frappe)
    window.frappe = {};
  frappe.provide("frappe.ui.form");
  frappe.provide("frappe.views");
  window.addEventListener("load", () => {
    setTimeout(() => {
      var _a2;
      (_a2 = document.getElementById("kanak_loading_overlay")) == null ? void 0 : _a2.classList.remove("active");
    }, 300);
  });
  frappe.after_ajax(() => {
    const sidebarEl = $(".sidebar.theme_sidebar");
    sidebarEl.off("mouseover.theme").on("mouseover.theme", () => {
      sidebarEl.removeClass("mpclose");
    });
    sidebarEl.off("mouseout.theme").on("mouseout.theme", () => {
      sidebarEl.addClass("mpclose");
    });
    $(document).off("click.theme", ".sidebar.theme_sidebar .arrow").on("click.theme", ".sidebar.theme_sidebar .arrow", function(e) {
      e.preventDefault();
      $(this).closest("li").toggleClass("showMenu");
    });
  });
  frappe.router.on("change", () => {
    const fsMenu = document.getElementById("full-screen-menu");
    if (fsMenu) {
      $(fsMenu).addClass("hidden");
    }
    const sidebarEl = $(".sidebar.theme_sidebar");
    if (sidebarEl) {
      $(sidebarEl).addClass("mpclose");
    }
  });
  frappe.provide("frappe.ui.toolbar");
  frappe.ui.toolbar.fullscreen_selected_parent = null;
  frappe.ui.toolbar.add_theme_menu_item = function() {
    frappe.call({
      method: "kanak_theme.kanak_theme.api.api.get_themes",
      callback: function(r) {
        if (!r.message)
          return;
        let themes = r.message;
        let html = `<ul class="themeswitcher">`;
        themes.forEach((theme) => {
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
          d.$wrapper.find(".js-themepicker-themeselect").on("click", function() {
            const theme_name = $(this).data("theme");
            apply_theme(theme_name);
            d.hide();
          });
        }, 200);
      }
    });
  };
  frappe.ui.toolbar.Toolbar.prototype.bind_full_screen_menu_events = function() {
    var self = this;
    const fsMenu = document.getElementById("full-screen-menu");
    const openBtn = document.querySelector(".fs-menu-toggle");
    if (fsMenu && openBtn) {
      const openBtn2 = document.querySelector(".fs-menu-toggle");
      if (openBtn2) {
        openBtn2.addEventListener("click", () => {
          if ($(fsMenu).hasClass("hidden")) {
            $(".kanak_theme_main_cl").addClass("openmegamenu_cl");
          } else {
            $(".kanak_theme_main_cl").removeClass("openmegamenu_cl");
          }
          $(fsMenu).toggleClass("hidden");
        });
      }
    }
    if (fsMenu) {
      $(fsMenu).on("click", ".fs-menu-item", function(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        const route = $(this).data("route").trim();
        if (!route)
          return;
        $(fsMenu).addClass("hidden");
        $(".kanak_theme_main_cl").removeClass("openmegamenu_cl");
        frappe.router.set_route(route);
      });
    }
    if ($(".sidebar-toggle-menu_btn").length) {
      $(".sidebar-toggle-menu_btn").on("click", function(ev) {
        $(".kanak_theme_main_cl .sidebar.theme_sidebar").toggleClass("mpclose");
      });
    }
  };
  frappe.ui.toolbar.Toolbar.prototype.setup_notifications = function() {
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
      callback: function() {
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
  var super_make_sidebar = frappe.views.Workspace.prototype.make_sidebar;
  frappe.views.Workspace.prototype.prepare_child_side_bar = function() {
    if (this.all_pages != void 0) {
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
        menus.forEach((slug) => {
          child_container.append(`
                        <div class="child-menu-item" data-slug="${slug}">
                            <span>${this.get_menu_label(slug)}</span>
                        </div>
                    `);
        });
        let current_slug = frappe.router.slug(menuname);
        child_container.find(`[data-slug="${current_slug}"]`).addClass("active");
        child_container.on("click", ".child-menu-item", (e) => {
          let item2 = $(e.currentTarget);
          let slug = $(e.currentTarget).data("slug");
          child_container.find(".child-menu-item").removeClass("active");
          item2.addClass("active");
          let is_private = this.is_private_workspace(slug);
          if (is_private) {
            frappe.set_route(`/private/${slug}`);
          } else {
            frappe.set_route(slug);
          }
        });
      }
    }
  };
  frappe.views.Workspace.prototype.get_menu_with_children = function(menu_name) {
    let all = frappe.boot.allowed_workspaces;
    let input_slug = frappe.router.slug(menu_name);
    let current = all.find((ws) => frappe.router.slug(ws.name) === input_slug);
    if (!current)
      return [];
    let parent_slug;
    if (current.parent_page) {
      parent_slug = frappe.router.slug(current.parent_page);
    } else {
      parent_slug = frappe.router.slug(current.name);
    }
    let children = all.filter((ws) => ws.parent_page && frappe.router.slug(ws.parent_page) === parent_slug).map((ws) => frappe.router.slug(ws.name));
    return [parent_slug, ...children];
  };
  frappe.views.Workspace.prototype.get_menu_label = function(slug) {
    let ws = frappe.boot.allowed_workspaces.find((w) => frappe.router.slug(w.name) === slug);
    return ws ? ws.label || ws.name : slug;
  };
  frappe.views.Workspace.prototype.is_private_workspace = function(slug) {
    let ws = frappe.boot.allowed_workspaces.find((w) => frappe.router.slug(w.name) === slug);
    return ws && ws.private ? true : false;
  };
  var super_show = frappe.views.Workspace.prototype.show;
  frappe.views.Workspace.prototype.show = function() {
    super_show.call(this);
    this.prepare_child_side_bar();
  };
  frappe.views.Workspace.prototype.make_sidebar = function() {
    super_make_sidebar.call(this);
    this.prepare_child_side_bar();
  };
  var _a;
  frappe.ui.form.ControlCheck = (_a = class extends frappe.ui.form.ControlData {
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
      $(this.label_area).off("click.toggle").on("click.toggle", () => {
        if (this.df.read_only || this.df.disabled)
          return;
        const newValue = !this.input.checked;
        this.input.checked = newValue;
        this.$input.trigger("change");
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
  }, __publicField(_a, "html_element", "input"), __publicField(_a, "input_type", "checkbox"), _a);
  var super_setup_list_wrapper = frappe.views.BaseList.prototype.setup_list_wrapper;
  frappe.views.BaseList.prototype.setup_list_wrapper = function() {
    this.$custom_filter_bar = $(`
            <div class="custom-filter-bar"></div>
        `).appendTo(this.page.main);
    super_setup_list_wrapper.call(this);
    this.setup_custom_filter_events();
  };
  frappe.views.BaseList.prototype.setup_custom_group_events = function() {
    let me = this;
    const super_refresh = this.refresh;
    this.refresh = function() {
      super_refresh.apply(this, arguments);
      me.render_levels();
    };
    this.render_levels();
  };
  frappe.views.BaseList.prototype.setup_custom_filter_events = function() {
    let me = this;
    const super_refresh = this.refresh;
    this.refresh = function() {
      super_refresh.apply(this, arguments);
      me.render_filter_tags();
    };
    this.render_filter_tags();
  };
  frappe.views.BaseList.prototype.render_filter_tags = function() {
    var _a2, _b;
    let me = this;
    if (!this.$custom_filter_bar)
      return;
    this.$custom_filter_bar.empty();
    let filters = (_b = (_a2 = this.filter_area) == null ? void 0 : _a2.filter_list) == null ? void 0 : _b.filters;
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
                <span class="remove-filter" data-filter-index="${i}">\xD7</span>
            </div>
        `);
      filter_tag.find(".remove-filter").on("click", (ev) => {
        let index = $(ev.currentTarget).data("filter-index");
        let flt = me.filter_area.filter_list.filters[index];
        if (!flt)
          return;
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
      let fields = this.meta.fields.filter(
        (df) => (df.reqd || df.allow_in_quick_entry) && !df.read_only && !df.is_virtual && df.fieldtype !== "Table" && !["Section Break", "Column Break", "Tab Break"].includes(df.fieldtype)
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
        fields,
        parent: form_container,
        doc: this.doc
      });
      this.fg.make();
      frappe.after_ajax(() => {
        fields.forEach((df) => {
          let field = this.fg.fields_dict[df.fieldname];
          if (field == null ? void 0 : field.set_value) {
            field.set_value(this.doc[df.fieldname]);
          }
        });
        let btns = document.createElement("div");
        btns.style.marginTop = "12px";
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
          if (!values)
            return;
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
          doc: Object.assign(this.doc, values)
        },
        freeze: true,
        callback(r) {
          me.wrapper.remove();
          frappe.show_alert("Updated successfully");
          me.refresh_list();
        }
      });
    }
    refresh_list() {
      if (cur_list)
        cur_list.refresh();
    }
  };
  function create_quick_element(doctype) {
    const quick = document.createElement("span");
    quick.classList.add("quick-action", "mr-1");
    quick.innerHTML = frappe.utils.icon("edit", "sm", "quick-icon");
    quick.dataset.doctype = doctype;
    return quick;
  }
  frappe.views.ListView.prototype.show_quick_form_under_row = function(row, docname) {
    this.$result.find(".quick-form-wrapper").remove();
    let container = $(`
        <div class="quick-form-wrapper">
        </div>
    `);
    row.after(container);
    let quick_form = new frappe.ui.form.QuickUpdateForm(this.doctype, docname, container[0]);
    quick_form.setup();
  };
  var super_render = frappe.views.ListView.prototype.render;
  frappe.views.ListView.prototype.render = function() {
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
  frappe.views.ListView.prototype.add_quick_icon_events = function() {
    let me = this;
    this.$result.find(".list-row").each(function() {
      let row = $(this);
      if (row.find(".quick-action").length)
        return;
      let quick_icon = $(me._element_factory.templates.quick).clone();
      row.find(".list-row-col:first .level-item:first").after(quick_icon);
      quick_icon.on("click", function(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        ev.stopImmediatePropagation();
        let docname = row.find(".list-row-checkbox").attr("data-name");
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
      frappe.show_alert("Theme Saved. Reloading\u2026");
      setTimeout(() => {
        window.location.reload();
      }, 600);
    }
  });
  var old_init = frappe.views.ListView.prototype.init;
  frappe.views.ListView.prototype.init = function() {
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
    fields.filter((df) => allowed_types.includes(df.fieldtype)).forEach((df) => {
      select.append(`<option value="${df.fieldname}">${df.label}</option>`);
    });
  };
  frappe.views.ListView.prototype.bind_group_by_events = function() {
    this.$group_by_panel.on("click", ".add-level", () => {
      let selected = this.$group_by_panel.find(".group-field").val();
      if (!selected)
        return;
      if (this.group_levels.includes(selected))
        return;
      this.group_levels.push(selected);
      this.render_levels();
      this.refresh_grouped_list();
    });
  };
  frappe.views.ListView.prototype.get_label_by_fieldname = function(fieldname) {
    const df = this.meta.fields.find((f) => f.fieldname === fieldname);
    return df ? df.label : fieldname;
  };
  frappe.views.ListView.prototype.render_levels = function() {
    const container = this.$page.find(".custom-group-bar");
    if (container.length) {
      let levelsdatas = this.group_levels ? this.group_levels.length : 0;
      container.empty();
      if (!levelsdatas) {
        this.$page.find(".custom-group-bar").hide();
        return;
      } else {
        this.$page.find(".custom-group-bar").show();
      }
    }
    this.group_levels.forEach((lvl, index) => {
      let label = this.get_label_by_fieldname(lvl);
      container.append(`
            <div class="group-custom-tag">
                <span class="group-label">${label}</span>
                <span class="remove-group" data-index="${index}">\xD7</span>
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
  frappe.views.ListView.prototype.refresh_grouped_list = function() {
    this.refresh();
  };
  var super_before_render = frappe.views.ListView.prototype.before_render;
  frappe.views.ListView.prototype.before_render = function() {
    super_before_render.call(this);
    if (this.view_name == "List") {
      const container = this.$page.find(".custom-group-bar");
      if (!container.length) {
        this.$group_filter_bar = $(`
            <div class="custom-group-bar"></div>
            `).prependTo(this.page.main);
        this.$page.find(".page-form").after(this.$group_filter_bar);
        this.setup_custom_group_events();
      }
      const xgroupbycontainer = this.$page.find(".group-by-panel");
      if (!xgroupbycontainer.length) {
        this.$group_by_panel = $(`
                <div class="group-by-panel">
                    <select class="group-field form-control" style="width:100px">
                    </select>
                    <button class="btn btn-sm btn-default add-level">+</button>
                </div>
            `);
        this.$group_by_panel.prependTo(this.$page.find(".page-form .filter-section"));
        this.render_group_by_options();
        this.bind_group_by_events();
      }
    } else {
      $(".custom-group-bar").remove();
      $(".group-by-panel").remove();
    }
  };
  frappe.views.ListView.prototype.get_group_by = function() {
    return this.group_levels.length ? this.group_levels.join(",") : null;
  };
  var old_get_call_args = frappe.views.ListView.prototype.get_call_args;
  frappe.views.ListView.prototype.get_call_args = function() {
    let args = old_get_call_args.call(this);
    if (args.args && args.args.view === "List") {
      if (this.group_levels.length) {
        args.args["group_by"] = this.group_levels.join(",");
      }
      args["method"] = "kanak_theme.kanak_theme.api.api.grouped_list";
    }
    return args;
  };
  var super_prepare_data = frappe.views.BaseList.prototype.prepare_data;
  frappe.views.BaseList.prototype.prepare_data = function(r) {
    let msg = r.message;
    if (msg.is_grouped) {
      this.is_grouped = true;
      this.group_data = msg.groups;
      return;
    } else {
      this.$result.empty();
      this.is_grouped = false;
    }
    super_prepare_data.call(this, r);
  };
  var old_render_list = frappe.views.ListView.prototype.render_list;
  frappe.views.ListView.prototype.render_list = function() {
    if (this.is_grouped) {
      this.render_grouped_list();
    } else {
      old_render_list.call(this);
    }
  };
  frappe.views.ListView.prototype.render_grouped_list = function() {
    this.$result.empty();
    if (!this.group_data || !this.group_data.length) {
      this.$result.append(`<div class="text-muted mt-4">No records found</div>`);
      return;
    }
    this.render_group_nodes(this.group_data, 0, this.$result);
  };
  frappe.views.ListView.prototype.render_group_nodes = function(nodes, level, container) {
    let me = this;
    nodes.forEach((node) => {
      let header = $(`
            <div class="group-header knk-group-header-cl group-level-${level}">
                <span class="arrow" style="margin-right:8px;">\u25B6</span>
                ${node.group} <span class="text-muted ml-2">(${node.total})</span>
            </div>
        `);
      container.append(header);
      let wrapper = $(`<div class="group-wrapper" style="display:none; margin-left:${20 + level * 15}px;"></div>`);
      container.append(wrapper);
      if (node.children.length && node.children[0].is_child_group) {
        this.render_group_nodes(node.children, level + 1, wrapper);
      } else {
        node.children.forEach((doc) => {
          wrapper.append(me.render_grouped_row(doc));
        });
      }
      header.on("click", function() {
        let arrow = $(this).find(".arrow");
        if (wrapper.is(":visible")) {
          wrapper.slideUp(120);
          arrow.text("\u25B6");
        } else {
          wrapper.slideDown(120);
          arrow.text("\u25BC");
        }
      });
    });
  };
  frappe.views.ListView.prototype.render_grouped_row = function(doc) {
    return this.get_list_row_html(doc);
  };
  var super_set_actions = frappe.widget.widget_factory.onboarding.prototype.set_actions;
  frappe.widget.widget_factory.onboarding.prototype.set_actions = function() {
    if (this.in_customize_mode)
      return;
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
})();
//# sourceMappingURL=kanak_theme.bundle.FLDW73SM.js.map
