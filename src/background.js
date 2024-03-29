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
Browser.api.browserAction.onClicked.addListener(
   function(tab) 
   {
//     alert(JSON.stringify(tab));
     launch_entity_describe(tab.url);
   }); 




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

async function launch_ds(rawuri) 
{
    var pref = new Settings();
    var viewertype = await pref.getValue("extensions.ode.viewertype");

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

      var ep = await pref.getValue("extensions.ode.sparqlgenendpoint");
      var vt = await pref.getValue("extensions.ode.viewertype");
      var rp = await pref.getValue("extensions.ode.proxygenendpoint");
      var ps = await pref.getValue("extensions.ode.proxyservice");
      var headers = await pref.getValue("extension.ode.headers","[]");

      var uri = "lib/ode/index.html?ep="+ep+
                  "&vt="+vt+"&rp="+rp+"&ps="+ps+"&headers="+headers+
      	          "&uri[]=" + encodeURIComponent(rawuri);

      var found = false;

      /// check if ode is already opened
      if (des_win && !des_win.closed) {
        var behavior = await pref.getValue("extensions.ode.openingbehavior","add");
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
      var viewer_endpoint = await pref.getValue("extensions.ode.viewerendpoint", ""); 
      rawuri = encodeURIComponent(rawuri);
      Browser.backgroundOpenTab(viewer_endpoint + rawuri);
    }
}



async function launch_entity_describe(rawuri) 
{
    var pref = new Settings();

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

    var proxy_host = await pref.getValue("extensions.ode.proxyhost");
    var proxy_port = await pref.getValue("extensions.ode.proxyport");
    var proxy_srv =  await pref.getValue("extensions.ode.proxyservice");
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
	url = await pref.getValue("extensions.ode.proxycustendpoint");
	url += rawuri;
	break;
    }

    Browser.backgroundOpenTab(url);
}

