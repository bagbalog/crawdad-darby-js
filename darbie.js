

//A global map to determine the IDs of generated dashboards. We don't actually use this for anything, it's just a reference for the IDs that map to each kind of dashboard.
let dashboardKeys= {
	'00000001-bbbb-dddd-aaaa-00000001':'Tenant Overview Dashboard',
	'00000002-bbbb-dddd-aaaa-00000001':'[Application Name] Overview Dashboard',
	'00000003-bbbb-dddd-aaaa-00000001':'[Application Name] Key User Action Dashboard',
	'00000004-bbbb-dddd-aaaa-00000001':'Synthetic Dashboard - Monitor View',
	'00000005-bbbb-dddd-aaaa-00000001':'Synthetic Dashboard - Performance',
	'00000006-bbbb-dddd-aaaa-00000001':'Synthetic Dashboard - Availability',
	'00000007-bbbb-dddd-aaaa-00000001':'Insights Overview Dashboard',
	'00000008-bbbb-dddd-aaaa-00000001':'Funnel Dashboard'
};

//This is our global ID map for the dashboards to count how many of each kind we have in the tenant (00000001 matches up to Tenant Overview, 00000002 matches up to Application Overview, etc.)
let foundDashboards = {
	'00000001':0,
	'00000002':0,
	'00000003':0,
	'00000004':0,
	'00000005':0,
	'00000006':0,
	'00000007':0,
	'00000008':0
};

//This keeps a list of the IDs and Application Names for each application overview dashboard we make so that we can feed it into the Tenant Overview dashboard.
let createdApplications = {};

let bindDarbyEvents = () => {
	document.querySelector("#generateDARBIE").addEventListener("click", function () {
		configureDashboards('Generate');
	});

	document.querySelector("#overwriteDARBIE").addEventListener("click", function () {
		configureDashboards('Overwrite');
	});

	document.querySelector("#deleteDARBIE").addEventListener("click", function () {
		deleteDashboards();
	});

	document.querySelector("#saveDashboardConfigDARBIE").addEventListener("click", function () {
		document.querySelector('#saveDashboardConfigDARBIE').innerText = 'Saved!';
		document.querySelector('#saveDashboardConfigDARBIE').disabled = true;

		document.querySelector('#container_DARBIEConfiguration').className = 'container tab-pane fade'
		document.querySelector('#container_DARBIE').className = 'container tab-pane active'
	});
	//Events for the 'Configure' section to disable/enable boxes based on whether KUAs or CGs have been chosen.
	let allCGInputs = document.querySelectorAll('input[list^="CGs"]');
	let allKUAInputs = document.querySelectorAll('input[list^="KUAs"]');
	for(let i=0; i<allCGInputs.length; i++){
		allCGInputs[i].addEventListener("change", function(evt) {
			allKUAInputs[i].disabled = allCGInputs[i].value !== '';
		});

		allKUAInputs[i].addEventListener("change", function(evt) {
			allCGInputs[i].disabled = allKUAInputs[i].value !== '';
		});
	}

	//Event listener for the 'non key user action' checkboxes. Modifies the UI based on what is chosen.
	let allCustomChecks = document.querySelectorAll('input[id^="customCheck"]');
	let allActionChecks = document.querySelectorAll('input[list^="KUA"]');
	let allFunnelRows = document.querySelectorAll('.funnelChoices');
	for(let i=0; i<allCustomChecks.length; i++){
		allCustomChecks[i].addEventListener("change", function(evt) {
			//Shows/Hides elements of the UI
			for(let x=allFunnelRows[i].children.length-1; x>1; x--){
				if(allFunnelRows[i].children[x].style.display==="none" && allFunnelRows[i].children[x].tagName !== "DATALIST"){
					allFunnelRows[i].children[x].style.display="block";
					allFunnelRows[i].children[x].value = '';
				} else if (allFunnelRows[i].children[x].tagName !== "DATALIST"){
					if(allFunnelRows[i].children[x].attributes.list){
						if(allFunnelRows[i].children[x].attributes.list.value.indexOf('CGs') > -1 || allFunnelRows[i].children[x].attributes.list.value.indexOf('funnelAppName') > -1){
							allFunnelRows[i].children[x].style.display="none";
							allFunnelRows[i].children[x].value = '';
						}
					}
				}


			}

			//Make sure our action name is never disabled if they're checking this box.
			allActionChecks[i].disabled = false;
		});

	}

	let allAppConfigNameInputs = document.querySelectorAll("input[list^=funnelAppName");
	for(let x=0; x<allAppConfigNameInputs.length; x++){
		allAppConfigNameInputs[x].addEventListener("input", function (evt) {
			if(allAppConfigNameInputs[x].value.length>0){
				allAppConfigNameInputs[x].style["background-color"] = "rgba(255, 0, 0, 0)"
			} else {
				allAppConfigNameInputs[x].style["background-color"] = "rgba(255, 0, 0, 0.17)"
			}
		});
	}


	document.querySelector('#addRowDARBIE').addEventListener("click", function(evt) {
		if(document.querySelector('#funnelList > .row[style="margin-top:5px; display:none;"]')){
			document.querySelector('#funnelList > .row[style="margin-top:5px; display:none;"]').style.display = ""
			if(!document.querySelector('#funnelList > .row[style="margin-top:5px; display:none;"]')){
				document.querySelector('#addRowDARBIE').style.display = 'none'
			}
		}
	});


	// Need these event listeners for the configuration section
	document.querySelector("#configureDARBIE").addEventListener("click", function () {

		if(document.querySelector('#saveDashboardConfigDARBIE').disabled === true){
			document.querySelector('#saveDashboardConfigDARBIE').innerText = 'Apply';
			document.querySelector('#saveDashboardConfigDARBIE').disabled = false;
			//Need to do something here?
		} else {
			//Fixing stuff for the configuration screen:
			//Clear the view of any elements we generated so they aren't present the next time we come back to this view.
			document.querySelector('#appCheckDARBIE').innerText = '';
			document.querySelector('#funnelList').hidden = true;

			//Clear any applications we chose previously
			document.querySelector('#applicationCheckboxesDARBIE').innerHTML = '';
			//Remove any funnel options that were selected previously.
			let allOptions = document.querySelectorAll('#funnelList datalist option');
			for (opt of allOptions){
				opt.remove();
			}

			//Remove the text of any funnel options that were already selected and clear any disabled attributes
			let allInputs = document.querySelectorAll('#funnelList input');
			for (let eachInput of allInputs){
				eachInput.value = null;
				eachInput.disabled = false;
			}
		}
		gatherConfigInfoDARBIE();
	});

	document.querySelector("#container_DARBIE").addEventListener("click", function () {
		document.querySelector('#configureDARBIE').className = 'btn btn-primary form-control'
	});

	document.querySelector("#container_DNA").addEventListener("click", function () {
		document.querySelector('#configureDARBIE').className = 'btn btn-primary form-control'
	});

	document.querySelector("#backBtnDARBIE").addEventListener("click", function () {
		document.querySelector('#container_DARBIEConfiguration').className = 'container tab-pane fade'
		document.querySelector('#container_DARBIE').className = 'container tab-pane active'
	});

	document.querySelector('#apiTokenDARBIE').addEventListener("change", async function() {
		if(dataObject.managed){
			let managedFull = dataObject.fullURL.split('/e/');
			dataObject.fullURL = managedFull[0]+'/e/'+managedFull[1].split('/')[0]
		} else {
			dataObject.fullURL = dataObject.fullURL.split('.com')[0]+'.com';
		}

		let apitoken = document.getElementById("apiTokenDARBIE").value;
		if (apitoken !== "") {
			let scopes = await fetch(dataObject.fullURL+'/api/v1/tokens/lookup', {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Accept": "application/json",
					"Authorization": "Api-Token "+apitoken
				},
				body: JSON.stringify({
					token: apitoken
				})
			}).then(r => r.json())
				.then((resp)=>{
					return resp.scopes;
				})
				.catch((e)=>{
					return res.status(401).send({success:false, error: { message: "Failed to get details about API token"}});
				});

			if(scopes){
				if(scopes.indexOf('WriteConfig') === -1){
					//We don't have the right permissions
					document.querySelector('#bottomDARBIE').innerText = 'Your API Token is missing the "Write configuration" scope!';
					document.querySelector('a[href="#bottomDARBIE"]').click();
				}
			}
		}
	});

	document.querySelector("#publicOpt").addEventListener("click", function () {
		if(document.querySelector("#publicOpt").checked){
			document.querySelector("#privateOpt").checked = false;
		}
	});

	document.querySelector("#privateOpt").addEventListener("click", function () {
		if(document.querySelector("#privateOpt").checked){
			document.querySelector("#publicOpt").checked = false;
		}
	});
};

function dTenantOverview(createdApplications){
	let dashboardJSON = remoteJSON['/includes/json/tenantOverview.json']

	//Set the dashboard owner
	dashboardJSON.dashboardMetadata.owner = dataObject.User;

	let markdownTile = {
		"name": "Markdown",
		"tileType": "MARKDOWN",
		"configured": true,
		"bounds": {
			"top": 114,
			"left": 1596,
			"width": 304,
			"height": 988
		},
		"tileFilter": {},
		"markdown": ""
	};

	for(let eachApp in createdApplications){
		//Check if it is an applications dashboard
		if(eachApp.indexOf('00000002-') > -1){
			markdownTile.markdown+="- ["+createdApplications[eachApp]+"](#dashboard;id="+eachApp+";gtf=l_2_HOURS;gf=all)\n"
		}
	}

	dashboardJSON.tiles.push(markdownTile);

	//If we have Synthetic tiles, push them into the Tenant overview. Else do nothing
	let SynthAvailTile = (foundDashboards['00000006'] > 0) ? dashboardJSON.tiles.push({
		"name": "Markdown",
		"tileType": "MARKDOWN",
		"configured": true,
		"bounds": {
			"top": 0,
			"left": 0,
			"width": 342,
			"height": 38
		},
		"tileFilter": {},
		"markdown": "## [Synthetic Avail. Dashboard](#dashboard;id=00000006-bbbb-dddd-aaaa-"+foundDashboards['00000006'].toString().padStart(8, "0")+";gtf=l_2_HOURS;gf=all) "
	}) : undefined

	let SynthPerfTile =  (foundDashboards['00000005'] > 0) ? dashboardJSON.tiles.push({
		"name": "Markdown",
		"tileType": "MARKDOWN",
		"configured": true,
		"bounds": {
			"top": 0,
			"left": 380,
			"width": 342,
			"height": 38
		},
		"tileFilter": {},
		"markdown": "## [Synthetic Perf. Dashboard](#dashboard;id=00000005-bbbb-dddd-aaaa-"+foundDashboards['00000005'].toString().padStart(8, "0")+";gtf=l_2_HOURS;gf=all) "
	}) : undefined

	let SynthMonitorViewTile = (foundDashboards['00000004'] > 0) ? dashboardJSON.tiles.push({
		"name": "Markdown",
		"tileType": "MARKDOWN",
		"configured": true,
		"bounds": {
			"top": 0,
			"left": 760,
			"width": 342,
			"height": 38
		},
		"tileFilter": {},
		"markdown": "## [Synthetic Monitor View](#dashboard;id=00000004-bbbb-dddd-aaaa-"+foundDashboards['00000004'].toString().padStart(8, "0")+";gtf=l_2_HOURS;gf=all)"
	}) : undefined

	//Check if we are sharing this dashboard or not.
	if(document.querySelector('#publicOpt').checked){
		dashboardJSON.dashboardMetadata.shared = true;
		dashboardJSON.dashboardMetadata.sharingDetails.published = true;
	}

	return dashboardJSON
}

function dAppOverview(dbID,dbIDKUA){
	let dashboardJSON = remoteJSON['/includes/json/AppOverview.json']

	dashboardJSON.tiles[24].markdown = "## [Application Key User Action Dashboard](#dashboard;id=00000003-bbbb-dddd-aaaa-"+dbIDKUA+";gtf=l_2_HOURS;gf=all) "
	dashboardJSON.id = "00000002-bbbb-dddd-aaaa-"+dbID;
	dashboardJSON.dashboardMetadata.owner = dataObject.User;

	if(document.querySelector('#publicOpt').checked){
		dashboardJSON.dashboardMetadata.shared = true;
		dashboardJSON.dashboardMetadata.sharingDetails.published = true;
	}

	return dashboardJSON;
}

