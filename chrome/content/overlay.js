/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

if(!justoff) var justoff = {};

window.addEventListener("load", function buildL4E()
{
	window.removeEventListener("load", buildL4E, false);

	Components.utils.import("resource://location4evar/Location4Evar.jsm");

	justoff.status4evar = new Location4Evar(window, gBrowser, gNavToolbox);
	justoff.status4evar.setup();
}, false);

