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

var pref = null;

$(function() {
  init();
});

async function init()
{
  pref = new Settings();
  
  DOM.iSel("c_year").innerText = new Date().getFullYear();
  DOM.iSel('ext_ver').innerText = 'Version: '+ Browser.api.runtime.getManifest().version;

  // Tabs
  $('#tabs').tabs();

  loadPref();

  DOM.qSel('#ode-prefs-viewer').onchange = (e) => {
      setTimeout(enableCtrls, 200);
  }

  DOM.qSel('#ode-prefs-proxyservice').onchange = (e) => {
      setTimeout(change_proxyservice, 200);
  }

  DOM.qSel('#ode-prefs-sparql-type').onchange = (e) => {
      setTimeout(change_sparql_type, 200);
  }

  DOM.qSel('#ode-prefs-handle-mode').onchange = (e) => {
      setTimeout(enableCtrls,200);
  }

  DOM.qSel('#OK_btn').onclick = () => { savePref(); }
  DOM.qSel('#Cancel_btn').onclick = () => { window.close(); }

  DOM.qSel('#ode-pref-proxy-set-def').onclick = () => { setProxyDefaults(); }
  DOM.qSel('#ode-prefs-sparql-set-def').onclick = () => { setSparqlDefaults(); }
  DOM.qSel('#ode-pref-handle-set-def').onclick = () => { setHandleDefaults(); }

  DOM.qSel('#hdr_add').onclick = () =>{ hdr_add() };
  $('#hdr_add').button({
          icons: { primary: 'ui-icon-plusthick' },
          text: false
  });

  DOM.qSel('#ode-site').onclick = () => { Browser.openTab('http://ode.openlinksw.com'); }

  enableCtrls();
}

function createHdrRow(row)
{
  if (!row)
    return;
  var del = '<button id="hdr_del" class="hdr_del">'
           +' <input type="image" src="minus.png" width="12" height="12">'  
           +'</button>';
  return '<tr><td width="16px">'+del+'</td>'
        +'<td ><input style="WIDTH: 98%" id="h" value="'+row.header+'"></td>'
        +'<td ><input style="WIDTH: 98%" id="v" value="'+row.value+'"></td>'
        +'</tr>';

}

function addHdrItem(v)
{
  var tbody = DOM.qSel('#hdr_tbl tbody')
  var r = tbody.insertRow(-1);
  r.innerHTML = createHdrRow(v);
  r.querySelector('.hdr_del').onclick = (ev) => {
     var row = ev.target.closest('tr');
     row.remove();
    };
}


function emptyHdrLst()
{
  var tbody = DOM.qSel('#hdr_tbl tbody')
  tbody.innerHTML = ''
}

function hdr_add() {
    addHdrItem({hdr:"", val:""});
}


function load_hdr_list(params)
{
  emptyHdrLst();

  for(var i=0; i<params.length; i++) {
    addHdrItem(params[i]);
  }

  if (params.length == 0)
    hdr_add();
}

function save_hdr_list()
{
  var list = [];
  var tbody = DOM.qSel('#hdr_tbl tbody')
  var rows = tbody.querySelectorAll('tr');
  for(var i=0; i < rows.length; i++) {
    var r = rows[i];

    var h = r.querySelector('#h').value;
    var v = r.querySelector('#v').value;
    if (h.length>0 && v.length>0)
       list.push({header:h, value:v});
  }

  pref.setValue('extension.ode.headers', JSON.stringify(list, undefined, 2));
}



function setSparqlDefaults() 
{
    DOM.qSel('#ode-prefs-sparql-host').value = 'linkeddata.uriburner.com';
    DOM.qSel('#ode-prefs-sparql-port').value = '80';
    enableCtrls();
};



function setProxyDefaults() 
{
    DOM.qSel('#ode-prefs-proxy-host').value = 'linkeddata.uriburner.com';
    DOM.qSel('#ode-prefs-proxy-port').value = '80';
    enableCtrls();
};


function setHandleDefaults() 
{
    DOM.qSel('#ode-rdf-mime').checked = false;
    DOM.qSel('#ode-ttl-mime').checked = false;
    DOM.qSel('#ode-n3-mime').checked = false;

    DOM.qSel('#ode-prefs-handle-mode').value = 'describe';
    var url = new URL(DOM.qSel('#ode-prefs-handle-url').value.trim());
    url.protocol = 'http:';
    url.hostname = 'linkeddata.uriburner.com';
    DOM.qSel('#ode-prefs-handle-url').value = url.toString();
    enableCtrls();
};



