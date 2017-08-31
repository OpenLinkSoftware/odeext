
$(function(){
	// Tabs
	$('#tabs').tabs();


        loadPref();

        $('#ode-prefs-viewer').change(function() {
            setTimeout(enableCtrls,200);
        });
        $('#ode-prefs-proxyservice').change(function() {
            setTimeout(change_proxyservice,200);
        });
        $('#ode-prefs-sparql-type').change(function() {
            setTimeout(change_sparql_type,200);
        });
        $('#ode-prefs-handle-mode').change(function() {
            setTimeout(enableCtrls,200);
        });

        $('#OK_btn').click(savePref);
        $('#Cancel_btn').click(function() { window.close(); });

        $('#ode-pref-proxy-set-def').click(setProxyDefaults);
        $('#ode-prefs-sparql-set-def').click(setSparqlDefaults);
        $('#ode-pref-handle-set-def').click(setHandleDefaults);

        $('#ode-site').click(function() { Browser.openTab('http://ode.openlinksw.com');});

        $('#ode-hdr-add').click(addHdr);
        $('#ode-hdr-del').click(delHdr);


        enableCtrls();
});


function createTblRow(h,v)
{
  return '<tr><td><input id="chk" type="checkbox"/></td>'
            +'<td><input id="h" value="'+h+'"></td>'
            +'<td><input id="v" value="'+v+'"></td></tr>';
}


function addHdr()
{
  $('#hdrs').append(createTblRow("",""));
}

function addHdr1(h,v)
{
  $('#hdrs').append(createTblRow(h, v));
}

function delHdr()
{
  var data = $('#hdrs>tr>td>#chk');
  for(var i=0; i < data.length; i++) {
    if (data[i].checked) {
      var tr = data[i].parentNode.parentNode;
      $(tr).remove();
    }
  }
  if ($('#hdrs>tr>td>#chk').length==0)
    addHdr();
}


function setSparqlDefaults() 
{
    $('#ode-prefs-sparql-host').val('linkeddata.uriburner.com');
    $('#ode-prefs-sparql-port').val('80');
    enableCtrls();
};



function setProxyDefaults() 
{
    $('#ode-prefs-proxy-host').val('linkeddata.uriburner.com');
    $('#ode-prefs-proxy-port').val('80');
    enableCtrls();
};


function setHandleDefaults() 
{
    $('#ode-rdf-mime').removeAttr('checked');
    $('#ode-ttl-mime').removeAttr('checked');
    $('#ode-n3-mime').removeAttr('checked');

    $('#ode-prefs-handle-mode').val('describe');
    var url = new Uri($('#ode-prefs-handle-url').val().trim());
    var h_url = url.setProtocol('http').setHost('linkeddata.uriburner.com').toString(); 
    if (h_url)
      $('#ode-prefs-handle-url').val(h_url);
    enableCtrls();
};



