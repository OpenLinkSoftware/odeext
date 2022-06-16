/*
 *  This file is part of the OpenLink Data Explorer
 *
 *  Copyright (C) 2015-2021 OpenLink Software
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

class Settings {
  constructor(data) {
  }


  async _syncAll()
  {
    for(var i=0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      var val = localStorage.getItem(key);
      if (key.startsWith('ext.'))
        await this._setItem(key, val);
    }
  }


  async _getItem0(id)
  {
    if (Browser.is_ff) {
      return Browser.api.storage.local.get(id);
    }
    else 
      return new Promise((resolve, reject) => {
         Browser.api.storage.local.get(id, (rec) => {
           resolve(rec);
         });
        
      })
  }

  async _getItem(id)
  {
    if (!Browser.is_safari) {
      var rec = await this._getItem0('data_moved');
      if (!rec['data_moved']) {
        await this._syncAll();
        await this._setItem('data_moved','1');
      }
    }

    var rec = await this._getItem0(id);
    return rec[id];
  }

  async _setItem(id, val)
  {
    var rec = {};
    rec[id] = val;
    if (Browser.is_ff)
      return Browser.api.storage.local.set(rec);
    else 
      return new Promise((resolve, reject) => {
         Browser.api.storage.local.set(rec, () => {
           resolve();
         });
        
      })
  }


  async getValue(id)
  {
    var val = null;

    try {
      val = await this._getItem(id);

      if (val===undefined)
        val = null;
    } catch(e) {
      console.log(e);
    }

    if (val!==null)
      return val;

    switch(id) {
      case "extensions.ode.handle.url":
          val = "http://linkeddata.uriburner.com/describe?url=";
          break;
      case "extensions.ode.handle.mode":
          val = "describe";
          break;
      case "extensions.ode.viewertype":
          val = "builtin";
          break;
      case "extensions.ode.sparqlgenendpoint":
          val = "http://linkeddata.uriburner.com/sparql";
          break;
      case "extensions.ode.proxygenendpoint":
          val = "http://linkeddata.uriburner.com/about?url=";
          break;
      case "extensions.ode.proxyservice":
          val = "virtuoso";
          break;
      case "extensions.ode.headers":
          val = "[]";
          break;
      case "extensions.ode.openingbehavior":
          val = "add";
          break;
      case "extensions.ode.viewerendpoint":
          val = "";
          break;
      case "extensions.ode.proxyhost":
          val = "linkeddata.uriburner.com";
          break;
      case "extensions.ode.proxyport":
          val = "";
          break;
      case "extensions.ode.proxyservice":
          val = "virtuoso";
          break;
      case "extensions.ode.proxycustendpoint":
          val = "http://linkeddata.uriburner.com/about?uri=";
          break;
    }

    return val;
  }


  async setValue(id, val)
  {
    try {
      await this._setItem(id, val);
    } catch(e) {
      console.log(e);
    }
  }




}