async function loadPref() 
{
    var viewertype        = await pref.getValue("extensions.ode.viewertype");
    var viewerendpoint    = await pref.getValue("extensions.ode.viewerendpoint");

    if (viewertype)
        DOM.qSel('#ode-prefs-viewer').value = viewertype;
    if (viewerendpoint)
        DOM.qSel('#ode-prefs-viewer-custom-url').value = viewerendpoint;

    var openingbehavior = await pref.getValue("extensions.ode.openingbehavior");
    if (openingbehavior) {
        DOM.qSel('#ode-prefs-opening-add').checked = false;
        DOM.qSel('#ode-prefs-opening-replace').checked = false;
        DOM.qSel('#ode-prefs-opening-new').checkd = false;
        DOM.qSel('#ode-prefs-opening-'+openingbehavior).checked = false;
    }

    var sparqltype         = await pref.getValue("extensions.ode.sparqltype");
    var sparqlhost         = await pref.getValue("extensions.ode.sparqlhost");
    var sparqlport         = await pref.getValue("extensions.ode.sparqlport");

    var sparqlgenendpoint  = await pref.getValue("extensions.ode.sparqlgenendpoint");
    var sparqlcustendpoint = await pref.getValue("extensions.ode.sparqlcustendpoint");

    if (sparqltype)
        DOM.qSel('#ode-prefs-sparql-type').value = sparqltype;
         
    if (sparqlhost)
        DOM.qSel('#ode-prefs-sparql-host').value = sparqlhost;
    if (sparqlport)
        DOM.qSel('#ode-prefs-sparql-port').value = sparqlport;
    if (sparqlcustendpoint)
        DOM.qSel('#ode-prefs-sparql-cust-url').value = sparqlcustendpoint;

    var proxyservice      = await pref.getValue("extensions.ode.proxyservice"); // type of service

    var proxyhost         = await pref.getValue("extensions.ode.proxyhost");
    var proxyport         = await pref.getValue("extensions.ode.proxyport");
    var proxygenendpoint  = await pref.getValue("extensions.ode.proxygenendpoint");

    var proxycustendpoint = await pref.getValue("extensions.ode.proxycustendpoint");

    if (proxyservice)
        DOM.qSel('#ode-prefs-proxyservice').value = proxyservice;

    if (proxyhost)
        DOM.qSel('#ode-prefs-proxy-host').value = proxyhost;
    if (proxyport)
        DOM.qSel('#ode-prefs-proxy-port').value = proxyport;
    if (proxycustendpoint)
        DOM.qSel('#ode-prefs-proxy-custom-url').value = proxycustendpoint;

    var handle_url = await pref.getValue("extensions.ode.handle.url");
    var handle_mode = await pref.getValue("extensions.ode.handle.mode"); 

    if (handle_mode)
        DOM.qSel('#ode-prefs-handle-mode').value = handle_mode;

    if (handle_url)
        DOM.qSel('#ode-prefs-handle-url').value = handle_url;

    var v = await pref.getValue("extension.ode.handle.rdf.mime");
    DOM.qSel('#ode-rdf-mime').checked = (v === '1');

    v = await pref.getValue("extension.ode.handle.ttl.mime");
    DOM.qSel('#ode-ttl-mime').checked = (v === '1');

    v = await pref.getValue("extension.ode.handle.n3.mime");
    DOM.qSel('#ode-n3-mime').checked = (v === '1');

    var hdr_list = [];
    try {
      var v = await pref.getValue("extension.ode.headers");
      if (v)
        hdr_list = JSON.parse(v);
    } catch(e) {}

    load_hdr_list(hdr_list);
}  



