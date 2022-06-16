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

(function () {

 var pref = new Settings();

  async function createRedirectUrl(curUrl) 
  {
    var handle_url = await pref.getValue('extensions.ode.handle.url');
    var mode = await pref.getValue('extensions.ode.handle.mode');

    switch(mode) {
      case 'describe':
      case 'describe-ssl':
        return handle_url + encodeURIComponent(curUrl);

      case 'about':
      case 'about-ssl':
        var result = curUrl.match(/^((\w+):\/)?\/?(.*)$/);
        if (!result) {
          throw 'Invalid url:\n' + curUrl;
          return null;
        }
//      var protocol = result[2]=="https"?"http":result[2];
        var protocol = result[2];
        return handle_url + protocol + '/' + result[3];

      case 'ode':
      case 'ode-ssl':
        return handle_url + encodeURIComponent(curUrl);

      case 'ode_local':
        var ep = await pref.getValue("extensions.ode.sparqlgenendpoint");
        var vt = await pref.getValue("extensions.ode.viewertype");
        var rp = await pref.getValue("extensions.ode.proxygenendpoint");
        var ps = await pref.getValue("extensions.ode.proxyservice");

        return Browser.api.extension.getURL("lib/ode/index.html?ep="+ep+
      		"&vt="+vt+
      		"&rp="+rp+
      		"&ps="+ps+
      		"&view="+encodeURIComponent(curUrl));

      default:
        //url = 'view-source:'+d.url;
        return null;
    }
    return null;
  }


//////////////// MIME HANDLER //////////
/* requests */

  Browser.api.webRequest.onBeforeRequest.addListener(
       onBeforeRequestLocal, 
       {types: ["main_frame"], urls: ["file:///*"]}, 
       ["blocking"]);

  async function onBeforeRequestLocal(d) 
  {
    var handle = false;

/**
    if ((file_types & FILE_RDF)!=0 && d.url.match(/(.rdf)$/i))
      handle = true;
    else if ((file_types & FILE_TTL)!=0 && d.url.match(/(.ttl)$/i))
      handle = true;
    else if ((file_types & FILE_N3)!=0 && d.url.match(/(.n3)$/i))
      handle = true;
**/
    if ((mime_types & MIME_RDF)!=0 && d.url.match(/(.rdf)$/i))
      handle = true;
    else if ((mime_types & MIME_TTL)!=0 && d.url.match(/(.ttl)$/i))
      handle = true;
    else if ((mime_types & MIME_N3)!=0 && d.url.match(/(.n3)$/i))
      handle = true;

//    console.log(d);
//    if (d.url.match(/(.n3|.rdf|.ttl)$/i)) {
    if (handle) {
      var mode = await pref.getValue('extensions.ode.handle.mode');
      if (mode === 'ode_local') {

        var _url = await createRedirectUrl(d.url);
        if (_url != null) {
          if (Browser.is_ff) {
            Browser.api.tabs.update(d.tabId, { url: _url });
//don't show save dialog      
            return { cancel: true };
          }
          else {
            Browser.api.tabs.update(d.tabId, { url: _url });
            return { cancel: true };
          }
        }
      }
    }
  }





/* responses */

var mime_types = 0;
var file_types = 0;

const MIME_RDF = 1;
const MIME_TTL = 2;
const MIME_N3  = 4;

const FILE_RDF = 1;
const FILE_TTL = 2;
const FILE_N3  = 4;


  Browser.api.webRequest.onHeadersReceived.addListener(
  	onHeadersReceived, 
  	  {types: ["main_frame"], urls: ["<all_urls>"]}, 
  	  ["responseHeaders", "blocking"]);

  async function onHeadersReceived(d) 
  {
  //console.log(d);
    if (d.method && d.method!=='GET')
      return;

    var headerContent = null;
    for (var header of d.responseHeaders) {
      if (header.name && header.name.match(/^content-type/i)) {
        headerContent = header;
        contentType = header.value;
        break;
      }
    }
    
    var handle = false;
    var type = null;

    if (headerContent) {
      if ((mime_types & MIME_RDF)!=0 && headerContent.value.match(/\/(rdf)/)) {
        handle = true;
        type = 'rdf';
      }
      else if ((mime_types & MIME_TTL)!=0 && headerContent.value.match(/\/(turtle)/)) {
        handle = true;
        type = 'turtle';
      }
      else if ((mime_types & MIME_N3)!=0 && headerContent.value.match(/\/(n3)/)) {
        handle = true;
        type = 'n3';
      }
    }

    if (handle)  {
      var _url = await createRedirectUrl(d.url);

      if (_url != null) {
        if (Browser.is_ff) {
          Browser.api.tabs.update(d.tabId, { url: _url });
//don't show save dialog      
          return { cancel: true };
        }
        else {
          Browser.api.tabs.update(d.tabId, { url: _url });
          return { cancel: true };
        }
      }
    }
  }




  Browser.api.runtime.onMessage.addListener(
    async function(request, sender, sendResponse) {
      if (request.ode_settings == "changed")
      {
        var pref = new Settings();
        mime_type = 0;

        var v = await pref.getValue ("extension.ode.handle.rdf.mime");
        if (v==="1")
          mime_types |= MIME_RDF;

        v = await pref.getValue ("extension.ode.handle.ttl.mime");
        if (v==="1")
          mime_types |= MIME_TTL;

        v = await pref.getValue ("extension.ode.handle.n3.mime");
        if (v==="1")
          mime_types |= MIME_N3;
      }
    });


  async function init() 
  {

    try {
      mime_type = 0;

      var v = await pref.getValue ("extension.ode.handle.rdf.mime");
      if (v==="1")
        mime_types |= MIME_RDF;

      v = await pref.getValue ("extension.ode.handle.ttl.mime");
      if (v==="1")
        mime_types |= MIME_TTL;

      v = await pref.getValue ("extension.ode.handle.n3.mime");
      if (v==="1")
        mime_types |= MIME_N3;

/***
   if (getItem ("extension.ode.handle.rdf.file")=="1")
     file_types |= FILE_RDF;
   if (getItem ("extension.ode.handle.ttl.file")=="1")
     file_types |= FILE_TTL;
   if (getItem ("extension.ode.handle.n3.file")=="1")
     file_types |= FILE_N3;
***/    
    } catch(e) {
      console.log(e);
    }

  }

  init();

})();
