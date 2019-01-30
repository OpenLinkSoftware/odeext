/*
 *  This file is part of the OpenLink Data Explorer
 *
 *  Copyright (C) 2015-2019 OpenLink Software
 *
 *  This project is free software; you can redistribute it and/or modify it
 *  under the terms of the GNU General Public License as published by the
 *  Free Software Foundation; only version 2 of the License, dated June 1991.
 *
 *  This program is distributed in the hope that it will be useful, but
 *  WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 *  General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License along
 *  with this program; if not, write to the Free Software Foundation, Inc.,
 *  51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA
 *
 */

var Browser = {
    isChromeAPI: true,

    isChromeWebExt: true,
    isFirefoxWebExt: false,
    isEdgeWebExt: false,

    api: null,

    openTab : function(uri, tab_index) {
      if (Browser.isEdgeWebExt) {
        if (tab_index!==undefined) 
          return Browser.api.tabs.create({url:uri, index:tab_index+1 });
        else
          Browser.api.tabs.getCurrent(
            function(tab) {
              if (tab!==undefined)
                return Browser.api.tabs.create({url:uri, index:tab.index+1 });
              else
                return Browser.api.tabs.create({url:uri});
            }
          )
      }else
        return window.open(uri);
    },

    backgroundOpenTab : function(uri, tab_index) {
      if (tab_index!==undefined) 
        return Browser.api.tabs.create({url:uri, index:tab_index+1 });
      else
        Browser.api.tabs.getCurrent(
          function(tab) {
            if (tab!==undefined)
              return Browser.api.tabs.create({url:uri, index:tab.index+1 });
            else
              return Browser.api.tabs.create({url:uri});
          }
        )
    }

}

try {
  Browser.api = (Browser.isChromeAPI && Browser.isChromeWebExt) ? chrome : browser;
} catch(e) {}