async function savePref() 
{
   var viewer_endpoints = ['http://linkeddata.uriburner.com/ode/?uri[]=', 
			    'http://dataviewer.zitgist.com/?uri=',
			    'http://beckr.org/marbles?uri=',
			    'http://www4.wiwiss.fu-berlin.de/rdf_browser/?browse_uri=',
			    'http://dig.csail.mit.edu/2005/ajar/release/tabulator/0.8/tab.html?uri='];

   var _e = DOM.qSel('#ode-prefs-viewer option:checked').value;
   await pref.setValue("extensions.ode.viewertype", _e);

   if (_e != 'custom') 
      await pref.setValue("extensions.ode.viewerendpoint", viewer_endpoints[$('#ode-prefs-viewer')[0].selectedIndex]);
   else
      await pref.setValue("extensions.ode.viewerendpoint", $('#ode-prefs-viewer-custom-url').val());

   await pref.setValue("extensions.ode.openingbehavior", $('#ode-prefs-opening input:checked').val());

   // SPARQL Endpoint

   await pref.setValue("extensions.ode.sparqltype", DOM.qSel('#ode-prefs-sparql-type option:checked').value);

   var _s_host = DOM.qSel('#ode-prefs-sparql-host').value.trim();
   var _s_port = DOM.qSel('#ode-prefs-sparql-port').value.trim();

   await pref.setValue("extensions.ode.sparqlhost", _s_host);
   await pref.setValue("extensions.ode.sparqlport", _s_port);

   var _gen_ep;
   var _sparql_type = DOM.qSel('#ode-prefs-sparql-type option:checked').value;

   if (_sparql_type != 'custom') 
   {
      var is_ssl = (_sparql_type==='vistuoso-ssl'?true:false);

      _gen_ep = (is_ssl?"https://":"http://") + _s_host;
      if (_s_port != '')
	    _gen_ep += ":" + _s_port;

      _gen_ep += "/sparql";
   } 
   else 
   {
      _gen_ep = DOM.qSel('#ode-prefs-sparql-cust-url').value;
   }	

   await pref.setValue("extensions.ode.sparqlgenendpoint", _gen_ep);
   await pref.setValue("extensions.ode.sparqlcustendpoint", DOM.qSel('#ode-prefs-sparql-cust-url').value);

   // Proxy

   await pref.setValue ("extensions.ode.proxyservice", DOM.qSel('#ode-prefs-proxyservice option:checked').value);

   var _p_host = DOM.qSel('#ode-prefs-proxy-host').value.trim();
   var _p_port = DOM.qSel('#ode-prefs-proxy-port').value.trim();

   await pref.setValue ("extensions.ode.proxyhost", _p_host);
   await pref.setValue ("extensions.ode.proxyport", _p_port);

   var _gen_p_ep;
   var _proxyservice = DOM.qSel('#ode-prefs-proxyservice option:checked').value;

   switch (_proxyservice) {
       case 'virt_simple':
	  if (_p_port != '') 
	      _gen_p_ep = 'http://' + _p_host + ':' + _p_port + '/about/rdf/';
	  else 
	      _gen_p_ep =  'http://' + _p_host + '/about/rdf/';
	  break;
       case 'virtuoso':
	  if (_p_port != '')
	      _gen_p_ep = 'http://' + _p_host + ':' + _p_port + '/about/?url=';
	  else 
	      _gen_p_ep = 'http://' + _p_host + '/about/?url=';
	  break;
       case 'virtuoso-ssl':
	  if (_p_port != '')
	      _gen_p_ep = 'https://' + _p_host + ':' + _p_port + '/about/?url=';
	  else 
	      _gen_p_ep = 'https://' + _p_host + '/about/?url=';
	  break;
       case 'triplr':
	  _gen_p_ep = 'http://triplr.org/rdf/';
 	  break;
       case 'custom':
	  _gen_p_ep = DOM.qSel('#ode-prefs-proxy-custom-url').value;
   }

   await pref.setValue ("extensions.ode.proxygenendpoint", _gen_p_ep);
   await pref.setValue ("extensions.ode.proxycustendpoint", DOM.qSel('#ode-prefs-proxy-custom-url').value);

   var _handle_mode = DOM.qSel('#ode-prefs-handle-mode option:checked').value;
   await pref.setValue ("extensions.ode.handle.mode", _handle_mode);


   var url = new URL(DOM.qSel('#ode-prefs-handle-url').value.trim());
   var h_url = createHandlerURL(_handle_mode, url);

   await pref.setValue ("extensions.ode.handle.url", h_url);

   await pref.setValue ("extension.ode.handle.rdf.mime", DOM.qSel('#ode-rdf-mime').checked?"1":"0");
   await pref.setValue ("extension.ode.handle.ttl.mime", DOM.qSel('#ode-ttl-mime').checked?"1":"0");
   await pref.setValue ("extension.ode.handle.n3.mime",  DOM.qSel('#ode-n3-mime').checked?"1":"0");

   save_hdr_list();

   Browser.api.runtime.sendMessage({ode_settings: "changed"});

   close();
}