function dAppKUAs(dbID, appOverviewID, KUAs){
	let dashboardJSON = remoteJSON['/includes/json/AppKUAs.json']

	dashboardJSON.id = '00000003-bbbb-dddd-aaaa-'+dbID
	dashboardJSON.dashboardMetadata.owner = dataObject.User;
	dashboardJSON.tiles[3].markdown = "## [Application Overview Dashboard](#dashboard;id=00000002-bbbb-dddd-aaaa-"+appOverviewID+";gtf=l_2_HOURS;gf=all)"

	let tileTop = 114;
	let tileLeft = 0;
	let tileWidth = 418;
	let tileHeight = 304;
	let XHRs = [];
	let Loads = [];

	//Split out XHRs and Load Actions
	for(let i=0; i<KUAs.length; i++){
		let KUAType = document.querySelector('#appBodyDARBIE input#'+KUAs[i]).attributes.dttype.value;
		if(KUAType === 'Load'){
			Loads.push(KUAs[i])
		} else {
			//Must be an XHR
			XHRs.push(KUAs[i])
		}
	}


	//Loop for load actions
	for(let i=0; i<Loads.length; i++){
		let KUAName = document.querySelector('#'+Loads[i]).attributes.dtname.value;
		let KUAType = document.querySelector('#'+Loads[i]).attributes.dttype.value;

		let resultMetaData1 = Loads[i]+'¦APPLICATION_METHOD»'+Loads[i]+'»truebuiltin:apps.web.action.count.load.browser|NONE|TOTAL|BAR|APPLICATION_METHOD';
		let resultMetaData2 = Loads[i]+'¦APPLICATION_METHOD»'+Loads[i]+'»truebuiltin:apps.web.action.visuallyComplete.load.browser|AVG|TOTAL|LINE|APPLICATION_METHOD';

		if(i % 3 === 0 && i !== 0){
			tileTop+=304
		}

		tileLeft = ((i%3)*418);

		dashboardJSON.tiles.push({
			"name": "Custom chart",
			"tileType": "CUSTOM_CHARTING",
			"configured": true,
			"bounds": {
				"top": tileTop,
				"left": tileLeft,
				"width": tileWidth,
				"height": tileHeight
			},
			"tileFilter": {},
			"filterConfig": {
				"type": "MIXED",
				"customName": KUAName,
				"defaultName": "Custom chart",
				"chartConfig": {
					"legendShown": true,
					"type": "TIMESERIES",
					"series": [{
						"metric": "builtin:apps.web.action.visuallyComplete.load.browser",
						"aggregation": "AVG",
						"type": "LINE",
						"entityType": "APPLICATION_METHOD",
						"dimensions": [{
							"id": "0",
							"name": "dt.entity.application_method",
							"values": [],
							"entityDimension": true
						}],
						"sortAscending": false,
						"sortColumn": false,
						"aggregationRate": "TOTAL"
					}, {
						"metric": "builtin:apps.web.action.count.load.browser",
						"aggregation": "NONE",
						"type": "BAR",
						"entityType": "APPLICATION_METHOD",
						"dimensions": [{
							"id": "0",
							"name": "dt.entity.application_method",
							"values": [],
							"entityDimension": true
						}],
						"sortAscending": false,
						"sortColumn": true,
						"aggregationRate": "TOTAL"
					}],
					"resultMetadata": {
						[resultMetaData1]: {
							"lastModified": 1591670314333,
							"customColor": "#008cdb"
						},
						[resultMetaData2]: {
							"lastModified": 1591670318306,
							"customColor": "#ef651f"
						}
					}
				},
				"filtersPerEntityType": {
					"APPLICATION_METHOD": {
						"SPECIFIC_ENTITIES": [Loads[i]]
					}
				}
			}
		})
	}

	//End of the Load Action tiles we put a slowest KUA thing here.
	dashboardJSON.tiles.push({
		"name": "User Sessions Query",
		"tileType": "DTAQL",
		"configured": true,
		"bounds": {
			"top": tileTop+=304,
			"left": 0,
			"width": 1254,
			"height": 266
		},
		"tileFilter": {},
		"customName": "Slowest Key User Actions",
		"query": "select useraction.name AS \"Page Name\", AVG(useraction.visuallyCompleteTime) AS \"Visually Complete Time\" FROM useraction where keyUserAction=true AND type=\"Load\" AND application=\"[Application Name]\" GROUP BY useraction.name ORDER BY AVG(useraction.visuallyCompleteTime) DESC LIMIT 10",
		"type": "TABLE",
		"limit": 50
	});

	//We put an XHR section header below that
	dashboardJSON.tiles.push({
		"name": "XHR",
		"tileType": "HEADER",
		"configured": true,
		"bounds": {
			"top": tileTop+=304,
			"left": 0,
			"width": 1254,
			"height": 38
		},
		"tileFilter": {}
	});

	tileTop+=38;
	tileLeft = 0;
	tileWidth = 418;
	tileHeight = 304;

	//Loop for XHR actions
	for(let x=0; x<XHRs.length; x++){
		let KUAName = document.querySelector('#'+XHRs[x]).attributes.dtname.value;
		let KUAType = document.querySelector('#'+XHRs[x]).attributes.dttype.value;

		let resultMetaData1 = XHRs[x]+'¦APPLICATION_METHOD»'+XHRs[x]+'»truebuiltin:apps.web.action.count.xhr.browser|NONE|TOTAL|BAR|APPLICATION_METHOD';
		let resultMetaData2 = XHRs[x]+'¦APPLICATION_METHOD»'+XHRs[x]+'»truebuiltin:apps.web.action.duration.xhr.browser|AVG|TOTAL|LINE|APPLICATION_METHOD';

		if(x % 3 === 0 && x !== 0){
			tileTop+=304
		}

		tileLeft = ((x%3)*418);

		dashboardJSON.tiles.push({
			"name": "Custom chart",
			"tileType": "CUSTOM_CHARTING",
			"configured": true,
			"bounds": {
				"top": tileTop,
				"left": tileLeft,
				"width": tileWidth,
				"height": tileHeight
			},
			"tileFilter": {},
			"filterConfig": {
				"type": "MIXED",
				"customName": KUAName,
				"defaultName": "Custom chart",
				"chartConfig": {
					"legendShown": true,
					"type": "TIMESERIES",
					"series": [{
						"metric": "builtin:apps.web.action.duration.xhr.browser",
						"aggregation": "AVG",
						"type": "LINE",
						"entityType": "APPLICATION_METHOD",
						"dimensions": [{
							"id": "0",
							"name": "dt.entity.application_method",
							"values": [],
							"entityDimension": true
						}],
						"sortAscending": false,
						"sortColumn": false,
						"aggregationRate": "TOTAL"
					}, {
						"metric": "builtin:apps.web.action.count.xhr.browser",
						"aggregation": "NONE",
						"type": "BAR",
						"entityType": "APPLICATION_METHOD",
						"dimensions": [{
							"id": "0",
							"name": "dt.entity.application_method",
							"values": [],
							"entityDimension": true
						}],
						"sortAscending": false,
						"sortColumn": true,
						"aggregationRate": "TOTAL"
					}],
					"resultMetadata": {
						[resultMetaData1]: {
							"lastModified": 1591670707370,
							"customColor": "#008cdb"
						},
						[resultMetaData2]: {
							"lastModified": 1591670692621,
							"customColor": "#ef651f"
						}
					}
				},
				"filtersPerEntityType": {
					"APPLICATION_METHOD": {
						"SPECIFIC_ENTITIES": [XHRs[x]]
					}
				}
			}
		});
	}

	dashboardJSON.tiles.push({
		"name": "User Sessions Query",
		"tileType": "DTAQL",
		"configured": true,
		"bounds": {
			"top": tileTop+=304,
			"left": 0,
			"width": 1254,
			"height": 266
		},
		"tileFilter": {},
		"customName": "Slowest XHR Key User Actions",
		"query": "select useraction.name AS \"XHR Action Name\", AVG(useraction.duration) AS \"Action Duration Time\" FROM useraction where keyUserAction=true AND type=\"Xhr\" AND application=\"[Application Name]\" GROUP BY useraction.name ORDER BY AVG(useraction.duration) DESC LIMIT 10",
		"type": "TABLE",
		"limit": 50
	});

	if(document.querySelector('#publicOpt').checked){
		dashboardJSON.dashboardMetadata.shared = true;
		dashboardJSON.dashboardMetadata.sharingDetails.published = true;
	}

	return dashboardJSON
}

function dSyntheticMonitorView(dbID){
	let dashboardJSON = remoteJSON['/includes/json/SyntheticMonitorView.json']

	dashboardJSON.id = '00000004-bbbb-dddd-aaaa-'+dbID
	dashboardJSON.dashboardMetadata.owner = dataObject.User;
	dashboardJSON.tiles[1].markdown = "## [Synthetic Avail. Dashboard](#dashboard;id=00000006-bbbb-dddd-aaaa-"+foundDashboards['00000006'].toString().padStart(8, "0")+";gtf=l_2_HOURS;gf=all) "
	dashboardJSON.tiles[2].markdown = "## [Synthetic Avail. Dashboard](#dashboard;id=00000006-bbbb-dddd-aaaa-"+foundDashboards['00000005'].toString().padStart(8, "0")+";gtf=l_2_HOURS;gf=all) "

	let tileTop = 76;
	let tileLeft = 0;
	for(let i=0; i<listenerOrder['Synthetic'].length; i++){

		if(i !== 0 && i % 4 === 0){
			tileTop += 304;
			tileLeft = 0;
		}

		dashboardJSON.tiles.push({
			"name": "Browser monitor",
			"tileType": "SYNTHETIC_SINGLE_WEBCHECK",
			"configured": true,
			"bounds": {
				"top": tileTop,
				"left": tileLeft,
				"width": 304,
				"height": 304
			},
			"tileFilter": {},
			"assignedEntities": [listenerOrder['Synthetic'][i][0]],
			"excludeMaintenanceWindows": true
		});

		tileLeft+=304


	}

	if(document.querySelector('#publicOpt').checked){
		dashboardJSON.dashboardMetadata.shared = true;
		dashboardJSON.dashboardMetadata.sharingDetails.published = true;
	}

	return dashboardJSON;
}

function dSyntheticPerf(dbID,monitorViewID){
	let dashboardJSON = remoteJSON['/includes/json/SyntheticPerf.json']

	dashboardJSON.id = '00000005-bbbb-dddd-aaaa-'+dbID
	dashboardJSON.dashboardMetadata.owner = dataObject.User;
	dashboardJSON.tiles[11].markdown = "## [Synthetic Avail. Dashboard](#dashboard;id=00000006-bbbb-dddd-aaaa-"+foundDashboards['00000006'].toString().padStart(8, "0")+";gtf=l_2_HOURS;gf=all) "
	dashboardJSON.tiles[12].markdown = "## [Monitor View Dashboard](#dashboard;id=00000004-bbbb-dddd-aaaa-"+monitorViewID+";gtf=l_2_HOURS;gf=all) "

	if(document.querySelector('#publicOpt').checked){
		dashboardJSON.dashboardMetadata.shared = true;
		dashboardJSON.dashboardMetadata.sharingDetails.published = true;
	}

	return dashboardJSON;
}

function dSyntheticAvail(dbID,monitorViewID){
	let dashboardJSON = remoteJSON['/includes/json/SyntheticAvail.json']

	dashboardJSON.id = '00000006-bbbb-dddd-aaaa-'+dbID
	dashboardJSON.dashboardMetadata.owner = dataObject.User;
	dashboardJSON.tiles[11].markdown = "## [Synthetic Perf. Dashboard](#dashboard;id=00000005-bbbb-dddd-aaaa-"+foundDashboards['00000005'].toString().padStart(8, "0")+";gtf=l_2_HOURS;gf=all) "
	dashboardJSON.tiles[12].markdown = "## [Monitor View Dashboard](#dashboard;id=00000004-bbbb-dddd-aaaa-"+monitorViewID+";gtf=l_2_HOURS;gf=all) "

	if(document.querySelector('#publicOpt').checked){
		dashboardJSON.dashboardMetadata.shared = true;
		dashboardJSON.dashboardMetadata.sharingDetails.published = true;
	}

	return dashboardJSON;
}

function dInsightsOverview(analystName){
	let dashboardJSON = remoteJSON['/includes/json/InsightsOverview.json']

	dashboardJSON.dashboardMetadata.owner = dataObject.User;
	dashboardJSON.tiles[3].markdown =  "## Your Business Insight team\n\nYour Business Insights Analyst is ["+analystName+"](https://dynatrace.com). \n\nInquiries can be directed at them and [InsightsSupport@dynatrace.com](https://dynatrace.com)"

	if(document.querySelector('#publicOpt').checked){
		dashboardJSON.dashboardMetadata.shared = true;
		dashboardJSON.dashboardMetadata.sharingDetails.published = true;
	}

	return dashboardJSON;
}