function loadPref() 
{
    var viewertype        = getItem("extensions.ode.viewertype");
    var viewerendpoint    = getItem("extensions.ode.viewerendpoint");

    if (viewertype)
        $('#ode-prefs-viewer').val(viewertype);
    if (viewerendpoint)
        $('#ode-prefs-viewer-custom-url').val(viewerendpoint);

    var openingbehavior   = getItem("extensions.ode.openingbehavior");
    if (openingbehavior) {
        $('#ode-prefs-opening-add').removeAttr('checked');
        $('#ode-prefs-opening-replace').removeAttr('checked');
        $('#ode-prefs-opening-new').removeAttr('checked');
        $('#ode-prefs-opening-'+openingbehavior).attr('checked','checked');
    }

    var sparqltype         = getItem("extensions.ode.sparqltype");
    var sparqlhost         = getItem("extensions.ode.sparqlhost");
    var sparqlport         = getItem("extensions.ode.sparqlport");

    var sparqlgenendpoint  = getItem("extensions.ode.sparqlgenendpoint");
    var sparqlcustendpoint = getItem("extensions.ode.sparqlcustendpoint");

    if (sparqltype)
        $('#ode-prefs-sparql-type').val(sparqltype);
         
    if (sparqlhost)
        $('#ode-prefs-sparql-host').val(sparqlhost);
    if (sparqlport)
        $('#ode-prefs-sparql-port').val(sparqlport);
    if (sparqlcustendpoint)
        $('#ode-prefs-sparql-cust-url').val(sparqlcustendpoint);

    var proxyservice      = getItem("extensions.ode.proxyservice"); // type of service

    var proxyhost         = getItem("extensions.ode.proxyhost");
    var proxyport         = getItem("extensions.ode.proxyport");
    var proxygenendpoint  = getItem("extensions.ode.proxygenendpoint");

    var proxycustendpoint = getItem("extensions.ode.proxycustendpoint");
    var headers = getItem("extension.ode.headers");

//    var proxyendpointsigs = [	"http://linkeddata.uriburner.com/about?url=",
//                                "http://%s:%s/about/rdf/%s",
//    				            "http://triplr.org/rdf/%s" ];

    if (proxyservice)
        $('#ode-prefs-proxyservice').val(proxyservice);

    if (proxyhost)
        $('#ode-prefs-proxy-host').val(proxyhost);
    if (proxyport)
        $('#ode-prefs-proxy-port').val(proxyport);
    if (proxycustendpoint)
        $('#ode-prefs-proxy-custom-url').val(proxycustendpoint);

    var handle_url = getItem("extensions.ode.handle.url");
    var handle_mode = getItem("extensions.ode.handle.mode"); 

    if (handle_mode)
        $('#ode-prefs-handle-mode').val(handle_mode);

    if (handle_url)
        $('#ode-prefs-handle-url').val(handle_url);

   if (getItem ("extension.ode.handle.rdf.mime")=="1")
     $('#ode-rdf-mime').attr('checked','checked');
   if (getItem ("extension.ode.handle.ttl.mime")=="1")
     $('#ode-ttl-mime').attr('checked','checked');
   if (getItem ("extension.ode.handle.n3.mime")=="1")
     $('#ode-n3-mime').attr('checked','checked');

    if (headers) {
      var data = JSON.parse(headers);
      if (data.length > 0) {
        for(var i=0; i < data.length; i++)
          addHdr1(data[i].header,data[i].value);
      } else {
        addHdr();
      }
    } else {
      addHdr();
    }
}  



function savePref() 
{
   var viewer_endpoints = ['http://linkeddata.uriburner.com/ode/?uri[]=', 
			    'http://dataviewer.zitgist.com/?uri=',
			    'http://beckr.org/marbles?uri=',
			    'http://www4.wiwiss.fu-berlin.de/rdf_browser/?browse_uri=',
			    'http://dig.csail.mit.edu/2005/ajar/release/tabulator/0.8/tab.html?uri='];

   var _e = $('#ode-prefs-viewer option:selected').val();
   setItem("extensions.ode.viewertype", _e);

   if (_e != 'custom') 
      setItem("extensions.ode.viewerendpoint", viewer_endpoints[$('#ode-prefs-viewer')[0].selectedIndex]);
   else
      setItem("extensions.ode.viewerendpoint", $('#ode-prefs-viewer-custom-url').val());

   setItem("extensions.ode.openingbehavior", $('#ode-prefs-opening input:checked').val());

   // SPARQL Endpoint

   setItem("extensions.ode.sparqltype", $('#ode-prefs-sparql-type option:selected').val());

   var _s_host = $('#ode-prefs-sparql-host').val().trim();
   var _s_port = $('#ode-prefs-sparql-port').val().trim();

   setItem("extensions.ode.sparqlhost", _s_host);
   setItem("extensions.ode.sparqlport", _s_port);

   var _gen_ep;
   var _sparql_type = $('#ode-prefs-sparql-type option:selected').val();

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
      _gen_ep = $('#ode-prefs-sparql-cust-url').val();
   }	

   setItem("extensions.ode.sparqlgenendpoint", _gen_ep);
   setItem("extensions.ode.sparqlcustendpoint", $('#ode-prefs-sparql-cust-url').val());

   // Proxy

   setItem ("extensions.ode.proxyservice", $('#ode-prefs-proxyservice option:selected').val());

   var _p_host = $('#ode-prefs-proxy-host').val().trim();
   var _p_port = $('#ode-prefs-proxy-port').val().trim();

   setItem ("extensions.ode.proxyhost", _p_host);
   setItem ("extensions.ode.proxyport", _p_port);

   var _gen_p_ep;
   var _proxyservice = $('#ode-prefs-proxyservice option:selected').val();

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
	  _gen_p_ep = $('#ode-prefs-proxy-custom-url').val();
   }

   setItem ("extensions.ode.proxygenendpoint", _gen_p_ep);
   setItem ("extensions.ode.proxycustendpoint", $('#ode-prefs-proxy-custom-url').val());

   var _handle_mode = $('#ode-prefs-handle-mode option:selected').val();
   setItem ("extensions.ode.handle.mode", _handle_mode);


   var url = new Uri($('#ode-prefs-handle-url').val().trim());
   var h_url = createHandlerURL(_handle_mode, url);

   setItem ("extensions.ode.handle.url", h_url);

   setItem ("extension.ode.handle.rdf.mime", $('#ode-rdf-mime').is(':checked')?"1":"0");
   setItem ("extension.ode.handle.ttl.mime", $('#ode-ttl-mime').is(':checked')?"1":"0");
   setItem ("extension.ode.handle.n3.mime",  $('#ode-n3-mime').is(':checked')?"1":"0");

