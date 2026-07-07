let collapsed = $state(false);
let mobileOpen = $state(false);

export const sidebar = {
	get collapsed() {
		return collapsed;
	},
	get mobileOpen() {
		return mobileOpen;
	},
	toggle() {
		collapsed = !collapsed;
	},
	setCollapsed(v: boolean) {
		collapsed = v;
	},
	openMobile() {
		mobileOpen = true;
	},
	closeMobile() {
		mobileOpen = false;
	}
};