function dFunnelDashboard(dbID, dashboardChoice){
	let dashboardJSON = remoteJSON['/includes/json/FunnelDashboard.json']

	let TileNames = [];
	let TileIDs = [];
	let AppNames = [];
	let ActionNames = [];
	let ActionTypes = [];
	let LoadOrXHR = [];

	let headerLeft = 266
	let customChartLeft = 228

	let allFunnelChoicesKUA = document.querySelectorAll('#funnelList input.col-md-4[list^="KUAs"]');
	let allFunnelChoicesCG = document.querySelectorAll('#funnelList input.col-md-4[list^="CGs"]');
	let allFunnelChoicesCustom = document.querySelectorAll('#funnelList input.col-md-4[list^="funnelAppName"]');

	let allFunnelNames = document.querySelectorAll('#funnelList input.col-md-2');

	for(i=0; i<allFunnelChoicesKUA.length; i++){
		var tileID = '';
		var appName = '';
		var loadXHR = '';
		var tileName = '';

		if(allFunnelChoicesKUA[i].value !== ''){
			var actionName = allFunnelChoicesKUA[i].value;
			tileName = allFunnelNames[i].value!=='' ? allFunnelNames[i].value : actionName
			ActionTypes.push('KUA');

			if(document.querySelector("#funnelList datalist option[value='"+allFunnelChoicesKUA[i].value+"']")){
				let splitFunnelVars = document.querySelector("#funnelList datalist option[value='"+allFunnelChoicesKUA[i].value+"']").dataset.value.split('~~');
				tileID = splitFunnelVars[0];
				appName = splitFunnelVars[2];
				loadXHR = splitFunnelVars[3];

			} else {
				//Must be a custom/non-key user action. Need to pull the appName from the input box. Set it to simple too in case this was set to Advanced.
				//console.log(allFunnelChoicesCustom[i],allFunnelChoicesCustom[i].value)
				appName = allFunnelChoicesCustom[i].value

				if(dashboardChoice == 'Advanced'){
					dashboardChoice = 'Simple'
					document.querySelector('#bottomDARBIE').innerText = 'You have chosen the "Advanced" option for dashboarding, but this option does not support non-key user actions. We will automatically deploy a simple version instead. You can configure this again and choose to use only Key User Actions to get a more advanced version of the funnel dashboard.';
					document.querySelector('a[href="#bottomDARBIE"]').click();
				}

			}

			TileIDs.push(tileID);
			ActionNames.push(actionName)
			AppNames.push(appName)
			TileNames.push(tileName)
			LoadOrXHR.push(loadXHR)
		}

		if(allFunnelChoicesCG[i].value !== ''){
			var actionName = allFunnelChoicesCG[i].value;
			tileName = allFunnelNames[i].value!=='' ? allFunnelNames[i].value : actionName
			ActionTypes.push('CG');

			if(document.querySelector("#funnelList datalist option[value='"+allFunnelChoicesCG[i].value+"']")){
				let splitFunnelVars = document.querySelector("#funnelList datalist option[value='"+allFunnelChoicesCG[i].value+"']").dataset.value.split('~~');
				tileID = splitFunnelVars[0];
				appName = splitFunnelVars[2];
				loadXHR = splitFunnelVars[3];
			}

			TileIDs.push(tileID);
			ActionNames.push(actionName)
			AppNames.push(appName)
			TileNames.push(tileName)
			LoadOrXHR.push(loadXHR)
		}



	}

	for(i=0; i<ActionNames.length; i++){

		let tileID = TileIDs[i];
		let actionName = ActionNames[i];
		let appName = AppNames[i];
		let tileName = TileNames[i];
		let loadXHR = LoadOrXHR[i];

		//Header 1 tile (Replaces page name)
		dashboardJSON.tiles.push({
			"name": tileName,
			"tileType": "HEADER",
			"configured": true,
			"bounds": {
				"top": 380,
				"left": headerLeft,
				"width": 228,
				"height": 38
			},
			"tileFilter": {}
		})

		//Header 2 tile (Replaces page name)
		dashboardJSON.tiles.push({
			"name": tileName,
			"tileType": "HEADER",
			"configured": true,
			"bounds": {
				"top": 760,
				"left": headerLeft,
				"width": 228,
				"height": 38
			},
			"tileFilter": {}
		})

		if(dashboardChoice == 'Advanced'){

			//Custom Chart - VC (Replaces page ID)
			let resultMetaData1 = '';
			let metric1 = '';
			let customChartName1 = '';

			if(loadXHR == 'Xhr'){
				resultMetaData1 = tileID+"¦APPLICATION_METHOD»"+tileID+"»truebuiltin:apps.web.action.duration.xhr.browser|AVG|TOTAL|LINE|APPLICATION_METHOD"
				metric1 = "builtin:apps.web.action.duration.xhr.browser"
				customChartName1 = "Action Duration"
			} else if (loadXHR == 'Load'){
				resultMetaData1 = tileID+"¦APPLICATION_METHOD»"+tileID+"»truebuiltin:apps.web.action.visuallyComplete.load.browser|AVG|TOTAL|LINE|APPLICATION_METHOD"
				metric1 = "builtin:apps.web.action.visuallyComplete.load.browser"
				customChartName1 = "Visually Complete"
			}

			dashboardJSON.tiles.push({
				"name": "Custom chart",
				"tileType": "CUSTOM_CHARTING",
				"configured": true,
				"bounds": {
					"top": 1558,
					"left": customChartLeft,
					"width": 304,
					"height": 304
				},
				"tileFilter": {},
				"filterConfig": {
					"type": "MIXED",
					"customName": customChartName1,
					"defaultName": "Custom chart",
					"chartConfig": {
						"legendShown": true,
						"type": "TIMESERIES",
						"series": [{
							"metric": metric1,
							"aggregation": "AVG",
							"type": "LINE",
							"entityType": "APPLICATION_METHOD",
							"dimensions": [{
								"id": "0",
								"name": "dt.entity.application_method",
								"values": [],
								"entityDimension": true
							}],
							"sortAscending": false,
							"sortColumn": true,
							"aggregationRate": "TOTAL"
						}],
						"resultMetadata": {
							[resultMetaData1]: {
								"lastModified": 1596474220684,
								"customColor": "#7b379f"
							}
						}
					},
					"filtersPerEntityType": {
						"APPLICATION_METHOD": {
							"SPECIFIC_ENTITIES": [tileID]
						}
					}
				}

			})

			//Custom Chart - Apdex (Replaces page ID)
			let resultMetaData2 = tileID+"¦APPLICATION_METHOD»"+tileID+"»truebuiltin:apps.web.action.apdex|AVG|TOTAL|LINE|APPLICATION_METHOD"
			dashboardJSON.tiles.push({
				"name": "Custom chart",
				"tileType": "CUSTOM_CHARTING",
				"configured": true,
				"bounds": {
					"top": 2166,
					"left": customChartLeft,
					"width": 304,
					"height": 228
				},
				"tileFilter": {},
				"filterConfig": {
					"type": "MIXED",
					"customName": "Apdex",
					"defaultName": "Custom chart",
					"chartConfig": {
						"legendShown": true,
						"type": "SINGLE_VALUE",
						"series": [{
							"metric": "builtin:apps.web.action.apdex",
							"aggregation": "AVG",
							"type": "LINE",
							"entityType": "APPLICATION_METHOD",
							"dimensions": [{
								"id": "0",
								"name": "dt.entity.application_method",
								"values": [],
								"entityDimension": true
							}],
							"sortAscending": false,
							"sortColumn": false,
							"aggregationRate": "TOTAL"
						}],
						"resultMetadata": {
							[resultMetaData2]: {
								"lastModified": 1596474985523,
								"customColor": "#7b379f"
							}
						}
					},
					"filtersPerEntityType": {
						"APPLICATION_METHOD": {
							"SPECIFIC_ENTITIES": [tileID]
						}
					}
				}
			})

			//Custom Chart - HTTP & JS Errors (Replaces page ID)
			let resultMetaData3 = tileID+"¦APPLICATION_METHOD»"+tileID+"»true¦Error type»JavaScript»falsebuiltin:apps.web.action.countOfErrors|NONE|TOTAL|LINE|APPLICATION_METHOD"
			let resultMetaData4 = tileID+"¦APPLICATION_METHOD»"+tileID+"»true¦Error type»HTTP»falsebuiltin:apps.web.action.countOfErrors|NONE|TOTAL|LINE|APPLICATION_METHOD"
			dashboardJSON.tiles.push({
				"name": "Custom chart",
				"tileType": "CUSTOM_CHARTING",
				"configured": true,
				"bounds": {
					"top": 1862,
					"left": customChartLeft,
					"width": 304,
					"height": 304
				},
				"tileFilter": {},
				"filterConfig": {
					"type": "MIXED",
					"customName": "HTTP & JS Errors",
					"defaultName": "Custom chart",
					"chartConfig": {
						"legendShown": true,
						"type": "TIMESERIES",
						"series": [{
							"metric": "builtin:apps.web.action.countOfErrors",
							"aggregation": "NONE",
							"type": "LINE",
							"entityType": "APPLICATION_METHOD",
							"dimensions": [{
								"id": "0",
								"name": "dt.entity.application_method",
								"values": [],
								"entityDimension": true
							}, {
								"id": "2",
								"name": "Error type",
								"values": [],
								"entityDimension": false
							}],
							"sortAscending": false,
							"sortColumn": true,
							"aggregationRate": "TOTAL"
						}],
						"resultMetadata": {
							[resultMetaData3]: {
								"lastModified": 1597349772546,
								"customColor": "#f5d30f"
							},
							[resultMetaData4]: {
								"lastModified": 1597349767861,
								"customColor": "#ff0010"
							}
						}
					},
					"filtersPerEntityType": {
						"APPLICATION_METHOD": {
							"SPECIFIC_ENTITIES": [tileID]
						}
					}
				}
			})
		}


		// Visually Complete USQL Widget (Replaces page name and application)
		let VCQuery = 'SELECT avg(visuallyCompleteTime) AS \"Viz Complete\" FROM useraction WHERE '
		ActionTypes[i] == 'KUA' ? VCQuery+='useraction.name=\"'+actionName+'\" AND application=\"'+appName+'\"' : VCQuery+='useraction.matchingConversionGoals=\"'+actionName+'\" AND application=\"'+appName+'\"'
		dashboardJSON.tiles.push({
			"name": "User Sessions Query for VC",
			"tileType": "DTAQL",
			"configured": true,
			"bounds": {
				"top": 950,
				"left": customChartLeft,
				"width": 152,
				"height": 152
			},
			"tileFilter": {},
			"customName": actionName,
			"query": VCQuery,
			"type": "SINGLE_VALUE",
			"timeFrameShift": "dynamic",
			"limit": 50
		})

		//Error Count USQL Widget (Replaces page name and application)
		let errorQuery = 'SELECT SUM(errorCount) AS \"Errors\" FROM useraction WHERE '
		ActionTypes[i] == 'KUA' ? errorQuery+='useraction.name=\"'+actionName+'\" AND application=\"'+appName+'\"' : errorQuery+='useraction.matchingConversionGoals=\"'+actionName+'\" AND application=\"'+appName+'\"'
		dashboardJSON.tiles.push({
			"name": "User Sessions Query for Errors",
			"tileType": "DTAQL",
			"configured": true,
			"bounds": {
				"top": 950,
				"left": customChartLeft+152,
				"width": 152,
				"height": 152
			},
			"tileFilter": {},
			"customName": actionName,
			"query": errorQuery,
			"type": "SINGLE_VALUE",
			"timeFrameShift": "dynamic",
			"limit": 50
		})

		//Apdex USQL Widget (Replaces page name and application)
		let ApdexQuery = 'SELECT apdexCategory AS \"Apdex\", count(*) FROM useraction WHERE '
		ActionTypes[i] == 'KUA' ? ApdexQuery+='useraction.name=\"'+actionName+'\" AND application=\"'+appName+'\"' : ApdexQuery+='useraction.matchingConversionGoals=\"'+actionName+'\" AND application=\"'+appName+'\"'
		dashboardJSON.tiles.push({
			"name": "User Sessions Query for Apdex",
			"tileType": "DTAQL",
			"configured": true,
			"bounds": {
				"top": 1254,
				"left": customChartLeft,
				"width": 304,
				"height": 304
			},
			"tileFilter": {},
			"customName": actionName,
			"query": ApdexQuery+=' GROUP BY apdexCategory',
			"type": "PIE_CHART",
			"limit": 50
		})

		//Abandons USQL Widget (Replaces page name and application). Only add this as long as there is a next iteration still as we don't track abandons on the very last step.
		if(ActionNames[i+1]){
			let AbandonQuery = 'SELECT COUNT(*) AS \"Abandoned Sessions\" FROM usersession WHERE useraction.isExitAction=true AND'
			for(x=0; x<=i; x++){
				if(ActionTypes[x] == 'KUA'){
					AbandonQuery+='((useraction.application=\"'+AppNames[x]+'\" AND useraction.name=\"'+ActionNames[x]+'\")) AND '
				} else {
					AbandonQuery+='((useraction.application=\"'+AppNames[x]+'\" AND useraction.matchingConversionGoals=\"'+ActionNames[x]+'\")) AND '
				}
			}

			if(ActionTypes[i+1] == 'KUA'){
				AbandonQuery+='NOT ((useraction.application=\"'+AppNames[i+1]+'\" and useraction.name=\"'+ActionNames[i+1]+'\"))'
			} else {
				AbandonQuery+='NOT ((useraction.application=\"'+AppNames[i+1]+'\" and useraction.name=\"'+ActionNames[i+1]+'\"))'
			}

			dashboardJSON.tiles.push({
				"name": "User Sessions Query for Abandons",
				"tileType": "DTAQL",
				"configured": true,
				"bounds": {
					"top": 1102,
					"left": customChartLeft,
					"width": 304,
					"height": 152
				},
				"tileFilter": {},
				"customName": ActionNames[i],
				"query": AbandonQuery,
				"type": "SINGLE_VALUE",
				"timeFrameShift": "dynamic",
				"limit": 50
			})
		} else {
			dashboardJSON.tiles.push({
				"name": "Markdown No Abandons",
				"tileType": "MARKDOWN",
				"configured": true,
				"bounds": {
					"top": 1102,
					"left": customChartLeft,
					"width": 304,
					"height": 152
				},
				"tileFilter": {},
				"markdown": " ‎‎\n‎\n\n# N/A\nEnd of funnel\n\\\nNo abandons available"
			})
		}

		//Conversions USQL Widget (Replaces page name and application)
		//Apdex USQL Widget (Replaces page name and application)
		let usqlConversionQuery = 'SELECT count(*) AS \"Conversions\" from usersession WHERE '
		for(y=0; y<=i; y++){
			if(y== 0){
				if(ActionTypes[y] == 'KUA'){
					usqlConversionQuery+='((useraction.application = \"'+AppNames[y]+'\" AND useraction.name=\"'+ActionNames[y]+'\"))'
				} else {
					usqlConversionQuery+='((useraction.application = \"'+AppNames[y]+'\" AND useraction.matchingConversionGoals=\"'+ActionNames[y]+'\"))'
				}
			} else {
				if(ActionTypes[y] == 'KUA'){
					usqlConversionQuery+=' AND ((useraction.application = \"'+AppNames[y]+'\" AND useraction.name=\"'+ActionNames[y]+'\"))'
				} else {
					usqlConversionQuery+=' AND ((useraction.application = \"'+AppNames[y]+'\" AND useraction.matchingConversionGoals=\"'+ActionNames[y]+'\"))'
				}
			}
		}

		dashboardJSON.tiles.push({
			"name": "User Sessions Query for Conversions",
			"tileType": "DTAQL",
			"configured": true,
			"bounds": {
				"top": 798,
				"left": customChartLeft,
				"width": 304,
				"height": 152
			},
			"tileFilter": {},
			"customName": ActionNames[i],
			"query": usqlConversionQuery,
			"type": "SINGLE_VALUE",
			"timeFrameShift": "dynamic",
			"limit": 50
		})

		//Increment our coordinates for the next tiles
		headerLeft+=304
		customChartLeft+=304
	}

	if(dashboardChoice == 'Advanced'){
		dashboardJSON.tiles.push({
			"name": "Markdown Performance Icon",
			"tileType": "MARKDOWN",
			"configured": true,
			"bounds": {
				"top": 1634,
				"left": 0,
				"width": 228,
				"height": 114
			},
			"tileFilter": {},
			"markdown": "\n# ⏱️ Performance\n\n"
		},{
			"name": "Markdown Errors Icon",
			"tileType": "MARKDOWN",
			"configured": true,
			"bounds": {
				"top": 1938,
				"left": 0,
				"width": 228,
				"height": 114
			},
			"tileFilter": {},
			"markdown": "\n# \uD83D\uDCA3 Errors\n"
		});
	}

	//Markdown icons
	dashboardJSON.tiles.push({
		"name": "Markdown Apdex Icon",
		"tileType": "MARKDOWN",
		"configured": true,
		"bounds": {
			"top": 1368,
			"left": 0,
			"width": 228,
			"height": 114
		},
		"tileFilter": {},
		"markdown": "\n# \uD83D\uDE42\uD83D\uDE41 Apdex\n\n"
	}, {
		"name": "Markdown Overview Icon",
		"tileType": "MARKDOWN",
		"configured": true,
		"bounds": {
			"top": 912,
			"left": 0,
			"width": 228,
			"height": 114
		},
		"tileFilter": {},
		"markdown": "\n# \uD83D\uDD0E Overview"
	}, {
		"name": "Markdown Abandons",
		"tileType": "MARKDOWN",
		"configured": true,
		"bounds": {
			"top": 1178,
			"left": 0,
			"width": 228,
			"height": 114
		},
		"tileFilter": {},
		"markdown": "\n# \uD83D\uDCA8 Abandons"
	})

	//The Funnel tile (Need to replace ALL pages and applications in this tile)
	let funnelQuery = 'SELECT FUNNEL(';
	for(i=0; i<ActionNames.length; i++){
		ActionTypes[i] == 'KUA' ? funnelQuery+='((useraction.application=\"'+AppNames[i]+'\" and useraction.name=\"'+ActionNames[i]+'\")) as \"'+TileNames[i]+'\"' : funnelQuery+='((useraction.application=\"'+AppNames[i]+'\" and useraction.matchingConversionGoals=\"'+ActionNames[i]+'\")) as \"'+TileNames[i]+'\"'

		if(ActionNames[i+1]){
			funnelQuery+=','
		} else {
			funnelQuery+=') from usersession'
		}
	}
	dashboardJSON.tiles.push({
		"name": "User Sessions Query for Funnel",
		"tileType": "DTAQL",
		"configured": true,
		"bounds": {
			"top": 418,
			"left": 228,
			"width": ActionNames.length*304,
			"height": 342
		},
		"tileFilter": {},
		"customName": "Account Conversion Funnel",
		"query": funnelQuery,
		"type": "FUNNEL",
		"limit": 50
	})

	//USQL Conversions Count Widget (Need to replace ALL pages and applications in this tile)
	let conversionQuery = 'select count(*) as \"Conversions\" FROM usersession where ';
	for(i=0; i<ActionNames.length; i++){
		ActionTypes[i] == 'KUA' ? conversionQuery+='((useraction.application=\"'+AppNames[i]+'\" and useraction.name=\"'+ActionNames[i]+'\"))' : conversionQuery+='((useraction.application=\"'+AppNames[i]+'\" and useraction.matchingConversionGoals=\"'+ActionNames[i]+'\"))'
		if(ActionNames[i+1]){
			conversionQuery+=' AND '
		}
	}

	dashboardJSON.tiles.push({
		"name": "User Sessions Query for Total Conversions",
		"tileType": "DTAQL",
		"configured": true,
		"bounds": {
			"top": 228,
			"left": 228,
			"width": 342,
			"height": 152
		},
		"tileFilter": {},
		"customName": "Conversions",
		"query": conversionQuery,
		"type": "SINGLE_VALUE",
		"timeFrameShift": "dynamic",
		"limit": 50
	});

	//USQL Satisfied Conversions Count Widget (Need to replace ALL pages and applications in this tile)
	let conversionQueryS = 'select count(*) as \"Satisfied Conversions\" FROM usersession where ';
	for(i=0; i<ActionNames.length; i++){
		ActionTypes[i] == 'KUA' ? conversionQueryS+='((useraction.application=\"'+AppNames[i]+'\" and useraction.name=\"'+ActionNames[i]+'\"))' : conversionQueryS+='((useraction.application=\"'+AppNames[i]+'\" and useraction.matchingConversionGoals=\"'+ActionNames[i]+'\"))'
		if(ActionNames[i+1]){
			conversionQueryS+=' AND '
		} else {
			conversionQueryS+=' and userExperienceScore=\"SATISFIED\"'
		}
	}
	dashboardJSON.tiles.push({
		"name": "User Sessions Query for Total Satisfied Conversions",
		"tileType": "DTAQL",
		"configured": true,
		"bounds": {
			"top": 228,
			"left": 570,
			"width": 304,
			"height": 152
		},
		"tileFilter": {},
		"customName": "Satisfied",
		"query": conversionQueryS,
		"type": "SINGLE_VALUE",
		"timeFrameShift": "dynamic",
		"limit": 50
	});

	//USQL Tolerated Conversions Count Widget (Need to replace ALL pages and applications in this tile)
	let conversionQueryT = 'select count(*) as \"Tolerated Conversions\" FROM usersession where ';
	for(i=0; i<ActionNames.length; i++){
		ActionTypes[i] == 'KUA' ? conversionQueryT+='((useraction.application=\"'+AppNames[i]+'\" and useraction.name=\"'+ActionNames[i]+'\"))' : conversionQueryT+='((useraction.application=\"'+AppNames[i]+'\" and useraction.matchingConversionGoals=\"'+ActionNames[i]+'\"))'
		if(ActionNames[i+1]){
			conversionQueryT+=' AND '
		} else {
			conversionQueryT+=' and userExperienceScore=\"TOLERATED\"'
		}
	}
	dashboardJSON.tiles.push({
		"name": "User Sessions Query for Total Tolerated Conversions",
		"tileType": "DTAQL",
		"configured": true,
		"bounds": {
			"top": 228,
			"left": 874,
			"width": 304,
			"height": 152
		},
		"tileFilter": {},
		"customName": "Tolerated",
		"query": conversionQueryT,
		"type": "SINGLE_VALUE",
		"timeFrameShift": "dynamic",
		"limit": 50
	})

	//USQL Frustrated Conversions Count Widget (Need to replace ALL pages and applications in this tile)
	let conversionQueryF = 'select count(*) as \"Frustrated Conversions\" FROM usersession where ';
	for(i=0; i<ActionNames.length; i++){
		ActionTypes[i] == 'KUA' ? conversionQueryF+='((useraction.application=\"'+AppNames[i]+'\" and useraction.name=\"'+ActionNames[i]+'\"))' : conversionQueryF+='((useraction.application=\"'+AppNames[i]+'\" and useraction.matchingConversionGoals=\"'+ActionNames[i]+'\"))'
		if(ActionNames[i+1]){
			conversionQueryF+=' AND '
		} else {
			conversionQueryF+=' and userExperienceScore=\"FRUSTRATED\"'
		}
	}
	dashboardJSON.tiles.push({
		"name": "User Sessions Query for Total Frustrated Conversions",
		"tileType": "DTAQL",
		"configured": true,
		"bounds": {
			"top": 228,
			"left": 1178,
			"width": 304,
			"height": 152
		},
		"tileFilter": {},
		"customName": "Frustrated",
		"query": conversionQueryF,
		"type": "SINGLE_VALUE",
		"timeFrameShift": "dynamic",
		"limit": 50
	})

	dashboardJSON.id = '00000008-bbbb-dddd-aaaa-'+dbID
	dashboardJSON.dashboardMetadata.owner = dataObject.User;

	if(document.querySelector('input[placeholder^="Enter the name for your funnel dashboard"]').value.length > 0){
		dashboardJSON.dashboardMetadata.name = document.querySelector('input[placeholder^="Enter the name for your funnel dashboard"]').value;
		dashboardJSON.tiles.push({
			"name": "Markdown Funnel Icon",
			"tileType": "MARKDOWN",
			"configured": true,
			"bounds": {
				"top": 456,
				"left": 0,
				"width": 228,
				"height": 152
			},
			"tileFilter": {},
			"markdown": "\n# \uD83C\uDFC1 "+document.querySelector('input[placeholder^="Enter the name for your funnel dashboard"]').value
		})
	} else {
		dashboardJSON.tiles.push({
			"name": "Markdown Funnel Icon",
			"tileType": "MARKDOWN",
			"configured": true,
			"bounds": {
				"top": 456,
				"left": 0,
				"width": 228,
				"height": 152
			},
			"tileFilter": {},
			"markdown": "\n# \uD83C\uDFC1 Funnel\n\n"
		})
	}

	return dashboardJSON;
}

