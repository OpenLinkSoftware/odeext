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

function createRedirectUrl(curUrl) 
{
  var handle_url = getItem('extensions.ode.handle.url','http://linkeddata.uriburner.com/describe?url=');
  var mode = getItem('extensions.ode.handle.mode','describe');

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
      var ep = getItem("extensions.ode.sparqlgenendpoint", "http://linkeddata.uriburner.com/sparql");
      var vt = getItem("extensions.ode.viewertype","builtin");
      var rp = getItem("extensions.ode.proxygenendpoint","http://linkeddata.uriburner.com/about?url=");
      var ps = getItem("extensions.ode.proxyservice","virtuoso")

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

function onBeforeRequestLocal(d) 
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
        var mode = getItem('extensions.ode.handle.mode','describe');
        if (mode === 'ode_local') {

          var rc = null;
          try {
            rc = _rb[d.requestId];
          }catch(e) {}

          if (rc != null)
            return;

          var url = createRedirectUrl(d.url);
          if (url!=null) {
            _rb[d.requestId] = true;
            return {redirectUrl: url};
          } else {
            return { cancel: false };
          }
        }
    }
}


/****
function onBeforeRequestHttp(d) 
{
    var handle = false;

    if ((file_types & FILE_RDF)!=0 && d.url.match(/(.rdf)$/i))
      handle = true;
    else if ((file_types & FILE_TTL)!=0 && d.url.match(/(.ttl)$/i))
      handle = true;
    else if ((file_types & FILE_N3)!=0 && d.url.match(/(.n3)$/i))
      handle = true;

//    console.log(d);
//    if (d.url.match(/(.n3|.rdf|.ttl)$/i)) 
    if (handle) {
    {
      var rc = null;
      try {
        rc = _rb[d.requestId];
      }catch(e) {}

      if (rc != null)
        return

      var url = createRedirectUrl(d.url);
      if (url!=null) 
      {
        _rb[d.requestId] = true;
        return {redirectUrl: url};
      } else {
        return { cancel: false };
      }
    }
}
****/



/* responses */

var _r = {};
var _rb = {};

var mime_types = 0;
var file_types = 0;

const MIME_RDF = 1;
const MIME_TTL = 2;
const MIME_N3  = 4;

const FILE_RDF = 1;
const FILE_TTL = 2;
const FILE_N3  = 4;


function finish(d) {
    if (_r[d.requestId] == true) {

        var url;

        delete _r[d.requestId];

        var url = createRedirectUrl(d.url);

        if (url != null) {
          Browser.api.tabs.update(d.tabId, { url: url });
          return { cancel: true };
        } else {
          return { cancel: false };
        }
    }
}


function onHeadersReceived(d) {
//console.log(d);
    var rc = null;
    try {
      rc = _rb[d.requestId];
    }catch(e) {}

    if (rc != null)
      return;

    var found = false;
    for (var i in d.responseHeaders) {
        var header = d.responseHeaders[i];
        var handle = false;

        if (header.name && header.name.match(/content-type/i)) {
          if ((mime_types & MIME_RDF)!=0 && header.value.match(/\/(rdf)/))
            handle = true;
          else if ((mime_types & MIME_TTL)!=0 && header.value.match(/\/(turtle)/))
            handle = true;
          else if ((mime_types & MIME_N3)!=0 && header.value.match(/\/(n3)/))
            handle = true;
        }

//        if (header.name && header.name.match(/content-type/i)
//                        && header.value.match(/\/(n3|rdf|turtle)/))
        if (handle)
          {
            _r[d.requestId] = true;
            found = true;
          }
    }
    if (found)
      return finish(d);
}

function onErrorOccurred(d) { 
    delete _rb[d.requestId];
    return finish(d); 
}

function onCompleted(d) { 
    delete _rb[d.requestId];
}


(function setup(api) {
  try {

   if (getItem ("extension.ode.handle.rdf.mime")=="1")
     mime_types |= MIME_RDF;
   if (getItem ("extension.ode.handle.ttl.mime")=="1")
     mime_types |= MIME_TTL;
   if (getItem ("extension.ode.handle.n3.mime")=="1")
     mime_types |= MIME_N3;

/***
   if (getItem ("extension.ode.handle.rdf.file")=="1")
     file_types |= FILE_RDF;
   if (getItem ("extension.ode.handle.ttl.file")=="1")
     file_types |= FILE_TTL;
   if (getItem ("extension.ode.handle.n3.file")=="1")
     file_types |= FILE_N3;
***/    
    var reqFile = ["file:///*"];
    var reqUrls = ["http://*/*", "https://*/*"];

    api.onCompleted.addListener (onCompleted, {types: ['main_frame'], urls: ["<all_urls>"]});
    api.onErrorOccurred.addListener(onErrorOccurred, {types: ['main_frame'], urls: ["<all_urls>"]});

    api.onBeforeRequest.addListener(onBeforeRequestLocal, {types: ["main_frame"], urls: reqFile}, ["blocking"]);
//    api.onBeforeRequest.addListener(onBeforeRequestHttp, {types: ["main_frame"], urls: reqUrls}, ["blocking"]);

    api.onHeadersReceived.addListener(  onHeadersReceived,   {types: ["main_frame"], urls: reqUrls}, ["responseHeaders", "blocking"]);

  } catch(e) {
    console.log(e);
  }
})(Browser.api.webRequest);


Browser.api.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
//    console.log(sender.tab ? "from a content script:"+sender.tab.url : "from the extension");
    if (request.ode_settings == "changed")
    {
      if (getItem ("extension.ode.handle.rdf.mime")=="1")
        mime_types |= MIME_RDF;
      if (getItem ("extension.ode.handle.ttl.mime")=="1")
        mime_types |= MIME_TTL;
      if (getItem ("extension.ode.handle.n3.mime")=="1")
        mime_types |= MIME_N3;
    }
  });