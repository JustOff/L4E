/*
 * ***** BEGIN LICENSE BLOCK *****
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * 
 * Copyright (C) 2010, 2012, 2014 Matthew Turnbull <sparky@bluefang-logic.com>. All Rights Reserved.
 * 
 * ***** END LICENSE BLOCK *****
*/

if(!justoff) var justoff = {};

window.addEventListener("load", function buildS4E()
{
	window.removeEventListener("load", buildS4E, false);

	Components.utils.import("resource://location4evar/Location4Evar.jsm");

	justoff.status4evar = new Location4Evar(window, gBrowser, gNavToolbox);
	justoff.status4evar.setup();
}, false);