let listenerOrder = {};


// parse the applications and the synthetic measurements. (for DARBIE)
function parseAppAndSynthDARBIE() {
	//if there are 'keys' in our applications object, that means we have found applications in the tenant and need to parse them.
	if (Object.keys(dataObject.applications).length > 0) {
		let orderedApps = {}; // order the applications
		Object.keys(dataObject.applications).sort().forEach(function(key) {
			orderedApps[key] = dataObject.applications[key];
		});

		// create a select all/clear checkbox
		let checkClearRum = document.querySelector("#appBodyDARBIE");
		let divRum = document.createElement("div");
		divRum.setAttribute("class", "form-check justify-content-end");

		let inputRum = document.createElement("input");
		inputRum.setAttribute("class", "form-check-input");
		inputRum.setAttribute("id", 'clearbox');
		inputRum.setAttribute("type", "checkbox");
		inputRum.addEventListener("click", function (evt) {


			let checkboxes = document.querySelectorAll(".justify-content-end input[type='checkbox']");
			for (let check in checkboxes) {
				if(evt.currentTarget.checked){
					checkboxes[check].checked = true;
				} else {
					checkboxes[check].checked = false;
				}


				for(let apps in orderedApps){

					let KUABoxes = document.querySelectorAll(`#${orderedApps[apps]}-KUA input`);
					for(let KUAB = 0; KUAB<KUABoxes.length; KUAB++){
						if(evt.currentTarget.checked){
							KUABoxes[KUAB].checked = true;
							//KUABoxes[KUAB].disabled = false;
						} else {
							KUABoxes[KUAB].checked = false;
							//KUABoxes[KUAB].disabled = true;
						}
					}

					let CGBoxes = document.querySelectorAll(`#${orderedApps[apps]}-CG input`);
					for(let CGB = 0; CGB<CGBoxes.length; CGB++){
						if(evt.currentTarget.checked){
							CGBoxes[CGB].checked = true;
							CGBoxes[CGB].disabled = false;
						} else {
							CGBoxes[CGB].checked = false;
							//CGBoxes[CGB].disabled = true;
						}
					}
				}
			}
		});

		divRum.appendChild(inputRum);

		let labelRum = document.createElement("label");
		labelRum.setAttribute("class", "form-check-label");
		labelRum.setAttribute("for", 'clearbox');
		labelRum.innerText = 'Select/Clear All';
		divRum.appendChild(labelRum);

		checkClearRum.appendChild(divRum);


		if (Object.keys(dataObject.applications).length > 0) {
			//First order the applications alphabetically
			let orderedApps = {};
			Object.keys(dataObject.applications).sort().forEach(function(key) {
				orderedApps[key] = dataObject.applications[key];
			});

			for (let app in orderedApps) {
				if (dataObject.applications.hasOwnProperty(app)) {
					// render an input (radio button) for this application on the page
					createApplicationInputDARBIE(app, dataObject.applications[app],dataObject.KUAs[app], dataObject.conversionGoals[app]);
				}
			}
		}


	} else {
		// no applications
	}



	// now do the same thing for measurements
	if (Object.keys(dataObject.monitors).length > 0) {
		let ordered = {}; // order the measurements and save them in a
		Object.keys(dataObject.monitors).sort().forEach(function(key) {
			ordered[key] = dataObject.monitors[key];
		});

		// create a select all/clear checkbox
		let checkClear = document.querySelector("#synthBodyDARBIE");
		let divSynth = document.createElement("div");
		divSynth.setAttribute("class", "form-check d-flex");

		let input = document.createElement("input");
		input.setAttribute("class", "form-check-input");
		input.setAttribute("id", 'clearbox');
		//input.setAttribute("disabled", "disabled");
		input.setAttribute("type", "checkbox");
		input.addEventListener("click", function (evt) {
			let checkboxes = document.querySelectorAll("#synthTestDARBIE input[type='checkbox']");
			for (let check in checkboxes) {
				// checks or unchecks all monitors when clicked
				evt.currentTarget.checked ?
					checkboxes[check].checked = true :
					checkboxes[check].checked = false;
			}
			for(let mon in ordered){
				if(ordered.hasOwnProperty(mon)){
					const selector = `#${ordered[mon].id}DARBIE input`;
					checkListener(evt.currentTarget.checked, selector);
				}
			}

		});

		divSynth.appendChild(input);

		let label = document.createElement("label");
		label.setAttribute("class", "form-check-label");
		label.setAttribute("for", 'clearbox');
		label.innerText = 'Select/Clear All';
		divSynth.appendChild(label);

		checkClear.appendChild(divSynth);

		for (let mon in ordered) {
			if (ordered.hasOwnProperty(mon)) {
				// render an input (checkbox) for the measurement.
				createSyntheticInputDARBIE(mon, ordered[mon].id);
			}
		}
	}


	//And the same thing for any existing dashboards

	// create a select all/clear checkbox
	let checkClearDB = document.querySelector("#insightsDARBIE");
	let divDB = document.createElement("div");
	divDB.setAttribute("class", "form-check d-flex");

	//Select all/clear all for DT Insights dashboards

	if(Object.keys(dataObject.dashboards_insights).length > 0) {
		let inputDashboard= document.createElement("input");
		inputDashboard.setAttribute("class", "form-check-input");
		inputDashboard.setAttribute("id", 'DBclearbox');
		inputDashboard.setAttribute("type", "checkbox");
		inputDashboard.addEventListener("click", function (evt) {

			let checkboxes = document.querySelectorAll("#insightsDARBIE input[type='checkbox']");
			for (let check in checkboxes) {
				// checks or unchecks all monitors when clicked
				evt.currentTarget.checked ?
					checkboxes[check].checked = true :
					checkboxes[check].checked = false;
			}

			if(document.querySelector('.panel div[id^="list"] input:checked')){
				document.querySelector('#deleteDARBIE').disabled = false;
				document.querySelector('#overwriteDARBIE').disabled = false;
			} else {
				document.querySelector('#deleteDARBIE').disabled = true;
				document.querySelector('#overwriteDARBIE').disabled = true;
			}

		});

		divDB.appendChild(inputDashboard);
		let labelDB = document.createElement("label");
		labelDB.setAttribute("class", "form-check-label");
		labelDB.setAttribute("for", 'DBclearbox');
		labelDB.innerText = 'Select/Clear All';
		divDB.appendChild(labelDB);

		checkClearDB.appendChild(divDB);
	}

	//Creates the list of DT Insights dashboards
	//order alphabetically
	let orderedInsightsDB = {};
	Object.keys(dataObject.dashboards_insights).sort().forEach(function(key) {
		orderedInsightsDB[key] = dataObject.dashboards_insights[key];
	});
	let allDashboards = orderedInsightsDB;
	for(let d in allDashboards){
		//Look to see if the tenant currently has any of our dashboards.
		if(d.indexOf('-bbbb-dddd-aaaa-') !== -1){
			//This is an application overview dashboard, add it to our createdApplications global variable to keep track of what we already have
			createdApplications[d] = allDashboards[d];




			//Grab all applications that have been checked
			let appChecks = document.querySelectorAll('.justify-content-end input');
			for(let a in appChecks){
				if(appChecks[a].parentElement instanceof HTMLElement){
					if(appChecks[a].parentElement.id.indexOf('APPLICATION-') > -1){
						let strippedAppName = appChecks[a].parentElement.querySelector('label').title.split(' - (')[0];
						if(allDashboards[d].indexOf(strippedAppName) > -1){
							//Found a match in the applications with our existing dashboards, color it green and bold it.
							appChecks[a].parentElement.children[1].style.color = '#43BA26';
							appChecks[a].parentElement.children[1].style.fontWeight = 'bold';
						}
					}
				}
			}



			let appCard = document.querySelector("#insightsDARBIE");
			let divD = document.createElement("div");
			divD.setAttribute("class", "form-check d-flex");
			divD.setAttribute("id", "listinsightsDARBIE");

			let inputDB = document.createElement("input");
			inputDB.setAttribute("class", "form-check-input");
			inputDB.setAttribute("id", d);
			inputDB.setAttribute("type", "checkbox");
			inputDB.addEventListener("change", function (evt) {

				if(document.querySelector('.panel div[id^="list"] input:checked')){
					document.querySelector('#deleteDARBIE').disabled = false;
					document.querySelector('#overwriteDARBIE').disabled = false;
				} else {
					document.querySelector('#deleteDARBIE').disabled = true;
					document.querySelector('#overwriteDARBIE').disabled = true;
				}

			});
			divD.appendChild(inputDB);

			let label = document.createElement("label");
			label.setAttribute("class", "form-check-label");
			label.setAttribute("for", d);
			label.innerText = `${allDashboards[d]} - (${d})`;
			divD.appendChild(label);


			appCard.appendChild(divD);
			// create a select all/clear checkbox
			let clearDiv = document.createElement("div");
			clearDiv.setAttribute("class", "form-check");


			let clearLabel = document.createElement("label");
			clearLabel.setAttribute("class", "form-check-label");
			clearLabel.setAttribute("for", 'stepClearboxDARBIE');
			clearLabel.innerText = 'Select/Clear All';
			clearDiv.appendChild(clearLabel);

		}
	}




	// create a select all/clear checkbox for CUSTOMER dashboards
	let checkClearDBCustomers = document.querySelector("#customersBodyDARBIE");
	let divDBCustomers = document.createElement("div");
	divDBCustomers.setAttribute("class", "form-check d-flex");

	if(Object.keys(dataObject.dashboards_customers).length > 0) {
		let inputDashboardCustomers = document.createElement("input");
		inputDashboardCustomers.setAttribute("class", "form-check-input");
		inputDashboardCustomers.setAttribute("id", 'DBclearbox');
		inputDashboardCustomers.setAttribute("type", "checkbox");
		inputDashboardCustomers.addEventListener("click", function (evt) {

			let checkboxesCustomers = document.querySelectorAll("#customersBodyDARBIE input[type='checkbox']");
			for (let check in checkboxesCustomers) {
				// checks or unchecks all monitors when clicked
				evt.currentTarget.checked ?
					checkboxesCustomers[check].checked = true :
					checkboxesCustomers[check].checked = false;
			}

			if(document.querySelector('.panel div[id^="list"] input:checked')){
				document.querySelector('#deleteDARBIE').disabled = false;
				document.querySelector('#overwriteDARBIE').disabled = false;
			} else {
				document.querySelector('#deleteDARBIE').disabled = true;
				document.querySelector('#overwriteDARBIE').disabled = true;
			}
		});

		divDBCustomers.appendChild(inputDashboardCustomers);
		let labelDBCustomers = document.createElement("label");
		labelDBCustomers.setAttribute("class", "form-check-label");
		labelDBCustomers.setAttribute("for", 'DBclearbox');
		labelDBCustomers.innerText = 'Select/Clear All';
		divDBCustomers.appendChild(labelDBCustomers);

		checkClearDBCustomers.appendChild(divDBCustomers);
	}

	//Creates the list of CUSTOMER dashboards
	//order alphabetically
	let orderedCust = {};
	Object.keys(dataObject.dashboards_customers).sort().forEach(function(key) {
		orderedCust[key] = dataObject.dashboards_customers[key];
	});
	let allDashboardsCustomers = orderedCust;
	for(d in allDashboardsCustomers){

		let appCardCustomers = document.querySelector("#customersBodyDARBIE");
		let divDCustomers = document.createElement("div");
		divDCustomers.setAttribute("class", "form-check d-flex");
		divDCustomers.setAttribute("id", "listCustomersDARBIE");

		let inputDBCustomers = document.createElement("input");
		inputDBCustomers.setAttribute("class", "form-check-input");
		inputDBCustomers.setAttribute("id", d);
		inputDBCustomers.setAttribute("type", "checkbox");
		inputDBCustomers.addEventListener("change", function (evt) {

			if(document.querySelector('.panel div[id^="list"] input:checked')){
				document.querySelector('#deleteDARBIE').disabled = false;
				document.querySelector('#overwriteDARBIE').disabled = false;
			} else {
				document.querySelector('#deleteDARBIE').disabled = true;
				document.querySelector('#overwriteDARBIE').disabled = true;
			}


		});
		divDCustomers.appendChild(inputDBCustomers);

		let labelCustomers = document.createElement("label");
		labelCustomers.setAttribute("class", "form-check-label");
		labelCustomers.setAttribute("for", d);
		labelCustomers.innerText = `${allDashboardsCustomers[d]} - (${d})`;
		divDCustomers.appendChild(labelCustomers);


		appCardCustomers.appendChild(divDCustomers);
		// create a select all/clear checkbox
		let clearDivCustomers = document.createElement("div");
		clearDivCustomers.setAttribute("class", "form-check");


		let clearLabelCustomers = document.createElement("label");
		clearLabelCustomers.setAttribute("class", "form-check-label");
		clearLabelCustomers.setAttribute("for", 'stepClearboxDARBIE');
		clearLabelCustomers.innerText = 'Select/Clear All';
		clearDivCustomers.appendChild(clearLabelCustomers);
	}






	// create a select all/clear checkbox for otherDT dashboards
	let checkClearDBotherDT = document.querySelector("#otherDTBodyDARBIE");
	let divDBotherDT = document.createElement("div");
	divDBotherDT.setAttribute("class", "form-check d-flex");

	if(Object.keys(dataObject.dashboards_otherdt).length > 0) {
		let inputDashboardotherDT = document.createElement("input");
		inputDashboardotherDT.setAttribute("class", "form-check-input");
		inputDashboardotherDT.setAttribute("id", 'DBclearbox');
		inputDashboardotherDT.setAttribute("type", "checkbox");
		inputDashboardotherDT.addEventListener("click", function (evt) {

			let checkboxesotherDT = document.querySelectorAll("#otherDTBodyDARBIE input[type='checkbox']");
			for (let check in checkboxesotherDT) {
				// checks or unchecks all monitors when clicked
				evt.currentTarget.checked ?
					checkboxesotherDT[check].checked = true :
					checkboxesotherDT[check].checked = false;
			}

			if(document.querySelector('.panel div[id^="list"] input:checked')){
				document.querySelector('#deleteDARBIE').disabled = false;
				document.querySelector('#overwriteDARBIE').disabled = false;
			} else {
				document.querySelector('#deleteDARBIE').disabled = true;
				document.querySelector('#overwriteDARBIE').disabled = true;
			}
		});

		divDBotherDT.appendChild(inputDashboardotherDT);
		let labelDBotherDT = document.createElement("label");
		labelDBotherDT.setAttribute("class", "form-check-label");
		labelDBotherDT.setAttribute("for", 'DBclearbox');
		labelDBotherDT.innerText = 'Select/Clear All';
		divDBotherDT.appendChild(labelDBotherDT);

		checkClearDBotherDT.appendChild(divDBotherDT);
	}

	//Creates the list of DT Other dashboards
	//Order alphabetically
	let orderedOther = {};
	Object.keys(dataObject.dashboards_otherdt).sort().forEach(function(key) {
		orderedOther[key] = dataObject.dashboards_otherdt[key];
	});
	let allDashboardsotherDT = orderedOther;
	for(d in allDashboardsotherDT){

		let appCardotherDT = document.querySelector("#otherDTBodyDARBIE");
		let divDotherDT = document.createElement("div");
		divDotherDT.setAttribute("class", "form-check d-flex");
		divDotherDT.setAttribute("id", "listotherDTDARBIE");

		let inputDBotherDT = document.createElement("input");
		inputDBotherDT.setAttribute("class", "form-check-input");
		inputDBotherDT.setAttribute("id", d);
		inputDBotherDT.setAttribute("type", "checkbox");
		inputDBotherDT.addEventListener("change", function (evt) {

			if(document.querySelector('.panel div[id^="list"] input:checked')){
				document.querySelector('#deleteDARBIE').disabled = false;
				document.querySelector('#overwriteDARBIE').disabled = false;
			} else {
				document.querySelector('#deleteDARBIE').disabled = true;
				document.querySelector('#overwriteDARBIE').disabled = true;
			}


		});
		divDotherDT.appendChild(inputDBotherDT);

		let labelotherDT = document.createElement("label");
		labelotherDT.setAttribute("class", "form-check-label");
		labelotherDT.setAttribute("for", d);
		labelotherDT.innerText = `${allDashboardsotherDT[d]} - (${d})`;
		divDotherDT.appendChild(labelotherDT);


		appCardotherDT.appendChild(divDotherDT);
		// create a select all/clear checkbox
		let clearDivotherDT = document.createElement("div");
		clearDivotherDT.setAttribute("class", "form-check");


		let clearLabelotherDT = document.createElement("label");
		clearLabelotherDT.setAttribute("class", "form-check-label");
		clearLabelotherDT.setAttribute("for", 'stepClearboxDARBIE');
		clearLabelotherDT.innerText = 'Select/Clear All';
		clearDivotherDT.appendChild(clearLabelotherDT);
	}

}