//   setItem ("extension.ode.handle.rdf.file", $('#ode-rdf-file').is(':checked')?"1":"0");
//   setItem ("extension.ode.handle.ttl.file", $('#ode-ttl-file').is(':checked')?"1":"0");
//   setItem ("extension.ode.handle.n3.file",  $('#ode-n3-file').is(':checked')?"1":"0");

   var rows = $('#hdrs>tr');
   var headers = [];
   for(var i=0; i < rows.length; i++) {
     var r = $(rows[i]);
     var h = r.find('#h').val();
     var v = r.find('#v').val();
     if (h.length>0 && v.length>0)
       headers.push({header:h, value:v});
   }
   setItem("extension.ode.headers",JSON.stringify(headers)) 

   Browser.api.runtime.sendMessage({ode_settings: "changed"});

   close();
}



function setItem(key, value) 
{
    localStorage.removeItem(key);
    localStorage.setItem(key, value);
}


function getItem(key) 
{
    return localStorage.getItem(key);
}

function getItem2(key, def) 
{
    var val = localStorage.getItem(key);
    return (val != null)?val: def;
}


function change_proxyservice()
{
    switch ($('#ode-prefs-proxyservice option:selected').val())
    {
      case 'virtuoso':
        $('#ode-prefs-proxy-port').val('80');
	break;
      case 'virtuoso-ssl':
        $('#ode-prefs-proxy-port').val('443');
	break;
    }
    enableCtrls();
}

