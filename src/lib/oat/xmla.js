/*
 *  $Id: xmla.js,v 1.9.4.10 2012/03/20 11:53:26 pvk Exp $
 *
 *  This file is part of the OpenLink Software Ajax Toolkit (OAT) project.
 *
 *  Copyright (C) 2005-2012 OpenLink Software
 *
 *  See LICENSE file for details.
 */
/*
	connection
	-
	execute(callback,cursorOptions)  <-- needs endpoint && dsn && user && password && query
	discover(callback) <-- needs endpoint
	dbschema(callback) <-- needs endpoint && dsn
	tables(catalog,callback)   <-- needs endpoint && dsn
	columns(catalog,schema,table,callback)  <-- needs endpoint && dsn
	qualifiers(callback)
	primaryKeys(catalog,schema,table,callback)
	foreignKeys(catalog,schema,table,callback)
	providerTypes(callback)
	
	execute_array(data)
	discover_array(data)
	dbschema_array(data)
	tables_array(data)
	columns_array(data)
	qualifiers_array(data)
	
	
*/

OAT.XMLAErrorCode = {
    INVALID_PARMS:0
};

OAT.XMLAAuthType = {
    ENVELOPE:0,
    BROWSER:1
}

OAT.XMLACatalog = {
    name: "",
    o: [] // ["QUAL" ["TABLE0", "TABLE1", "TABLE..n"]]
}

OAT.XMLAService = function (endpoint,opts_o) {
    var self=this;

    var o = {
	endpoint: "/XMLA",
	connect_strs: false,
	auto_discover: false
    };

    for (p in opts_o) {
	o[p] = opts_o[p];
    }

    this.getConnection = function (connect_s_i, opts_o) {
	var o = {
	    success_cb: false,
	    fail_cb: false,
	    get_catalogs: false
	};
	
	for (p in opts_o) {
	    o[p] = opts_o[p];
	}

	if (!connect_strs || connect_s_i > connect_strs.length-1 || connect_s_i < 0)
	    throw (new Error ("Invalid connect string index"));

	var conn = new (OAT.XMLAConnection (o));
    }
    
    this.getConnectString = function (c_s_i) {
	if (!connect_strs || connect_s_i > connect_strs.length-1 || connect_s_i < 0)
	    throw (new Error ("Invalid connect string index"));

	return self.connect_strs[c_s_i];
    }

    this.getConnectStrings = function () {
	return connect_strs;
    }

    this.discover = function (o) {
	var opts_o = {
	    success_cb: false,
	    fail_cb: false
	}

	for (p in o) {
	    opts_o[p] = o[p];
	}

	var cb = function(data) {
	    var result = OAT.Xmla.discover_array(data);
	    self.o.connect_strs = result;
	}
	
	var data = '<Discover  env:encodingStyle="http://www.w3.org/2003/05/soap-encoding"'+
	    ' xmlns="urn:schemas-microsoft-com:xml-analysis" >'+
	    '<RequestType>DISCOVER_DATASOURCES</RequestType>'+
	    '<Restrictions xsi:nil="1" ></Restrictions>'+
	    '<Properties></Properties></Discover>';
	
	var ajax_opts = {
	    headers:OAT.Xmla.discoverHeader,
	    type:OAT.AJAX.TYPE_XML,
	    onerror: fail_cb
	}

	OAT.Soap.command(OAT.Xmla.connection.options.endpoint, data, cBack, ajax_opts);
	OAT.MSG.send (self,"OAT_XMLA_DS_DISCOVERY",self.o.connect_strs);
    }
    
    if (this.o.auto_discover) {
    }
}

OAT.XMLAConnection = function (connect_s) {
    var self=this;
    var o = {
	service: "",
	connectStrings: [],
	credentials: {user: "",pwd:""},
	cache: []
    }
    this.prepareStmt = function () {}
}

/*OAT.XMLAResult = function () {
}

OAT.XMLAStmt = function () {
}*/