/**
 * Renders a radio button for the application tied to the application name and id (For DARBIE side)
 * @param displayName - the application mame
 * @param appValue - the ID of the application
 * @param KUAs - key user actions
 * @param CGs - conversion goals
 */
function createApplicationInputDARBIE(displayName, appValue, KUAs, CGs) {
	let appCard = document.querySelector("#appBodyDARBIE");
	let div = document.createElement("div");
	div.setAttribute("class", "form-check justify-content-end");
	div.setAttribute("style","margin-top:20px;");
	div.setAttribute("id", appValue+"DARBIE");
	let input = document.createElement("input");
	input.setAttribute("class", "form-check-input");
	input.setAttribute("type", "checkbox");
	input.addEventListener("change", function (evt) {
		//document.querySelector("#enableRumDARBIE").checked = true;
		const selector = `#${appValue}DARBIE input`;

		let KUABoxes = document.querySelectorAll(`#${appValue}-KUA input`);
		for(let KUAB in KUABoxes){
			// checks or unchecks all monitors when clicked
			if(evt.currentTarget.checked){
				KUABoxes[KUAB].checked = true;
				//KUABoxes[KUAB].disabled = false;
			} else {
				KUABoxes[KUAB].checked = false;
				//KUABoxes[KUAB].disabled = true;
			}

			if(KUABoxes[KUAB].id!== undefined && KUABoxes[KUAB].id.indexOf('Clear') === -1){
				saveEventOrder(evt,"KUAs",appValue, KUABoxes[KUAB].id)
			}
		}

		let CGBoxes = document.querySelectorAll(`#${appValue}-CG input`);
		for(let CGB in CGBoxes){
			// checks or unchecks all monitors when clicked
			if(evt.currentTarget.checked){
				CGBoxes[CGB].checked = true;
			} else {
				CGBoxes[CGB].checked = false;
			}

			if(CGBoxes[CGB].id!== undefined && CGBoxes[CGB].id.indexOf('Clear') === -1){
				saveEventOrder(evt,"CGs",appValue, CGBoxes[CGB].id)
			}
		}

	});
	div.appendChild(input);

	let label = document.createElement("label");
	label.setAttribute("class", "form-check-label");
	label.setAttribute("for", appValue+"DARBIE");
	label.setAttribute("title",`${displayName} - (${appValue.split("-")[1]})`)

	if(displayName.length >= 20){
		let trimmedName = displayName.trimExcess(20)
		label.innerText = `${trimmedName} - (${appValue.split("-")[1]})`;
	} else {
		label.innerText = `${displayName} - (${appValue.split("-")[1]})`;
	}
	div.appendChild(label);


	// adds the dropdownKUA button to the end of the label
	if(KUAs){
		let dropdownKUA = document.createElement('button');
		dropdownKUA.setAttribute("class", "btn btn-outline-primary btn-sm float-right");
		dropdownKUA.setAttribute("type", "button");
		dropdownKUA.setAttribute("style", "margin-left: 5px;");
		dropdownKUA.setAttribute("data-toggle", "collapse");
		dropdownKUA.setAttribute("data-target", `#${appValue}-KUA`);
		dropdownKUA.setAttribute("aria-expanded", "false");
		dropdownKUA.setAttribute("aria-controls", appValue + '-KUA');
		dropdownKUA.innerText = "Show Key UAs";
		div.appendChild(dropdownKUA);
	} else {
		let dropdownKUA = document.createElement('button');
		dropdownKUA.setAttribute("class", "btn btn-outline-primary btn-sm float-right");
		dropdownKUA.setAttribute("type", "button");
		dropdownKUA.setAttribute("style", "margin-left: 5px; width: 102px; color:#ff0000; border-color:#ff0000");
		dropdownKUA.setAttribute("data-toggle", "collapse");
		dropdownKUA.setAttribute("aria-expanded", "false");
		dropdownKUA.setAttribute("disabled", "true");
		dropdownKUA.innerText = "No Key UAs";
		div.appendChild(dropdownKUA);
	}


	// adds the dropdownCGs button to the end of the label
	if(CGs){
		let dropdownCG = document.createElement('button');
		dropdownCG.setAttribute("class", "btn btn-outline-primary btn-sm float-right");
		dropdownCG.setAttribute("type", "button");
		dropdownCG.setAttribute("style", "margin-left: 5px;");
		dropdownCG.setAttribute("data-toggle", "collapse");
		dropdownCG.setAttribute("data-target", `#${appValue}-CG`);
		dropdownCG.setAttribute("aria-expanded", "false");
		dropdownCG.setAttribute("aria-controls", appValue + '-CG');
		dropdownCG.innerText = "Show Conversion Goals";
		div.appendChild(dropdownCG);
	} else {
		let dropdownCG = document.createElement('button');
		dropdownCG.setAttribute("class", "btn btn-outline-primary btn-sm float-right");
		dropdownCG.setAttribute("type", "button");
		dropdownCG.setAttribute("style", "margin-left: 5px; width: 158px; color:#ff0000; border-color:#ff0000");
		dropdownCG.setAttribute("data-toggle", "collapse");
		dropdownCG.setAttribute("aria-expanded", "false");
		dropdownCG.setAttribute("disabled", "true");
		dropdownCG.innerText = "No Conversion Goals";
		div.appendChild(dropdownCG);
	}


	appCard.appendChild(div);


	// creates another div to have the KUAs shown in a collapsible card
	let KUAsDiv = document.createElement("div");
	KUAsDiv.setAttribute("class", "collapse");
	KUAsDiv.setAttribute("id", appValue + '-KUA');
	let cardBodyKUA = document.createElement("div");
	cardBodyKUA.setAttribute("class", "card card-body");
	cardBodyKUA.setAttribute("style","margin-top:20px;")


	// create a select all/clear checkbox
	let clearDivKUA = document.createElement("div");
	clearDivKUA.setAttribute("class", "form-check");

	let clearInputKUA = document.createElement("input");
	clearInputKUA.setAttribute("class", "form-check-input");
	clearInputKUA.setAttribute("id", 'KUAClearbox');
	clearInputKUA.setAttribute("type", "checkbox");
	//clearInputKUA.setAttribute("disabled", "disabled");
	clearInputKUA.addEventListener("click", function (evt) {



		let checkboxesKUA = document.querySelectorAll(`#${appValue}-KUA input[type='checkbox']`);
		for (let checkKUA in checkboxesKUA) {
			// checks all KUAs if the select all is checked or unchecks them if not
			if(checkboxesKUA[checkKUA].id !== undefined && checkboxesKUA[checkKUA].id.indexOf('Clear') === -1){
				saveEventOrder(evt,"KUAs",appValue,checkboxesKUA[checkKUA].id)
			}

			if(evt.currentTarget.checked) {
				checkboxesKUA[checkKUA].checked = true;
				document.querySelector(`#${appValue}DARBIE`).firstChild.checked = true;
			} else {
				checkboxesKUA[checkKUA].checked = false;
				//document.querySelector(`#${appValue}DARBIE`).firstChild.checked = false;
			}
		}
	});


	clearDivKUA.appendChild(clearInputKUA);

	let clearLabelKUA = document.createElement("label");
	clearLabelKUA.setAttribute("class", "form-check-label");
	clearLabelKUA.setAttribute("for", 'KUAClearbox');
	//clearLabelKUA.setAttribute("disabled", "disabled");
	clearLabelKUA.innerText = 'Select/Clear All';
	clearDivKUA.appendChild(clearLabelKUA);

	cardBodyKUA.appendChild(clearDivKUA);

	for(let KUA in KUAs){
		if(KUAs.hasOwnProperty(KUA)){
			let KUADiv = document.createElement("div");
			KUADiv.setAttribute("class", "form-check");

			let KUAInput = document.createElement("input");
			KUAInput.setAttribute("class", "form-check-input");
			KUAInput.setAttribute("id", KUAs[KUA].id);
			KUAInput.setAttribute("DTName", KUAs[KUA].actionName);
			KUAInput.setAttribute("DTType", KUAs[KUA].actionType);
			KUAInput.setAttribute("type", "checkbox");
			//KUAInput.setAttribute("disabled", "disabled");
			KUAInput.addEventListener("click", function (evt) {
				if(KUAs[KUA].id !== undefined && KUAs[KUA].id.indexOf('Clear') === -1){
					saveEventOrder(evt,"KUAs",appValue,KUAs[KUA].id)
				}

				//Unchecks the box for the application if all KUAs are deselected
				/*
				let allKUABoxes = document.querySelectorAll(`div[id="${appValue}-KUA] > input:checked`)
				if(allKUABoxes.length == 0){
					document.querySelector(`#${appValue}DARBIE`).firstChild.checked = false;
				}*/

				if(evt.currentTarget.checked){
					document.querySelector(`#${appValue}DARBIE`).firstChild.checked = true;
					document.querySelector(`#${appValue}`).checked = true;
				}

			});
			KUADiv.appendChild(KUAInput);

			let KUALabel = document.createElement("label");
			KUALabel.setAttribute("class", "form-check-label");
			KUALabel.setAttribute("for", KUAs[KUA].id);
			KUALabel.innerText = `${KUAs[KUA].actionName} - (${KUAs[KUA].actionType}) - ${KUAs[KUA].id}`;
			KUADiv.appendChild(KUALabel);
			cardBodyKUA.appendChild(KUADiv);
			KUAsDiv.appendChild(cardBodyKUA);
		}
	}

	appCard.appendChild(KUAsDiv);





	// creates another div to have the CGs shown in a collapsible card
	let CGsDiv = document.createElement("div");
	CGsDiv.setAttribute("class", "collapse");
	CGsDiv.setAttribute("id", appValue + '-CG');
	let cardBodyCG = document.createElement("div");
	cardBodyCG.setAttribute("class", "card card-body");
	cardBodyCG.setAttribute("style","margin-top:20px;");


	// create a select all/clear checkbox
	let clearDivCG = document.createElement("div");
	clearDivCG.setAttribute("class", "form-check");

	let clearInputCG = document.createElement("input");
	clearInputCG.setAttribute("class", "form-check-input");
	clearInputCG.setAttribute("id", 'CGClearbox');
	clearInputCG.setAttribute("type", "checkbox");
	//clearInputCG.setAttribute("disabled", "disabled");

	clearInputCG.addEventListener("click", function (evt) {
		let checkboxesCG = document.querySelectorAll(`#${appValue}-CG input[type='checkbox']`);
		for (let checkCG in checkboxesCG) {
			// checks all CGs if the select all is checked or unchecks them if not
			if(checkboxesCG[checkCG].id !== undefined && checkboxesCG[checkCG].id.indexOf('Clear') === -1){
				saveEventOrder(evt,"CGs",appValue,checkboxesCG[checkCG].id)
			}

			if(evt.currentTarget.checked) {
				checkboxesCG[checkCG].checked = true;
				document.querySelector(`#${appValue}DARBIE`).firstChild.checked = true;
			} else {
				checkboxesCG[checkCG].checked = false;
				//document.querySelector(`#${appValue}DARBIE`).firstChild.checked = false;
			}

		}

	});
	clearDivCG.appendChild(clearInputCG);

	let clearLabelCG = document.createElement("label");
	clearLabelCG.setAttribute("class", "form-check-label");
	clearLabelCG.setAttribute("for", 'CGClearbox');
	clearLabelCG.innerText = 'Select/Clear All';
	clearDivCG.appendChild(clearLabelCG);

	cardBodyCG.appendChild(clearDivCG);

	for(let CG in CGs){
		if(CGs.hasOwnProperty(CG)){
			let CGDiv = document.createElement("div");
			CGDiv.setAttribute("class", "form-check");

			let CGInput = document.createElement("input");
			CGInput.setAttribute("class", "form-check-input");
			CGInput.setAttribute("id", CGs[CG].id);
			CGInput.setAttribute("DTName", CGs[CG].name);
			CGInput.setAttribute("DTType", CGs[CG].actionType);
			CGInput.setAttribute("type", "checkbox");
			//CGInput.setAttribute("disabled", "disabled");
			CGInput.addEventListener("click", function (evt) {
				if(CGs[CG].id !== undefined && CGs[CG].id.indexOf('Clear') === -1){
					saveEventOrder(evt,"CGs",appValue,CGs[CG].id)
				}

				//Unchecks the application if no CGs are chosen.
				/*
				let allCGBoxes = document.querySelectorAll(`div[id="${appValue}-CG] > input:checked`)
				if(allCGBoxes.length == 0){
					document.querySelector(`#${appValue}DARBIE`).firstChild.checked = false;
				}*/

				if(evt.currentTarget.checked){
					document.querySelector(`#${appValue}`).checked = true;
					document.querySelector(`#${appValue}DARBIE`).firstChild.checked = true;
				}

			});
			CGDiv.appendChild(CGInput);

			let CGLabel = document.createElement("label");
			CGLabel.setAttribute("class", "form-check-label");
			CGLabel.setAttribute("for", CGs[CG].id);
			CGLabel.innerText = `${CGs[CG].name} - ${CGs[CG].id}`;
			CGDiv.appendChild(CGLabel);
			cardBodyCG.appendChild(CGDiv);
			CGsDiv.appendChild(cardBodyCG);
		}
	}

	appCard.appendChild(CGsDiv);

}