function change_sparql_type()
{
    switch ($('#ode-prefs-sparql-type option:selected').val())
    {
      case 'virtuoso':
        $('#ode-prefs-sparql-port').val('80');
        break;
      case 'virtuoso-ssl':
        $('#ode-prefs-sparql-port').val('443');
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

    switch($('#ode-prefs-viewer option:selected').val())
    {
      case 'builtin':
        $('#ode-prefs-opening').show(); //must be enabled
        $('#ode-prefs-opening-label').show(); //must be enabled
        $('#ode-prefs-sparql-host').removeAttr('disabled');
        $('#ode-prefs-sparql-port').removeAttr('disabled');
        $('#ode-prefs-sparql-type').removeAttr('disabled');
        $('#ode-prefs-sparql-set-def').removeAttr('disabled');

        var _p_port = $('#ode-prefs-sparql-port').val().trim();	

        switch ($('#ode-prefs-sparql-type option:selected').val())
        {
	  case 'virtuoso':
	    //document.getElementById('ode-prefs-sparql-endpoint-hostport-bcast').removeAttribute('hidden');
            $('#ode-prefs-sparql-host-r').show();
            $('#ode-prefs-sparql-port-r').show();
	    $('#ode-prefs-sparql-custom-url-bcast').hide();
	    if (_p_port === "443")
              $('#ode-prefs-sparql-port').val('80');
	    break;
	  case 'virtuoso-ssl':
	    //document.getElementById('ode-prefs-sparql-endpoint-hostport-bcast').removeAttribute('hidden');
            $('#ode-prefs-sparql-host-r').show();
            $('#ode-prefs-sparql-port-r').show();
	    $('#ode-prefs-sparql-custom-url-bcast').hide();
	    if (_p_port === "80")
              $('#ode-prefs-sparql-port').val('443');
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

    var _p_port = $('#ode-prefs-proxy-port').val().trim();	

    switch ($('#ode-prefs-proxyservice option:selected').val())
    {
      case 'virtuoso':
        $('#ode-prefs-proxy-host').removeAttr('disabled');
        $('#ode-prefs-proxy-port').removeAttr('disabled');
        $('#ode-prefs-proxy-host-r').show();
        $('#ode-prefs-proxy-port-r').show();
	$('#ode-prefs-proxy-custom-url-bcast').hide();
	if (_p_port === "443")
          $('#ode-prefs-proxy-port').val('80');
	break;
      case 'virtuoso-ssl':
        $('#ode-prefs-proxy-host').removeAttr('disabled');
        $('#ode-prefs-proxy-port').removeAttr('disabled');
        $('#ode-prefs-proxy-host-r').show();
        $('#ode-prefs-proxy-port-r').show();
	$('#ode-prefs-proxy-custom-url-bcast').hide();
	if (_p_port === "80")
          $('#ode-prefs-proxy-port').val('443');
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

    var url = new Uri($('#ode-prefs-handle-url').val().trim());
    var mode = $('#ode-prefs-handle-mode option:selected').val();
    var h_url = createHandlerURL(mode, url);

    switch (mode) {
      case 'describe':
	$('#ode-prefs-handle-url-bcast').show();
        $('#ode-prefs-handle-url').val(h_url);
        break;
      case 'describe-ssl':
	$('#ode-prefs-handle-url-bcast').show();
        $('#ode-prefs-handle-url').val(h_url);
        break;
      case 'about':
	$('#ode-prefs-handle-url-bcast').show();
        $('#ode-prefs-handle-url').val(h_url);
        break;
      case 'about-ssl':
	$('#ode-prefs-handle-url-bcast').show();
        $('#ode-prefs-handle-url').val(h_url);
        break;
      case 'ode':
	$('#ode-prefs-handle-url-bcast').show();
        $('#ode-prefs-handle-url').val(h_url);
        break;
      case 'ode-ssl':
	$('#ode-prefs-handle-url-bcast').show();
        $('#ode-prefs-handle-url').val(h_url);
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
//    var url = new Uri($('#ode-prefs-handle-url').val().trim());
    var h_url = "";

    switch (mode) {
      case 'describe':
        h_url = url.setProtocol("http").setPath('/describe/').setQuery('?url=').setAnchor('').toString(); 
        break;
      case 'describe-ssl':
        h_url = url.setProtocol("https").setPath('/describe/').setQuery('?url=').setAnchor('').toString(); 
        break;
      case 'about':
	h_url = url.setProtocol("http").setPath('/about/html/').setQuery('').setAnchor('').toString();
        break;
      case 'about-ssl':
	h_url = url.setProtocol("https").setPath('/about/html/').setQuery('').setAnchor('').toString();
        break;
      case 'ode':
	h_url = url.setProtocol("http").setPath('/ode/').setQuery('?uri=').setAnchor('').toString();
        break;
      case 'ode-ssl':
	h_url = url.setProtocol("https").setPath('/ode/').setQuery('?uri=').setAnchor('').toString();
        break;
      case 'ode_local':
        break;
      case 'none':
        break;
    }
    return h_url;
};


