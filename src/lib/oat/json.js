/*
 *  $Id: json_ff.js,v 1.1.2.1 2012/04/18 08:10:22 pvk Exp $
 *
 *  This file is part of the OpenLink Software Ajax Toolkit (OAT) project.
 *
 *  Copyright (C) 2005-2012 OpenLink Software
 *
 *  See LICENSE file for details.
 *
 */

// special version create for usign with FF extensions only, 
// for avoid problem with FF extension verification process

OAT.JSON = {

	deserialize:function(jsonString) {
		if (jsonString == null || jsonString.length == 0)
		  return null;

               	return JSON.parse(jsonString);
	},
			
	serialize:function(something, c) {
       		return JSON.stringify(something);
	}

}

//  Backward compatibility
OAT.JSON.stringify = OAT.JSON.serialize;
OAT.JSON.parse     = OAT.JSON.deserialize;
