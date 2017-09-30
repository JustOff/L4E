/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const EXPORTED_SYMBOLS = ["Location4Evar"];

const CC = Components.classes;
const CI = Components.interfaces;
const CU = Components.utils;

const s4e_service = CC["@off.justoff/location4evar;1"].getService(CI.nsILocation4Evar);
//const uuidService = CC["@mozilla.org/uuid-generator;1"].getService(CI.nsIUUIDGenerator);

CU.import("resource://gre/modules/Services.jsm");
CU.import("resource://gre/modules/XPCOMUtils.jsm");
CU.import("resource://gre/modules/AddonManager.jsm");

CU.import("resource://location4evar/Status.jsm");
CU.import("resource://location4evar/Progress.jsm");

function Location4Evar(window, gBrowser, toolbox)
{
//	this._id = uuidService.generateUUID();
	this._window = window;
	this._toolbox = toolbox;

	this.getters = new S4EWindowGetters(this._window);
	this.statusService = new S4EStatusService(this._window, s4e_service, this.getters);
	this.progressMeter = new S4EProgressService(gBrowser, s4e_service, this.getters, this.statusService);
	this.sizeModeService = new SizeModeService(this._window, this);

	this._window.addEventListener("unload", this, false);
}

Location4Evar.prototype =
{
//	_id: null,
	_window:  null,
	_toolbox: null,

	getters:         null,
	statusService:   null,
	progressMeter:   null,
	sizeModeService: null,

	setup: function()
	{
		if(Services.vc.compare("28.*", Services.appinfo.version) >= 0)
		{
			this._toolbox.addEventListener("beforecustomization", this, false);
			this._toolbox.addEventListener("aftercustomization", this, false);
		}

		this.updateWindow();

		// OMFG HAX! If a page is already loading, fake a network start event
		if(this._window.XULBrowserWindow._busyUI)
		{
			let nsIWPL = CI.nsIWebProgressListener;
			this.progressMeter.onStateChange(0, null, nsIWPL.STATE_START | nsIWPL.STATE_IS_NETWORK, 0);
		}
	},

	destroy: function()
	{
		this._window.removeEventListener("unload", this, false);
		if(Services.vc.compare("28.*", Services.appinfo.version) >= 0)
		{
			this._toolbox.removeEventListener("aftercustomization", this, false);
			this._toolbox.removeEventListener("beforecustomization", this, false);
		}

		this.getters.destroy();
		this.statusService.destroy();
		this.progressMeter.destroy();
		this.sizeModeService.destroy();

		["_window", "_toolbox", "getters", "statusService",
		"progressMeter", "sizeModeService"].forEach(function(prop)
		{
			delete this[prop];
		}, this);
	},

	handleEvent: function(aEvent)
	{
		switch(aEvent.type)
		{
			case "unload":
				this.destroy();
				break;
			case "beforecustomization":
				this.beforeCustomization();
				break;
			case "aftercustomization":
				this.updateWindow();
				break;
		}
	},

	beforeCustomization: function()
	{
//		Services.console.logStringMessage("L4E Calling beforeCustomization: " + this._id);

		this.statusService.setNoUpdate(true);
		let status_label = this.getters.statusWidgetLabel;
		if(status_label)
		{
			status_label.value = this.getters.strings.getString("statusText");
		}
	},

	updateWindow: function()
	{
//		Services.console.logStringMessage("L4E Calling updateWindow: " + this._id);

		this.statusService.setNoUpdate(false);
		this.getters.resetGetters();
		this.statusService.buildTextOrder();
		this.statusService.buildBinding();

		s4e_service.updateWindow(this._window);
		// This also handles the following:
		// * buildTextOrder()
		// * updateStatusField(true)
	},

	launchOptions: function(currentWindow)
	{
		AddonManager.getAddonByID("location4evar@Off.JustOff", function(aAddon)
		{
			let optionsURL = aAddon.optionsURL;
			let windows = Services.wm.getEnumerator(null);
			while (windows.hasMoreElements())
			{
				let win = windows.getNext();
				if (win.document.documentURI == optionsURL)
				{
					win.focus();
					return;
				}
			}

			let features = "chrome,titlebar,toolbar,centerscreen";
			try
			{
				let instantApply = Services.prefs.getBoolPref("browser.preferences.instantApply");
				features += instantApply ? ",dialog=no" : ",modal";
			}
			catch(e)
			{
				features += ",modal";
			}
			currentWindow.openDialog(optionsURL, "", features);
		});
	}

};

function S4EWindowGetters(window)
{
	this._window = window;
}

S4EWindowGetters.prototype =
{
	_window:    null,
	_getterMap:
		[
			["addonbar",               "addon-bar"],
			["browserBottomBox",       "browser-bottombox"],
			["statusBar",              "status4evar-status-bar"],
			["statusWidget",           "status4evar-status-widget"],
			["statusWidgetLabel",      "status4evar-status-text"],
			["strings",                "bundle_location4evar"],
			["throbberProgress",       "status4evar-throbber-widget"],
			["toolbarProgress",        "status4evar-progress-bar"],
			["urlbarProgress",         "urlbar-progress-alt"]
		],

	resetGetters: function()
	{
		let document = this._window.document;

		this._getterMap.forEach(function(getter)
		{
			let [prop, id] = getter;
			delete this[prop];
			this.__defineGetter__(prop, function()
			{
				delete this[prop];
				return this[prop] = document.getElementById(id);
			});
		}, this);

		delete this.urlbar;
		this.__defineGetter__("urlbar", function()
		{
			let ub = document.getElementById("urlbar");
			if(!ub)
			{
				return null;
			}

			["setStatus", "setStatusType", "updateOverLinkLayout"].forEach(function(func)
			{
				if(!(func in ub))
				{
					ub[func] = function() {};
				}
			});

			delete this.urlbar;
			return this.urlbar = ub;
		});

		delete this.statusOverlay;
		this.__defineGetter__("statusOverlay", function()
		{
			let so = this._window.XULBrowserWindow.statusTextField;
			if(!so)
			{
				return null;
			}

			delete this.statusOverlay;
			return this.statusOverlay = so;
		});
	},

	destroy: function()
	{
		this._getterMap.forEach(function(getter)
		{
			let [prop, id] = getter;
			delete this[prop];
		}, this);

		["urlbar", "statusOverlay", "statusOverlay", "_window"].forEach(function(prop)
		{
			delete this[prop];
		}, this);
	}
};

function SizeModeService(window, s4e)
{
	this._window = window;
	this._s4e = s4e;

	this.lastFullScreen = this._window.fullScreen;
	this._window.addEventListener("sizemodechange", this, false);
}

SizeModeService.prototype =
{
	_window:         null,
	_s4e:            null,

	lastFullScreen:  null,

	destroy: function()
	{
		this._window.removeEventListener("sizemodechange", this, false);

		["_window", "_s4e"].forEach(function(prop)
		{
			delete this[prop];
		}, this);
	},

	handleEvent: function(e)
	{
		if(this._window.fullScreen != this.lastFullScreen)
		{
			this.lastFullScreen = this._window.fullScreen;
			this._s4e.statusService.updateFullScreen();
		}
	},

	QueryInterface: XPCOMUtils.generateQI([ CI.nsIDOMEventListener ])
};
