Browser.api.browserAction.onClicked.addListener(
   function(tab) 
   {
//     alert(JSON.stringify(tab));
     launch_entity_describe(tab.url);
   }); 

function setItem(key, value) 
{
    localStorage.removeItem(key);
    localStorage.setItem(key, value);
}


function getItem(key, def) 
{
    var val = localStorage.getItem(key);
    return (val != null)?val: def;
}





function LaunchEntityDescription(info, tab) {
  try {
    if (("linkUrl" in info) && info.linkUrl!==null && info.linkUrl.length > 0)
      launch_entity_describe(info.linkUrl);
    else
      launch_entity_describe(tab.url);
  } catch(e) {
    alert(e);
  }
}



function LaunchPageDataSources(info, tab) 
{
  try {
    if (("linkUrl" in info) && info.linkUrl!==null && info.linkUrl.length > 0)
      launch_ds(info.linkUrl);
    else
      launch_ds(tab.url);
  } catch(e) {
    alert(e);
  }
}



Browser.api.contextMenus.create(
    {"title": "View Entity Description", 
     "contexts":["all"],
     "onclick": LaunchEntityDescription});
Browser.api.contextMenus.create(
    {"title": "View Data Sources", 
     "contexts":["all"],
     "onclick": LaunchPageDataSources});


var des_win = null;

function launch_ds(rawuri) 
{
    var viewertype = getItem("extensions.ode.viewertype","builtin");

    /// if incompatible protocol, do not launch anything
    if (rawuri.indexOf("chrome://ode/")==0 
       || rawuri.indexOf("about:")==0 
       || rawuri.indexOf("chrome:")==0) 
      {
//        alert('Cannot view linked data. (Incompatible protocol)');
        return;
      }

    /// use builtin browser
    if (viewertype == 'builtin') {
      /// do not open multiple instances
      if (rawuri.indexOf("lib/ode")>=0) {
        return;
      }

      if (/https?:\/\/(www.)?twitter.com/.test(rawuri)) 
        rawuri=rawuri.replace('#!/','');

      var ep = getItem("extensions.ode.sparqlgenendpoint", "http://linkeddata.uriburner.com/sparql");
      var vt = getItem("extensions.ode.viewertype","builtin");
      var rp = getItem("extensions.ode.proxygenendpoint","http://linkeddata.uriburner.com/about?url=");
      var ps = getItem("extensions.ode.proxyservice","virtuoso");
      var headers = getItem("extension.ode.headers","[]");

      var uri = "lib/ode/index.html?ep="+ep+
                  "&vt="+vt+"&rp="+rp+"&ps="+ps+"&headers="+headers+
      	          "&uri[]=" + encodeURIComponent(rawuri);

      var found = false;

      /// check if ode is already opened
      if (des_win && !des_win.closed) {
        var behavior = getItem("extensions.ode.openingbehavior","add");
        if (behavior == "add") { /// add to opened ode 
           des_win.location.href += '&uri[]=' + rawuri;
           found = true;
           return;
        } else if (behavior == "replace") { /// replace existing 
           des_win.location.href = uri;
           found = true;
           return;
        } /// when behavior == "new", continue 

      } else {
        des_win = Browser.backgroundOpenTab(uri);
      }

    } else {
      var viewer_endpoint = getItem("extensions.ode.viewerendpoint", ""); 
      rawuri = encodeURIComponent(rawuri);
      Browser.backgroundOpenTab(viewer_endpoint + rawuri);
    }
}



function launch_entity_describe(rawuri) 
{
    if (rawuri.length == 0) {
      return;
    }
    /// if incompatible protocol, do not launch anything 

    if (rawuri.indexOf("chrome://ode/") == 0 || 
        rawuri.indexOf("about:") == 0 || 
        rawuri.indexOf("chrome:") == 0) {
	    // Let's not annoy the user with alerts
	    // alert('Cannot view linked data. (Incompatible protocol)');
		return;
    }

    if (/https?:\/\/(www.)?twitter.com/.test(rawuri)) 
        rawuri=rawuri.replace('#!/','');

    var proxy_host = getItem("extensions.ode.proxyhost","linkeddata.uriburner.com");
    var proxy_port = getItem("extensions.ode.proxyport","");
    var proxy_srv =  getItem("extensions.ode.proxyservice", "virtuoso");
    var url;

    var result = rawuri.match(/^((\w+):\/)?\/?(.*)$/);
    if (!result) {
	alert('Invalid url:\n' + rawuri );
    }

    switch(proxy_srv) {
      case "virtuoso":
      case "virtuoso-ssl":
	url = (proxy_srv === "virtuoso-ssl")?"https://":"http://";
	url = url + proxy_host;
	if (proxy_port != '') 
	   url = url + ":" + proxy_port;
	            
//        var protocol = result[2]=="https"?"http":result[2];
        var protocol = result[2];

	url = url + "/about/html" + 
		    '/' + protocol + 		//protocol
		    '/' + result[3]; 		//rest
	break;
      case "triplr":
	url= "http://triplr.org/rdf/"+result[3];
	break;
      default:
	url = getItem("extensions.ode.proxycustendpoint","http://linkeddata.uriburner.com/about?uri=");
	url += rawuri;
	break;
    }

    Browser.backgroundOpenTab(url);
}