function change_proxyservice()
{
    switch (DOM.qSel('#ode-prefs-proxyservice option:checked').value)
    {
      case 'virtuoso':
        DOM.qSel('#ode-prefs-proxy-port').value = '80';
	break;
      case 'virtuoso-ssl':
        DOM.qSel('#ode-prefs-proxy-port').value = '443';
	break;
    }
    enableCtrls();
}

function change_sparql_type()
{
    switch (DOM.qSel('#ode-prefs-sparql-type option:checked').value)
    {
      case 'virtuoso':
        DOM.qSel('#ode-prefs-sparql-port').value = '80';
        break;
      case 'virtuoso-ssl':
        DOM.qSel('#ode-prefs-sparql-port').value = '443';
	break;
    }
    enableCtrls();
}



function enableCtrls() 
{
    $('#ode-prefs-opening').hide(); //must be disabled
    $('#ode-prefs-opening-label').hide(); //must be disabled
    $('#ode-prefs-viewer-custom-url-bcast').hide();

    $('#ode-prefs-sparql-host').attr('disabled', true);
    $('#ode-prefs-sparql-port').attr('disabled', true);
    $('#ode-prefs-sparql-type').attr('disabled', true);
    $('#ode-prefs-sparql-set-def').attr('disabled', true);
    $('#ode-prefs-sparql-custom-url-bcast').hide();
    $('#ode-prefs-proxy-custom-url-bcast').hide();

    switch(DOM.qSel('#ode-prefs-viewer option:checked').value)
    {
      case 'builtin':
        $('#ode-prefs-opening').show(); //must be enabled
        $('#ode-prefs-opening-label').show(); //must be enabled
        $('#ode-prefs-sparql-host').removeAttr('disabled');
        $('#ode-prefs-sparql-port').removeAttr('disabled');
        $('#ode-prefs-sparql-type').removeAttr('disabled');
        $('#ode-prefs-sparql-set-def').removeAttr('disabled');

        var _p_port = DOM.qSel('#ode-prefs-sparql-port').value.trim();	

        switch (DOM.qSel('#ode-prefs-sparql-type option:checked').value)
        {
	  case 'virtuoso':
	    //document.getElementById('ode-prefs-sparql-endpoint-hostport-bcast').removeAttribute('hidden');
            $('#ode-prefs-sparql-host-r').show();
            $('#ode-prefs-sparql-port-r').show();
	    $('#ode-prefs-sparql-custom-url-bcast').hide();
	    if (_p_port === "443")
              DOM.qSel('#ode-prefs-sparql-port').value = '80';
	    break;
	  case 'virtuoso-ssl':
	    //document.getElementById('ode-prefs-sparql-endpoint-hostport-bcast').removeAttribute('hidden');
            $('#ode-prefs-sparql-host-r').show();
            $('#ode-prefs-sparql-port-r').show();
	    $('#ode-prefs-sparql-custom-url-bcast').hide();
	    if (_p_port === "80")
              DOM.qSel('#ode-prefs-sparql-port').value = '443';
	    break;
	  case 'custom':
            $('#ode-prefs-sparql-host-r').hide();
            $('#ode-prefs-sparql-port-r').hide();
	    $('#ode-prefs-sparql-custom-url-bcast').show();
	    break;
	}
        break;

      case 'custom':
        $('#ode-prefs-opening').hide(); //must be disabled
        $('#ode-prefs-opening-label').hide(); //must be disabled
	$('#ode-prefs-viewer-custom-url-bcast').show();
	break;
    };

    var _p_port = DOM.qSel('#ode-prefs-proxy-port').value.trim();	

    switch (DOM.qSel('#ode-prefs-proxyservice option:checked').value)
    {
      case 'virtuoso':
        $('#ode-prefs-proxy-host').removeAttr('disabled');
        $('#ode-prefs-proxy-port').removeAttr('disabled');
        $('#ode-prefs-proxy-host-r').show();
        $('#ode-prefs-proxy-port-r').show();
	$('#ode-prefs-proxy-custom-url-bcast').hide();
	if (_p_port === "443")
          DOM.qSel('#ode-prefs-proxy-port').value = '80';
	break;
      case 'virtuoso-ssl':
        $('#ode-prefs-proxy-host').removeAttr('disabled');
        $('#ode-prefs-proxy-port').removeAttr('disabled');
        $('#ode-prefs-proxy-host-r').show();
        $('#ode-prefs-proxy-port-r').show();
	$('#ode-prefs-proxy-custom-url-bcast').hide();
	if (_p_port === "80")
          DOM.qSel('#ode-prefs-proxy-port').value = '443';
	break;
	//    case 'virt-simple':
	//	document.getElementById('ode-prefs-proxy-endpoint-hostport-bcast').removeAttribute('disabled'); 
	//	document.getElementById('ode-prefs-proxy-endpoint-hostport-bcast').removeAttribute('hidden'); 
	//	document.getElementById('ode-prefs-proxy-custom-url-bcast').setAttribute('hidden', true);
	//	break;
      case 'triplr':
        $('#ode-prefs-proxy-host-r').show();
        $('#ode-prefs-proxy-port-r').show();
        $('#ode-prefs-proxy-host').attr('disabled', true);
        $('#ode-prefs-proxy-port').attr('disabled', true);
	$('#ode-prefs-proxy-custom-url-bcast').hide();
        break;
      case 'custom':
        $('#ode-prefs-proxy-host-r').hide();
        $('#ode-prefs-proxy-port-r').hide();
	$('#ode-prefs-proxy-custom-url-bcast').show();
	break;
    }

    var url = new URL(DOM.qSel('#ode-prefs-handle-url').value.trim());
    var mode = DOM.qSel('#ode-prefs-handle-mode option:checked').value;
    var h_url = createHandlerURL(mode, url);

    switch (mode) {
      case 'describe':
	$('#ode-prefs-handle-url-bcast').show();
        DOM.qSel('#ode-prefs-handle-url').value = h_url;
        break;
      case 'describe-ssl':
	$('#ode-prefs-handle-url-bcast').show();
        DOM.qSel('#ode-prefs-handle-url').value = h_url;
        break;
      case 'about':
	$('#ode-prefs-handle-url-bcast').show();
        DOM.qSel('#ode-prefs-handle-url').value = h_url;
        break;
      case 'about-ssl':
	$('#ode-prefs-handle-url-bcast').show();
        DOM.qSel('#ode-prefs-handle-url').value = h_url;
        break;
      case 'ode':
	$('#ode-prefs-handle-url-bcast').show();
        DOM.qSel('#ode-prefs-handle-url').value = h_url;
        break;
      case 'ode-ssl':
	$('#ode-prefs-handle-url-bcast').show();
        DOM.qSel('#ode-prefs-handle-url').value = h_url;
        break;
      case 'ode_local':
	$('#ode-prefs-handle-url-bcast').hide();
//        h_url = 'chrome://ode/content/ode/index.html?view=';
        break;
      case 'none':
	$('#ode-prefs-handle-url-bcast').hide();
//	h_url = 'view-source:';
        break;
    }

};


function createHandlerURL(mode, url) 
{
    var h_url = "";

    switch (mode) {
      case 'describe':
        url.protocol = 'http:';
        url.path = '/describe/';
        url.search = '?url=';
        url.hash = ''; 
        h_url = url.toString();
        break;
      case 'describe-ssl':
        url.protocol = 'https:';
        url.path = '/describe/';
        url.search = '?url=';
        url.hash = ''; 
        h_url = url.toString();
        break;
      case 'about':
        url.protocol = 'http:';
        url.path = '/about/html/';
        url.search = '';
        url.hash = ''; 
        h_url = url.toString();
        break;
      case 'about-ssl':
        url.protocol = 'https:';
        url.path = '/about/html/';
        url.search = '';
        url.hash = ''; 
        h_url = url.toString();
        break;
      case 'ode':
        url.protocol = 'http:';
        url.path = '/ode/';
        url.search = '?uri=';
        url.hash = ''; 
        h_url = url.toString();
        break;
      case 'ode-ssl':
        url.protocol = 'https:';
        url.path = '/ode/';
        url.search = '?uri=';
        url.hash = ''; 
        h_url = url.toString();
        break;
      case 'ode_local':
        break;
      case 'none':
        break;
    }
    return h_url;
};