/**
 * Renders a checkbox for the synthetic test labeled as the monitor name and id. (For DARBIE)
 * @param displayName - monitor name
 * @param synValue - synthetic test id
 */
function createSyntheticInputDARBIE(displayName, synValue) {

	let appCard = document.querySelector("#synthBodyDARBIE");
	let div = document.createElement("div");
	div.setAttribute("class", "form-check d-flex");
	div.setAttribute("id", "synthTestDARBIE");

	let input = document.createElement("input");
	input.setAttribute("class", "form-check-input");
	input.setAttribute("id", synValue);
	//input.setAttribute("disabled", "disabled");
	input.setAttribute("type", "checkbox");
	input.addEventListener("change", function (evt) {
		const selector = `#${synValue}DARBIE input`;
		checkListener(evt.currentTarget.checked, selector);
	});
	div.appendChild(input);

	let label = document.createElement("label");
	label.setAttribute("class", "form-check-label");
	label.setAttribute("for", synValue);
	label.innerText = `${displayName} - (${synValue.split("-")[1]})`;
	div.appendChild(label);


	appCard.appendChild(div);
	// create a select all/clear checkbox
	let clearDiv = document.createElement("div");
	clearDiv.setAttribute("class", "form-check");


	let clearLabel = document.createElement("label");
	clearLabel.setAttribute("class", "form-check-label");
	clearLabel.setAttribute("for", 'stepClearboxDARBIE');
	clearLabel.innerText = 'Select/Clear All';
	clearDiv.appendChild(clearLabel);
}