OAT.Xmla = {
    connection:false,
    executeHeader:{'Content-Type':'application/soap+xml; action="urn:schemas-microsoft-com:xml-analysis:Execute"'},
    discoverHeader:{'Content-Type':'application/soap+xml; action="urn:schemas-microsoft-com:xml-analysis:Discover"'},
    
    parseResponse:function(xmlDoc) {
	var header = [];
	var body = [];
	var schema = false;
	//		var xmlDoc = OAT.Xml.createXmlDoc(data);
	var root = xmlDoc.documentElement;
	var doc = "";
	var schemas = OAT.Xml.getElementsByLocalName(root,"complexType");
	for (var i=0;i<schemas.length;i++) if (schemas[i].getAttribute("name") == "row") { schema = schemas[i]; }
	if (!schema) { return [header,body]; }
	var hvalues = OAT.Xml.getElementsByLocalName(schema,"element");
	for (var i=0;i<hvalues.length;i++) {
	    header.push(hvalues[i].getAttribute("name"));
	}
	
	var rows = OAT.Xml.getElementsByLocalName(root,"row");
	if (!rows.length) { return [header,body]; }
	for (var i=0;i<rows.length;i++) {
	    var r = [];
	    for (var j=0;j<header.length;j++) {
		var tag = OAT.Xml.getElementsByLocalName(rows[i],header[j])[0];
		r.push(OAT.Xml.textValue(tag));
	    }
	    body.push(r);
	}
	
	return [header,body];
    },
    
    execute:function(callback, cursorOptions, ajaxOptions) {
	var options = {
	    offset:0,
	    limit:0
	}
	if (cursorOptions) for (var p in cursorOptions) { options[p] = cursorOptions[p]; }
	
	var cBack = function(data) {
	    var result = OAT.Xmla.execute_array(data);
	    callback(result);
	}
	
	var data = '<Execute env:encodingStyle="http://www.w3.org/2003/05/soap-encoding"'+
	    ' xmlns="urn:schemas-microsoft-com:xml-analysis" >'+
	    '<Command><Statement><![CDATA['+OAT.Xmla.query+']]></Statement></Command>'+
	    '<Properties><PropertyList>'+
	    '<DataSourceInfo>'+OAT.Xmla.connection.options.dsn+'</DataSourceInfo>'+
	    '<UserName>'+OAT.Xmla.connection.options.user+'</UserName>'+
	    '<Password>'+OAT.Xmla.connection.options.password+'</Password>';
	if (OAT.Preferences.useCursors && options.limit) {
	    //				data += '<retrieve-row-count>1</retrieve-row-count>';
	    data += '<n-rows>'+options.limit+'</n-rows>';
	    data += '<skip>'+options.offset+'</skip>';
	}			
		data += '</PropertyList></Properties></Execute>';
	
	var o = {headers:OAT.Xmla.executeHeader,type:OAT.AJAX.TYPE_XML}
	if (ajaxOptions) for (var p in ajaxOptions) { o[p] = ajaxOptions[p]; }
	OAT.Soap.command(OAT.Xmla.connection.options.endpoint, data, cBack, o);
    },
    

    discover:function(callback, ajaxOpts) {
	var o = {}
	if (ajaxOpts) 
	    for (p in ajaxOpts) { o[p] = ajaxOpts[p]; }

	var cBack = function(data) {
	    var result = OAT.Xmla.discover_array(data);
	    callback(result);
	}
	
	var data = '<Discover  env:encodingStyle="http://www.w3.org/2003/05/soap-encoding"'+
	    ' xmlns="urn:schemas-microsoft-com:xml-analysis" >'+
	    '<RequestType>DISCOVER_DATASOURCES</RequestType>'+
	    '<Restrictions xsi:nil="1" ></Restrictions>'+
	    '<Properties></Properties></Discover>';
	
	var o = {headers:OAT.Xmla.discoverHeader,type:OAT.AJAX.TYPE_XML}
	OAT.Soap.command(OAT.Xmla.connection.options.endpoint, data, cBack, o);
    },
    
    dbschema:function(callback, ajaxOpts) {
	var o = {}
	if (ajaxOpts) 
	    for (p in ajaxOpts) { o[p] = ajaxOpts[p]; }

	var cBack = function(data) {
	    var result = OAT.Xmla.dbschema_array(data);
	    callback(result);
	}
	
	var data = '<Discover  env:encodingStyle="http://www.w3.org/2003/05/soap-encoding"'+
	    ' xmlns="urn:schemas-microsoft-com:xml-analysis" >'+
	    '<RequestType>DBSCHEMA_CATALOGS</RequestType>'+
	    '<Restrictions xsi:nil="1" ></Restrictions>'+
	    '<Properties><PropertyList>'+
	    '<DataSourceInfo>'+OAT.Xmla.connection.options.dsn+'</DataSourceInfo>'+
	    '<UserName>'+OAT.Xmla.connection.options.user+'</UserName>'+
	    '<Password>'+OAT.Xmla.connection.options.password+'</Password>'+
	    '</PropertyList></Properties></Discover>';
	
	o.headers = OAT.Xmla.discoverHeader;
	o.type    = OAT.AJAX.TYPE_XML;

	OAT.Soap.command(OAT.Xmla.connection.options.endpoint, data, cBack, o);
    },
    
    tables:function(catalog,callback, ajaxOpts) {
	var o = {}
	if (ajaxOpts) 
	    for (p in ajaxOpts) { o[p] = ajaxOpts[p]; }

	var cBack = function(data) {
	    var result = OAT.Xmla.tables_array(data);
	    callback(catalog,result);
	}
	
	var data = '<Discover env:encodingStyle="http://www.w3.org/2003/05/soap-encoding"'+
	    ' xmlns="urn:schemas-microsoft-com:xml-analysis" >'+
	    '<RequestType xsi:type="xsd:string">DBSCHEMA_TABLES</RequestType>';
	if (catalog != "") {
	    data += '<Restrictions xsi:nil="1" ><RestrictionList>'+
		'<TABLE_CATALOG>'+catalog+'</TABLE_CATALOG></RestrictionList></Restrictions>';
	}
	data += '<Properties><PropertyList>'+
	    '<DataSourceInfo>'+OAT.Xmla.connection.options.dsn+'</DataSourceInfo>';
	if (OAT.Xmla.connection.options.user) {
	    data += '<UserName>'+OAT.Xmla.connection.options.user+'</UserName>'+
		'<Password>'+OAT.Xmla.connection.options.password+'</Password>';
	}
	data +=	'</PropertyList></Properties></Discover>';
	
	o.headers = OAT.Xmla.discoverHeader;
	o.type    = OAT.AJAX.TYPE_XML;

	OAT.Soap.command(OAT.Xmla.connection.options.endpoint, data, cBack, o);
    },
    
    tables2:function(catalog,schema, table, callback, ajaxOpts, sync) {
	var o = {}
	if (ajaxOpts) 
	    for (p in ajaxOpts) { o[p] = ajaxOpts[p]; }

	var cBack = function(data) {
	    var result = OAT.Xmla.tables2_array(data);
	    callback(catalog,result);
	}
	
	var data = '<Discover env:encodingStyle="http://www.w3.org/2003/05/soap-encoding"'+
	    ' xmlns="urn:schemas-microsoft-com:xml-analysis" >'+
	    '<RequestType xsi:type="xsd:string">DBSCHEMA_TABLES</RequestType>'+
	    '<Restrictions><RestrictionList>';
	if (catalog != "")
	    data += '<TABLE_CATALOG>'+catalog+'</TABLE_CATALOG>';
	if (schema != "")
	    data += '<TABLE_SCHEMA>'+schema+'</TABLE_SCHEMA>';
	if (table != "")
	    data += '<TABLE_NAME>'+table+'</TABLE_NAME>';

	data += '</RestrictionList></Restrictions>'+
	    '<Properties><PropertyList>'+
	    '<DataSourceInfo>'+OAT.Xmla.connection.options.dsn+'</DataSourceInfo>';
	if (OAT.Xmla.connection.options.user) {
	    data += '<UserName>'+OAT.Xmla.connection.options.user+'</UserName>'+
		'<Password>'+OAT.Xmla.connection.options.password+'</Password>';
	}
	data +=	'</PropertyList></Properties></Discover>';
	
	o.headers = OAT.Xmla.discoverHeader;
	o.type    = OAT.AJAX.TYPE_XML;

	if (sync) {
	  var data = OAT.Soap.command_sync(OAT.Xmla.connection.options.endpoint, data, o);
	  if (data!=null)
	    return OAT.Xmla.tables2_array(data);
	  else
	    return null;
	} else {
	  OAT.Soap.command(OAT.Xmla.connection.options.endpoint, data, cBack, o);
	}
    },
    
    columns:function(catalog, schema, table, callback, ajaxOpts, sync) {
	var o = {};
	if (ajaxOpts) 
	    for (p in ajaxOpts) { o[p] = ajaxOpts[p]; }

	var cBack = function(data) {
	    var result = OAT.Xmla.columns_array(data);
	    callback(result);
	}
	
	var data = '<Discover env:encodingStyle="http://www.w3.org/2003/05/soap-encoding"'+
	    ' xmlns="urn:schemas-microsoft-com:xml-analysis" >'+
	    '<RequestType>DBSCHEMA_COLUMNS</RequestType>'+
	    '<Restrictions><RestrictionList>';
	if (catalog != "") {
	    data += '<TABLE_CATALOG>'+catalog+'</TABLE_CATALOG>';
	    data += '<TABLE_SCHEMA>'+schema+'</TABLE_SCHEMA>';
	}
	data += '<TABLE_NAME>'+table+'</TABLE_NAME></RestrictionList></Restrictions>'+
	    '<Properties><PropertyList>'+
	    '<UserName>'+OAT.Xmla.connection.options.user+'</UserName>'+
	    '<Password>'+OAT.Xmla.connection.options.password+'</Password>'+
	    '<DataSourceInfo>'+OAT.Xmla.connection.options.dsn+'</DataSourceInfo>'+
	    '</PropertyList></Properties></Discover>';
	
	o.headers = OAT.Xmla.discoverHeader;
	o.type    = OAT.AJAX.TYPE_XML;

	if (sync) {
	  var data = OAT.Soap.command_sync(OAT.Xmla.connection.options.endpoint, data, o);
	  if (data!=null)
	    return OAT.Xmla.columns_array(data);
	  else
	    return null;
	} else {
	  OAT.Soap.command(OAT.Xmla.connection.options.endpoint, data, cBack, o);
	}
    },
    
    qualifiers:function(callback,ajaxOpts) {
	var o = {};
	if (ajaxOpts) 
	    for (p in ajaxOpts) { o[p] = ajaxOpts[p]; }

	var cBack = function(data) {
	    var result = OAT.Xmla.qualifiers_array(data);
	    callback(result);
	}
	
	var data = '<Discover env:encodingStyle="http://www.w3.org/2003/05/soap-encoding"'+
	    ' xmlns="urn:schemas-microsoft-com:xml-analysis" >'+
	    '<RequestType>DISCOVER_LITERALS</RequestType>'+
	    '<Properties><PropertyList>'+
	    '<UserName>'+OAT.Xmla.connection.options.user+'</UserName>'+
	    '<Password>'+OAT.Xmla.connection.options.password+'</Password>'+
	    '<DataSourceInfo>'+OAT.Xmla.connection.options.dsn+'</DataSourceInfo>'+
	    '</PropertyList></Properties></Discover>';
	
	o.headers = OAT.Xmla.discoverHeader;
	o.type    = OAT.AJAX.TYPE_XML;

	OAT.Soap.command(OAT.Xmla.connection.options.endpoint, data, cBack, o);
    },
    
    providerTypes:function(callback,ajaxOpts) {
	var o = {};
	if (ajaxOpts) 
	    for (p in ajaxOpts) { o[p] = ajaxOpts[p]; }

	var cBack = function(data) {
	    var result = OAT.Xmla.providerTypes_array(data);
	    callback(result);
	}
	
	var data = '<Discover env:encodingStyle="http://www.w3.org/2003/05/soap-encoding"'+
	    ' xmlns="urn:schemas-microsoft-com:xml-analysis" >'+
	    '<RequestType>DBSCHEMA_PROVIDER_TYPES</RequestType>'+
	    '<Properties><PropertyList>'+
	    '<UserName>'+OAT.Xmla.connection.options.user+'</UserName>'+
	    '<Password>'+OAT.Xmla.connection.options.password+'</Password>'+
	    '<DataSourceInfo>'+OAT.Xmla.connection.options.dsn+'</DataSourceInfo>'+
	    '</PropertyList></Properties></Discover>';
	
	o.headers = OAT.Xmla.discoverHeader;
	o.type    = OAT.AJAX.TYPE_XML;

	OAT.Soap.command(OAT.Xmla.connection.options.endpoint, data, cBack, o);
    },
    
    primaryKeys:function(catalog,schema,table,callback,ajaxOpts,sync) {
	var o = {};
	if (ajaxOpts) 
	    for (p in ajaxOpts) { o[p] = ajaxOpts[p]; }

	var cBack = function(data) {
	    var result = OAT.Xmla.primaryKeys_array(catalog,schema,table,data);
	    callback(result);
	}
	
	var data = '<Discover  env:encodingStyle="http://www.w3.org/2003/05/soap-encoding"'+
	    ' xmlns="urn:schemas-microsoft-com:xml-analysis" >'+
	    '<RequestType>DBSCHEMA_PRIMARY_KEYS</RequestType>'+
	    '<Restrictions><RestrictionList>';
	if (catalog != "") {
	    data += '<TABLE_CATALOG>'+catalog+'</TABLE_CATALOG>';
	}
	if (schema != "") {
	    data += '<TABLE_SCHEMA>'+schema+'</TABLE_SCHEMA>';
	}
	data += '<TABLE_NAME>'+table+'</TABLE_NAME>';
	data += '</RestrictionList></Restrictions><Properties><PropertyList>'+
	    '<DataSourceInfo>'+OAT.Xmla.connection.options.dsn+'</DataSourceInfo>'+
	    '<UserName>'+OAT.Xmla.connection.options.user+'</UserName>'+
	    '<Password>'+OAT.Xmla.connection.options.password+'</Password>'+
	    '</PropertyList></Properties></Discover>';
	
	o.headers = OAT.Xmla.discoverHeader;
	o.type    = OAT.AJAX.TYPE_XML;

	if (sync) {
	  var data = OAT.Soap.command_sync(OAT.Xmla.connection.options.endpoint, data, o);
	  if (data!=null)
	    return OAT.Xmla.primaryKeys_array(catalog,schema,table,data);
	  else
	    return null;
	} else {
	  OAT.Soap.command(OAT.Xmla.connection.options.endpoint, data, cBack, o);
	}
    },
    
    foreignKeys:function(catalog,schema,table,callback,ajaxOpts,sync) {
	var o = {};
	if (ajaxOpts) 
	    for (p in ajaxOpts) { o[p] = ajaxOpts[p]; }

	var cBack = function(data) {
	    var result = OAT.Xmla.foreignKeys_array(catalog,schema,table,data);
	    callback(result);
	}
	
	var data = '<Discover  env:encodingStyle="http://www.w3.org/2003/05/soap-encoding"'+
	    ' xmlns="urn:schemas-microsoft-com:xml-analysis" >'+
	    '<RequestType>DBSCHEMA_FOREIGN_KEYS</RequestType>'+
	    '<Restrictions><RestrictionList>';
	if (catalog != "") {
	    data += '<PK_TABLE_CATALOG>'+catalog+'</PK_TABLE_CATALOG>';
	}
	if (schema != "") {
	    data += '<PK_TABLE_SCHEMA>'+schema+'</PK_TABLE_SCHEMA>';
	}
	data += '<PK_TABLE_NAME>'+table+'</PK_TABLE_NAME>';
	data += '</RestrictionList></Restrictions>'+ 
	    '<Properties><PropertyList>'+
	    '<DataSourceInfo>'+OAT.Xmla.connection.options.dsn+'</DataSourceInfo>'+
	    '<UserName>'+OAT.Xmla.connection.options.user+'</UserName>'+
	    '<Password>'+OAT.Xmla.connection.options.password+'</Password>'+
	    '</PropertyList></Properties></Discover>';
	
	o.headers = OAT.Xmla.discoverHeader;
	o.type    = OAT.AJAX.TYPE_XML;

	if (sync) {
	  var data = OAT.Soap.command_sync(OAT.Xmla.connection.options.endpoint, data, o);
	  if (data!=null)
	    return OAT.Xmla.foreignKeys_array(catalog,schema,table,data);
	  else
	    return null;
	} else {
	  OAT.Soap.command(OAT.Xmla.connection.options.endpoint, data, cBack, o);
	}
    },
    
    referenceKeys:function(catalog,schema,table,callback,ajaxOpts,sync) {
	var o = {};
	if (ajaxOpts) 
	    for (p in ajaxOpts) { o[p] = ajaxOpts[p]; }

	var cBack = function(data) {
	    var result = OAT.Xmla.foreignKeys_array(catalog,schema,table,data);
	    callback(result);
	}
	
	var data = '<Discover  env:encodingStyle="http://www.w3.org/2003/05/soap-encoding"'+
	    ' xmlns="urn:schemas-microsoft-com:xml-analysis" >'+
	    '<RequestType>DBSCHEMA_FOREIGN_KEYS</RequestType>'+
	    '<Restrictions><RestrictionList>';
	if (catalog != "") {
	    data += '<FK_TABLE_CATALOG>'+catalog+'</FK_TABLE_CATALOG>';
	}
	if (schema != "") {
	    data += '<FK_TABLE_SCHEMA>'+schema+'</FK_TABLE_SCHEMA>';
	}
	data += '<FK_TABLE_NAME>'+table+'</FK_TABLE_NAME>';
	data += '</RestrictionList></Restrictions>'+ 
	    '<Properties><PropertyList>'+
	    '<DataSourceInfo>'+OAT.Xmla.connection.options.dsn+'</DataSourceInfo>'+
	    '<UserName>'+OAT.Xmla.connection.options.user+'</UserName>'+
	    '<Password>'+OAT.Xmla.connection.options.password+'</Password>'+
	    '</PropertyList></Properties></Discover>';
	
	o.headers = OAT.Xmla.discoverHeader;
	o.type    = OAT.AJAX.TYPE_XML;

	if (sync) {
	  var data = OAT.Soap.command_sync(OAT.Xmla.connection.options.endpoint, data, o);
	  if (data!=null)
	    return OAT.Xmla.foreignKeys_array(catalog,schema,table,data);
	  else
	    return null;
	} else {
	  OAT.Soap.command(OAT.Xmla.connection.options.endpoint, data, cBack, o);
	}
    },
    
    /* --------------------------- */	
    
    execute_array:function(data) {
	/* 
			query result, return: [array_of_headers,array_of_rows]
			array_of_headers indexed by numbers
			array_of_rows indexed by numbers, then by numbers
		*/
	return OAT.Xmla.parseResponse(data);
    },
    
    discover_array:function(data) {
	/* list of datasources */
	var names=[];
	var parsed = OAT.Xmla.parseResponse(data);
	if (!parsed[1].length) return names;
	var index = parsed[0].indexOf("DataSourceInfo");
	for (var i=0;i<parsed[1].length;i++) {
	    names.push(parsed[1][i][index]);
	}
	return names;
    },
    
    dbschema_array:function(data) {
	/* list of catalogs */
	var names=[];
	var parsed = OAT.Xmla.parseResponse(data);
	if (!parsed[1].length) return names;
	var index = parsed[0].indexOf("CATALOG_NAME");
	for (var i=0;i<parsed[1].length;i++) {
	    names.push(parsed[1][i][index]);
	}
	return names;
    },
    
    tables_array:function(data) {
	/* list of tables */
	var names=[];
	var schema_names=[];
	var parsed = OAT.Xmla.parseResponse(data);
	if (!parsed[1].length) return [names,schema_names];
	var nameIndex = parsed[0].indexOf("TABLE_NAME");
	var schemaIndex = parsed[0].indexOf("TABLE_SCHEMA");
	var typeIndex = parsed[0].indexOf("TABLE_TYPE");
	for (var i=0;i<parsed[1].length;i++) {
	    var name = parsed[1][i][nameIndex];
	    var schema = parsed[1][i][schemaIndex];
	    var type = parsed[1][i][typeIndex];
	    if (type == "TABLE" || type == "VIEW") { 
		names.push(name);
		schema_names.push(schema);
	    }
	}
	return [names,schema_names];
    },
    
    tables2_array:function(data) {
	/* list of tables */
	var names=[];
	var parsed = OAT.Xmla.parseResponse(data);
	if (!parsed[1].length) return [names,schema_names];
	var nameIndex = parsed[0].indexOf("TABLE_NAME");
	var schemaIndex = parsed[0].indexOf("TABLE_SCHEMA");
	var catalogIndex = parsed[0].indexOf("TABLE_CATALOG");
	var typeIndex = parsed[0].indexOf("TABLE_TYPE");
	for (var i=0;i<parsed[1].length;i++) {
	    var tmpobj = {};
	    tmpobj.table = parsed[1][i][nameIndex];
	    tmpobj.schema = parsed[1][i][schemaIndex];
	    tmpobj.catalog = parsed[1][i][catalogIndex];
	    var type = parsed[1][i][typeIndex];
	    if (type == "TABLE" || type == "VIEW") { 
		names.push(tmpobj);
	    }
	}
	return names;
    },
    
    columns_array:function(data) {
	/* list of columns */
	var columns=[];
	var parsed = OAT.Xmla.parseResponse(data);
	if (!parsed[1].length) { return columns; }
	var flagIndex = parsed[0].indexOf("COLUMN_FLAGS");
	var nameIndex = parsed[0].indexOf("COLUMN_NAME");
	var defIndex = parsed[0].indexOf("COLUMN_DEFAULT");
	var typeIndex = parsed[0].indexOf("DATA_TYPE");
	var nnIndex = parsed[0].indexOf("IS_NULLABLE");
	var specIndex = parsed[0].indexOf("CHARACTER_MAXIMUM_LENGTH");
	for (var i=0;i<parsed[1].length;i++) {
	    var tmpobj = {};
	    tmpobj.name = parsed[1][i][nameIndex];
	    tmpobj.flags = parsed[1][i][flagIndex];
	    tmpobj.def = parsed[1][i][defIndex];
	    tmpobj.type = parsed[1][i][typeIndex];
	    tmpobj.nn = parsed[1][i][nnIndex];
	    tmpobj.spec = parsed[1][i][specIndex];
	    columns.push(tmpobj);
	}
	return columns;
    },
    
    qualifiers_array:function(data) {
	var q = ['"','"'];
	var parsed = OAT.Xmla.parseResponse(data);
	if (!parsed[1].length) return names;
	var index1 = parsed[0].indexOf("LiteralName");
	var index2 = parsed[0].indexOf("LiteralValue");
	for (var i=0;i<parsed[1].length;i++) {
	    var name = parsed[1][i][index1];
	    var value = parsed[1][i][index2];
	    if (name == "Quote_Prefix") { q[0] = value; }
	    if (name == "Quote_Suffix") { q[1] = value; }
	}
	return q;
    },
    
    providerTypes_array:function(data) {
	var types = [];
	var parsed = OAT.Xmla.parseResponse(data);
	if (!parsed[1].length) return types;
	var nameIndex = parsed[0].indexOf("TYPE_NAME");
	var typeIndex = parsed[0].indexOf("DATA_TYPE");
	var paramsIndex = parsed[0].indexOf("CREATE_PARAMS");
	var prefixIndex = parsed[0].indexOf("LITERAL_PREFIX");
	var suffixIndex = parsed[0].indexOf("LITERAL_SUFFIX");
	for (var i=0;i<parsed[1].length;i++) {
	    var name = parsed[1][i][nameIndex];
	    var type = parsed[1][i][typeIndex];
	    var params = parsed[1][i][paramsIndex];
	    var prefix = parsed[1][i][prefixIndex];
	    var suffix = parsed[1][i][suffixIndex];
	    types.push({name:name,type:type,params:params,prefix:prefix,suffix:suffix});
	}
	return types;
    },
    
    primaryKeys_array:function(catalog,schema,table,data) {
	var columns = [];
	var result = OAT.Xmla.parseResponse(data);
	if (!result[1].length) { return columns; }
	var columnIndex = result[0].indexOf("COLUMN_NAME");
	for (var i=0;i<result[1].length;i++) { columns.push(result[1][i][columnIndex]); }
	return columns;
    },
    
    foreignKeys_array:function(catalog,schema,table,data) {
	var keys = [];
	var result = OAT.Xmla.parseResponse(data);
	if (!result[1].length) { return keys; }
	var pkSchemaIndex = result[0].indexOf("PK_TABLE_SCHEMA");
	var pkTableIndex = result[0].indexOf("PK_TABLE_NAME");
	var pkColumnIndex = result[0].indexOf("PK_COLUMN_NAME");
	var fkSchemaIndex = result[0].indexOf("FK_TABLE_SCHEMA");
	var fkTableIndex = result[0].indexOf("FK_TABLE_NAME");
	var fkColumnIndex = result[0].indexOf("FK_COLUMN_NAME");
	for (var i=0;i<result[1].length;i++) {
	    var pk = {};
	    var fk = {};
	    if ( (schema == result[1][i][pkSchemaIndex] && table == result[1][i][pkTableIndex]) ||
		 (schema == result[1][i][fkSchemaIndex] && table == result[1][i][fkTableIndex]) ) {
		pk.catalog = catalog;
		pk.schema = result[1][i][pkSchemaIndex];
		pk.table = result[1][i][pkTableIndex];
		pk.column = result[1][i][pkColumnIndex];
		fk.catalog = catalog;
		fk.schema = result[1][i][fkSchemaIndex];
		fk.table = result[1][i][fkTableIndex];
		fk.column = result[1][i][fkColumnIndex];
		keys.push([pk,fk]);
	    }
	}
	return keys;
    }

}