/**
 * Saves the order that events were clicked in so we can build out dashboards in that order
 * @param clickEvent - the event for the click
 * @param selectionType - This is either CGs or KUAs as a string
 * @param appValue - This is the ID for the application
 * @param selectionId - This is the ID for the CG or KUA
 */
function saveEventOrder(clickEvent,selectionType,appValue,selectionId){
	if(clickEvent.currentTarget.checked){
		if(!listenerOrder[appValue]){
			listenerOrder[appValue] = {};
			listenerOrder[appValue]["CGs"] = [];
			listenerOrder[appValue]["KUAs"] = [];
		}
		if(listenerOrder[appValue][selectionType].indexOf(selectionId) === -1){
			listenerOrder[appValue][selectionType].push(selectionId)
		}
	} else {
		if(!listenerOrder[appValue]){
			listenerOrder[appValue] = {};
			listenerOrder[appValue]["CGs"] = [];
			listenerOrder[appValue]["KUAs"] = [];
		}
		if(listenerOrder[appValue][selectionType].indexOf(selectionId) !== -1){
			listenerOrder[appValue][selectionType].splice(listenerOrder[appValue][selectionType].indexOf(selectionId),1)
		}
	}
	//console.log(listenerOrder)
}

/**
 Huge function that does all the configuring of the dashboards
 */
function configureDashboards(selectionType){

	let apitoken = document.getElementById("apiTokenDARBIE").value;
	if (apitoken !== "") {
		let blockDeployment = false;

		if(dataObject.managed){
			let managedFull = dataObject.fullURL.split('/e/');
			dataObject.fullURL = managedFull[0]+'/e/'+managedFull[1].split('/')[0]
		} else {
			dataObject.fullURL = dataObject.fullURL.split('.com')[0]+'.com';
		}

		//This analyzes what has been checked or not to determine which dashboards we're building.

		//check application configuration settings
		let isDARBIERUMChecked = false;
		let isDARBIESynthChecked = false;

		let allRUMBoxes = document.querySelectorAll('#appBodyDARBIE div[id$="-KUA"] input[id^="APPLICATION_METHOD"]');
		for(let i=0; i<allRUMBoxes.length; i++){
			if(allRUMBoxes[i].checked){
				isDARBIERUMChecked = true;
			}
		}

		let allSynthBoxes = document.querySelectorAll('#synthBodyDARBIE input');
		for(let s=0; s<allSynthBoxes.length; s++){
			if(allSynthBoxes[s].id.indexOf('SYNTHETIC_TEST-') > -1){
				if(allSynthBoxes[s].checked){
					isDARBIESynthChecked = true;
				}
			}
		}

		for(let d in dataObject.dashboards_insights){
			//Look through the dashboards so far and find how many of each we have.
			if(foundDashboards[d.split('-')[0]] || foundDashboards[d.split('-')[0]] === 0){
				let existingDVal = parseInt(foundDashboards[d.split('-')[0]]);
				let newDVal = parseInt(d.split('-')[d.split('-').length-1]);

				//Simple check to always make the object contain largest value for the # of dashboards in each ID.
				//We use this later to determine what ID to generate for new dashboards so we don't overwrite existing ones.
				if(newDVal > existingDVal){
					foundDashboards[d.split('-')[0]] = newDVal
				}
			}
		}


		return new Promise((resolve, reject) => {

			let allInsightsDB = dataObject.dashboards_insights;

			if(isDARBIERUMChecked){

				//Grab all applications that have been checked
				let appChecks = document.querySelectorAll('.justify-content-end input');
				for(let a in appChecks){
					if(appChecks[a].checked){

						let dbID = null;
						let dbIDKUA = null;
						let dbQuantity = null;

						//Creates the Application Overview Dashboards
						if(appChecks[a].parentElement instanceof HTMLElement){
							if(appChecks[a].parentElement.id.indexOf('APPLICATION-') > -1){

								let strippedAppName = appChecks[a].parentElement.querySelector('label').title.split(' - (')[0];

								//Get the App ID and check if we have 0 KUAs selected, or more than 42 selected. If we do, we need to stop the deployment of the KUA dashboard.
								let appIDCheck = appChecks[a].parentElement.id.split('DARBIE')[0];
								let allSelectedKUAs = document.querySelectorAll(`div[id="${appIDCheck}-KUA"] input[id^="APPLICATION_METHOD"]:checked`)

								if(allSelectedKUAs.length == 0){
									blockDeployment = true;
								}

								if(allSelectedKUAs.length > 42){
									document.querySelector('#bottomDARBIE').innerText = 'You have selected more than 42 KUAs for one application. 42 is the maximum we can deploy. Please remove some to continue with the KUA dashboard deployment.'
									document.querySelector('a[href="#bottomDARBIE"]').click();
									blockDeployment = true;
								}

								if(selectionType === 'Overwrite'){
									//Replace existing IDs
									for(let d in allInsightsDB){
										if(allInsightsDB[d].indexOf(strippedAppName) > -1){

											//If the dashboard has the ID for app overview
											if(d.split('-')[0] === '00000002'){
												dbID = d.split('-')[d.split('-').length-1]
											}

											//If the dashboard has the ID for KUAs
											if(d.split('-')[0] === '00000003'){
												dbIDKUA = d.split('-')[d.split('-').length-1]
											}
										}
									}
								} else {
									//Generate a new ID for app overview dashboards
									if(foundDashboards['00000002'] > 0){
										dbQuantity = parseInt(foundDashboards['00000002']);
										//Increment the dashboard count by 1 and add 0s to it to fit our UUID format.
										dbID = dbQuantity+=1;
										dbID = dbID.toString().padStart(8, "0");
									} else {
										dbID = '00000001'
									}

									//Generate a new ID for KUA dashboards
									if(foundDashboards['00000003'] > 0){
										dbQuantity = parseInt(foundDashboards['00000003']);
										//Increment the dashboard count by 1 and add 0s to it to fit our UUID format.
										dbIDKUA = dbQuantity+=1;
										dbIDKUA = dbIDKUA.toString().padStart(8, "0");
									} else {
										dbIDKUA = '00000001'
									}
								}

								if(!dbID && !dbIDKUA){
									//We don't have an ID yet for some reason, need to pop up a warning.
									document.querySelector('#bottomDARBIE').innerText = 'You chose to replace application dashboards, but did not select the correct application(s) from the RUM section!'
									document.querySelector('a[href="#bottomDARBIE"]').click();
									blockDeployment = true;
								}


								if(dbID && dbIDKUA && blockDeployment===false){
									let dAppOverviewNew = JSON.stringify(dAppOverview(dbID,dbIDKUA));
									let appID = appChecks[a].parentElement.id.split('DARBIE')[0];
									let appName = Object.keys(dataObject.applications).find(key => dataObject.applications[key] === appID);
									dAppOverviewNew = dAppOverviewNew.split('APPLICATION-ID').join(appID);
									dAppOverviewNew = dAppOverviewNew.split('[Application Name]').join(appName);
									foundDashboards['00000002'] = parseInt(dbID);
									requestAsync(dataObject.fullURL + '/api/config/v1/dashboards/00000002-bbbb-dddd-aaaa-'+dbID,'PUT',dAppOverviewNew);

									//Send the ID and name to our global var for use in the Tenant Overview dashboard
									createdApplications['00000002-bbbb-dddd-aaaa-'+dbID] = appName;


									if(listenerOrder[appID] && listenerOrder[appID].KUAs){
										//Creates the KUA Dashboards
										let dAppKUAsNew = JSON.stringify(dAppKUAs(dbIDKUA,dbID,listenerOrder[appID].KUAs,));
										let appName = Object.keys(dataObject.applications).find(key => dataObject.applications[key] === appID);
										dAppKUAsNew = dAppKUAsNew.split('[Application Name]').join(appName);
										foundDashboards['00000003'] = parseInt(dbIDKUA)
										requestAsync(dataObject.fullURL + '/api/config/v1/dashboards/00000003-bbbb-dddd-aaaa-'+dbIDKUA,'PUT',dAppKUAsNew)
									}
								} else if ((dbID && !dbIDKUA) || (!dbID && dbIDKUA)){
									document.querySelector('#bottomDARBIE').innerText = 'If you are replacing application dashboards, you must replace the application overview and the appropriate KUA dashboard for that application. If you are missing one or the other, delete the remaining one you have and generate new ones as they are meant to be a pair.'
									document.querySelector('a[href="#bottomDARBIE"]').click();
									blockDeployment = true;
								}

							}
						}
					}
				}


			}


			if(isDARBIESynthChecked){
				let synthList = document.querySelectorAll("#synthTestDARBIE input[type='checkbox']:checked");

				let selectedDBs = document.querySelectorAll('#insightsDARBIE input');
				let dbIDSynth, synthPID, synthAID, dbQuantity;
				if(selectionType === 'Overwrite'){
					//Replace existing IDs
					for (let s in selectedDBs){
						if(selectedDBs[s].id && selectedDBs[s].checked){


							//Checking to see if we've selected a Synthetic Monitor view dashboard
							if(selectedDBs[s].id.indexOf('00000004-') > -1){
								dbIDSynth = selectedDBs[s].id.split('-')[selectedDBs[s].id.split('-').length-1]
							}

							//Checking to see if we've selected a Synthetic performance dashboard
							if(selectedDBs[s].id.indexOf('00000005-') > -1){
								synthPID = selectedDBs[s].id.split('-')[selectedDBs[s].id.split('-').length-1]
							}

							//Checking to see if we've selected a Synthetic availability dashboard
							if(selectedDBs[s].id.indexOf('00000006-') > -1){
								synthAID = selectedDBs[s].id.split('-')[selectedDBs[s].id.split('-').length-1]
							}


						}
					}
				} else {

					//Generate a new ID for Synth Monitor dashboard
					if(foundDashboards['00000004'] > 0){
						dbQuantity = parseInt(foundDashboards['00000004']);
						//Increment the dashboard count by 1 and add 0s to it to fit our UUID format.
						dbIDSynth = dbQuantity+=1;
						dbIDSynth = dbQuantity.toString().padStart(8, "0");
					} else {
						dbIDSynth = '00000001'
					}

					//Generate a new ID for Synth performance dashboards
					if(foundDashboards['00000005'] > 0){
						dbQuantity = parseInt(foundDashboards['00000005']);
						//Increment the dashboard count by 1 and add 0s to it to fit our UUID format.
						synthPID = dbQuantity+=1;
						synthPID = synthPID.toString().padStart(8, "0");
					} else {
						synthPID = '00000001'
					}

					//Generate a new ID for Synth availability dashboards
					if(foundDashboards['00000006'] > 0){
						dbQuantity = parseInt(foundDashboards['00000006']);
						//Increment the dashboard count by 1 and add 0s to it to fit our UUID format.
						synthAID = dbQuantity+=1;
						synthAID = synthAID.toString().padStart(8, "0");
					} else {
						synthAID = '00000001'
					}


				}

				if(!dbIDSynth || !synthPID || !synthAID){
					//We don't have an ID for one of these yet for some reason, need to pop up a warning.
					document.querySelector('#bottomDARBIE').innerText = 'You chose to replace synthetic dashboards but did not click either the synthetic dashboards, or the synthetic tests to replace them with!'
					document.querySelector('a[href="#bottomDARBIE"]').click();
					blockDeployment = true;
				}

				if(synthList.length>0 && blockDeployment === false) {
					for(let s=0; s<synthList.length; s++) {
						let synthId = synthList[s].getAttribute("id");
						let synthName = synthList[s].parentElement.lastChild.innerText.split(' - (')[0];
						if(listenerOrder['Synthetic']){
							if(listenerOrder['Synthetic'].length < 64){
								listenerOrder['Synthetic'].push([synthId, synthName])
							} else {
								document.querySelector('#bottomDARBIE').innerText = 'We can only use a maximum of 64 synthetic tests for our dashboards. The first 64 that were chosen will be used, the rest will be ignored.'
								document.querySelector('a[href="#bottomDARBIE"]').click();
							}
						} else {
							listenerOrder['Synthetic'] = [[synthId,synthName]];
						}
					}

				}

				if(listenerOrder['Synthetic'] && blockDeployment === false){

					//Send all our IDs to our global variable
					if(dbIDSynth){
						foundDashboards['00000004'] = parseInt(dbIDSynth)
					}

					if(synthPID){
						foundDashboards['00000005'] = parseInt(synthPID)
					}

					if(synthAID){
						foundDashboards['00000006'] = parseInt(synthAID)
					}


					if(synthPID && synthAID && dbIDSynth){
						//Creates Synthetic Performance Dashboards
						let dSyntheticPerfNew = JSON.stringify(dSyntheticPerf(synthPID,dbIDSynth));
						requestAsync(dataObject.fullURL + '/api/config/v1/dashboards/00000005-bbbb-dddd-aaaa-'+synthPID,'PUT',dSyntheticPerfNew);

						//Creates Synthetic Availability Dashboards
						let dSyntheticAvailNew = JSON.stringify(dSyntheticAvail(synthAID,dbIDSynth));
						requestAsync(dataObject.fullURL + '/api/config/v1/dashboards/00000006-bbbb-dddd-aaaa-'+synthAID,'PUT',dSyntheticAvailNew);


						//Creates Synthetic Monitor View Dashboards
						let dMonitorViewNew = JSON.stringify(dSyntheticMonitorView(dbIDSynth));
						requestAsync(dataObject.fullURL + '/api/config/v1/dashboards/00000004-bbbb-dddd-aaaa-'+dbIDSynth,'PUT',dMonitorViewNew)
					}
				}



			}

			if(blockDeployment === false){
				let analystName = document.getElementById("analystEmailDARBIE").value;

				if(analystName.length > 0 && analystName.indexOf('@') > -1){
					//Creates the Insights Overview Dashboard if an analyst email was provided
					let dInsightsOverviewNew = JSON.stringify(dInsightsOverview(analystName));
					foundDashboards['00000007'] = parseInt('00000001');
					requestAsync(dataObject.fullURL + '/api/config/v1/dashboards/00000007-bbbb-dddd-aaaa-00000001','PUT',dInsightsOverviewNew)
				}

				//This creates the Tenant overview dashboard. We modify the breadcrumbs for it based on whether the customer has RUM, or Synthetic, or both inside of the function for it.
				let dTenantOverviewNew = JSON.stringify(dTenantOverview(createdApplications));
				requestAsync(dataObject.fullURL + '/api/config/v1/dashboards/00000001-bbbb-dddd-aaaa-00000001','PUT',dTenantOverviewNew, createdApplications).then(function(rRes){
					if (rRes[0] >= 200 && rRes[0] < 400) {
						document.querySelector('#generateDARBIE').innerText = 'Done!';
						document.querySelector('#generateDARBIE').disabled=true
					}
				});
			}

			//Checks if any options have been chosen in the configuration section. If at least 3 have, go ahead and deploy the funnel dashboard.
			let allFunnelChoices = document.querySelectorAll('#funnelList input.col-md-4');
			let funnelCount = 0;
			for(choice of allFunnelChoices){
				if(choice.value !== ''){
					funnelCount++
				}
			}

			if(funnelCount >= 3){
				//See if we already have any funnels. If we do, increment by 1, else start at 00000001.
				if(foundDashboards['00000008'] > 0){
					let dbQuantity = parseInt(foundDashboards['00000008']);
					//Increment the dashboard count by 1 and add 0s to it to fit our UUID format.
					funneldbID = dbQuantity+=1;
					funneldbID = funneldbID.toString().padStart(8, "0");
				} else {
					funneldbID = '00000001'
				}

				//Creates the funnel dashboard
				let dashboardChoice = document.querySelector('#simpleOpt').checked ? 'Simple' : 'Advanced';

				if(document.querySelector('#advOpt').checked){
					let allCGOptions = document.querySelectorAll('input[list^="CGs"]');
					for(eachCG of allCGOptions){
						if(eachCG.value !== ""){
							document.querySelector('#bottomDARBIE').innerText = 'You have chosen the "Advanced" option for dashboarding, but this option does not support Conversion Goals. We will automatically deploy a simple version instead. You can configure this again and choose to use only Key User Actions to get a more advanced version of the funnel dashboard.';
							document.querySelector('a[href="#bottomDARBIE"]').click();
							dashboardChoice = 'Simple'
						}
					}
				}

				let dFunnelDashboardNew = JSON.stringify(dFunnelDashboard(funneldbID, dashboardChoice));
				requestAsync(dataObject.fullURL + '/api/config/v1/dashboards/00000008-bbbb-dddd-aaaa-'+funneldbID,'PUT',dFunnelDashboardNew)
			}

			resolve();
		})
	} else {
		document.querySelector('#bottomDARBIE').innerText = 'Enter an API token first!';
		document.querySelector('a[href="#bottomDARBIE"]').click();
	}

}

/**
 Huge function that does all the configuring of the dashboards
 */
function gatherConfigInfoDARBIE(){


	//Checks what has been selected to determine which KUAs/CGs/Applications to display in the configuration screen.
	let isDARBIERUMChecked = false;

	let allRUMBoxes = document.querySelectorAll('#appBodyDARBIE > div[id^="APPLICATION-"] > input:checked').length;
	if(allRUMBoxes >= 1){
		document.querySelector('#funnelList').hidden = false
		isDARBIERUMChecked = true;
	} else {
		document.querySelector('#appCheckDARBIE').innerText = 'No RUM application chosen.'
		document.querySelector('#funnelList').hidden = true;
	}

	return new Promise((resolve, reject) => {
		if (isDARBIERUMChecked){
			//Grab the applications that have been checked
			let appCheck = document.querySelectorAll('.justify-content-end input:checked');

			//Convert that list to an array so we can splice it
			let newA = Array.prototype.slice.call(appCheck)

			//If more than 5 applications are selected, keep only the first 5. Limiting this out of display space concerns
			if(newA.length > 4){
				newA = newA.slice(0,6)
			}

			//Creates the 'User Action' or 'Conversion Goal' options for the non-key user action input section
			let allCGUAInputs = document.querySelectorAll('datalist[id^="KUAorCGdatalist"]')
			for(eachFunnel of allCGUAInputs){
				letUAOption = document.createElement("option")
				letCGOption = document.createElement("option")

				letUAOption.setAttribute("value", "User Action");
				letUAOption.innerHTML="User Action";

				letCGOption.setAttribute("value", "Conversion Goal");
				letCGOption.innerHTML="Conversion Goal";

				eachFunnel.appendChild(letUAOption);
				eachFunnel.appendChild(letCGOption);
			}


			for(eachApp of newA){
				//console.log(eachApp)
				if(eachApp.parentElement instanceof HTMLElement){
					if(eachApp.parentElement.id.indexOf('APPLICATION-') > -1){

						let appID = eachApp.parentElement.id.split('DARBIE')[0];
						let appName = Object.keys(dataObject.applications).find(key => dataObject.applications[key] === appID);

						//Check all our existing labels to see if we already have one for this application. Only create a new one if we don't.
						let allLabels = document.querySelectorAll('#applicationCheckboxesDARBIE > li > label');
						let matchingLabelCount = 0;

						for(eachLabel of allLabels){
							let nameCheck = ''
							if(appName.length >= 30){
								nameCheck = appName.trimExcess(20)
							} else {
								nameCheck = appName;
							}

							if(eachLabel.innerText == nameCheck){
								matchingLabelCount++
							}
						}

						if(matchingLabelCount == 0){
							let appCheckboxParent = document.querySelector("#applicationCheckboxesDARBIE");
							let appLI = document.createElement("li");
							appLI.setAttribute("class", "list-group-item flex-fill");
							appLI.setAttribute("style", "display: grid; grid-template-columns: 20px 0fr 0fr;");

							let appInput = document.createElement("input")
							appInput.setAttribute("class", "list-group-item")
							appInput.setAttribute("type", "checkbox")
							appInput.setAttribute("style", "margin-top:3px; margin-left:10px")

							let listedKUAs = [];

							appInput.addEventListener("click", function (evt) {

								if(evt.currentTarget.checked){
									//Populates the application name as well as the list of conversion goals and KUAs based on the chosen application
									//let strippedAppName = appCheck.parentElement.querySelector('label').title.split(' - (')[0];
									let allCGFunnelInputs = document.querySelectorAll('datalist[id^="CGs"]')
									for(eachFunnel of allCGFunnelInputs){
										if(dataObject.conversionGoals[appName]){
											if(dataObject.conversionGoals[appName].length > 0){
												for(listCG of dataObject.conversionGoals[appName]){
													if(listCG.type == 'UserAction'){
														let CGtag = document.createElement("option"),
															cgList = eachFunnel

														CGtag.setAttribute("value", listCG.name);
														CGtag.innerHTML = appName

														CGtag.setAttribute("data-value", listCG.id+'~~'+dataObject.applications[appName]+'~~'+appName+'~~'+'UserAction'+'~~CG')

														CGtag.innerHTML = appName;
														cgList.appendChild(CGtag);
													}
												}
											}
										}
									}

									let allKUAFunnelInputs = document.querySelectorAll('datalist[id^="KUAs"]')
									for(eachFunnel of allKUAFunnelInputs){
										if(dataObject.KUAs[appName]){
											if(dataObject.KUAs[appName].length > 0){
												for(listKUA of dataObject.KUAs[appName]){
													let KUAtag = document.createElement("option"),
														kuaList = eachFunnel

													KUAtag.setAttribute("value", listKUA.actionName);
													KUAtag.setAttribute("data-value", listKUA.id+'~~'+dataObject.applications[appName]+'~~'+appName+'~~'+listKUA.actionType+'~~KUA')
													listedKUAs.push(listKUA.id);

													KUAtag.innerHTML = 'Key User Action - ' +appName+' ('+listKUA.actionCount+' actions/min)'
													kuaList.appendChild(KUAtag);
												}
											}
										}

										if(dataObject.NUAs[appName]){
											if(dataObject.NUAs[appName].length > 0){
												for(listNUA of dataObject.NUAs[appName]){
													if(listedKUAs.indexOf(listNUA.id) === -1){
														let NUAtag = document.createElement("option"),
															NUAList = eachFunnel

														NUAtag.setAttribute("value", listNUA.actionName);
														NUAtag.setAttribute("data-value", listNUA.id+'~~'+dataObject.applications[appName]+'~~'+appName+'~~'+listNUA.actionType+'~~KUA')

														NUAtag.innerHTML = appName+' ('+listNUA.actionCount+' actions/min)'
														NUAList.appendChild(NUAtag);
													}
												}
											}
										}
									}

									let allPropFunnelInputs = document.querySelectorAll('datalist[id^="Properties"]')
									for(eachProp of allPropFunnelInputs){
										if(dataObject.appProperties[appName]){
											if(dataObject.appProperties[appName].length > 0){
												for(listProp of dataObject.appProperties[appName]){
													let Proptag = document.createElement("option"),
														propList = eachProp

													Proptag.setAttribute("value", listProp.displayName);
													Proptag.innerHTML = appName+' ('+listProp.type+' - '+listProp.targets+')'
													propList.appendChild(Proptag);
												}
											}
										}
									}

									let allAppNameInputs = document.querySelectorAll('datalist[id^="funnelAppName"]')
									for(eachFunnel of allAppNameInputs){
										let appOption = document.createElement("option")
										appOption.setAttribute("value", appName);
										appOption.innerHTML = appName
										eachFunnel.appendChild(appOption);
									}





								} else {

									let nameToFind = evt.currentTarget.nextSibling.title ? evt.currentTarget.nextSibling.title : evt.currentTarget.nextSibling.innerText

									let allOptions = document.querySelectorAll('#funnelList datalist option')

									for (opt of allOptions){
										if(opt.innerText.indexOf(nameToFind +' - ') > -1){
											//Found our text, get rid of it
											opt.remove();
										}
									}
								}

							});

							let appLabel = document.createElement("label")
							appLabel.setAttribute("class", "form-check-label")
							appLabel.setAttribute("style", "margin-left:10px")

							if(appName.length >= 30){
								let trimmedName = appName.trimExcess(20)
								appLabel.innerText = trimmedName
								appLabel.setAttribute("title", appName)
							} else {
								appLabel.innerText = appName;
							}

							appLI.append(appInput)
							appLI.append(appLabel)
							appCheckboxParent.append(appLI)
						}




					}
				}
			}
		}
	});


}

/**
 Function to delete dashboards, pretty self explanatory :)
 */
function deleteDashboards(){
	if(dataObject.managed){
		let managedFull = dataObject.fullURL.split('/e/');
		dataObject.fullURL = managedFull[0]+'/e/'+managedFull[1].split('/')[0]
	} else {
		dataObject.fullURL = dataObject.fullURL.split('.com')[0]+'.com';
	}

	let apitoken = document.getElementById("apiTokenDARBIE").value;
	//As long as an API token is selected
	if (apitoken !== "") {

		//Grab all dashboards that have been checked
		let dashboardsToDelete = document.querySelectorAll('.panel div[id^="list"] input:checked');

		//See if any of them are customer facing
		if(document.querySelector('.panel div#listCustomersDARBIE input:checked')){
			//Set a prompt to ask if they really want to delete those.
			if (confirm('You have selected at least one dashboard from the customer facing dashboard section. Are you sure you want to delete them?')) {
				// Double check
				if (confirm('Are you absolutely sure you want to delete these dashboards?')) {
					//They confirmed twice, delete them.
					return new Promise((resolve, reject) => {
						for(let i=0; i<dashboardsToDelete.length; i++){
							requestAsync(dataObject.fullURL + '/api/config/v1/dashboards/'+dashboardsToDelete[i].id,'DELETE', null, dashboardsToDelete[i].id).then(function(rRes){
								if (rRes[0] >= 200 && rRes[0] < 400) {
									document.querySelector('input[id="'+rRes[1]+'"]').parentElement.lastChild.innerText = 'Deleted!';
									document.querySelector('input[id="'+rRes[1]+'"]').disabled = true;
								}

							});


						}
						resolve();
					})
				}
			}
		} else if(document.querySelector('.panel div[id^="list"] input:checked')){
			//Some dashboards are checked, but not customer facing ones. Delete them with no prompt.
			return new Promise((resolve, reject) => {
				for(let i=0; i<dashboardsToDelete.length; i++){
					requestAsync(dataObject.fullURL + '/api/config/v1/dashboards/'+dashboardsToDelete[i].id,'DELETE', null, dashboardsToDelete[i].id).then(function(rRes){
						if (rRes[0] >= 200 && rRes[0] < 400) {
							document.querySelector('input[id="'+rRes[1]+'"]').parentElement.lastChild.innerText = 'Deleted!'
							document.querySelector('input[id="'+rRes[1]+'"]').disabled = true;
						}

					});
				}
				resolve();
			})
		}




	} else {
		document.querySelector('#bottomDARBIE').innerText = 'Enter an API token first!'
		document.querySelector('a[href="#bottomDARBIE"]').click();
	}
}
