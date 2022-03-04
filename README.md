# esri-WAP-widget-logisticsFrontEnd
This is a front end interface developed for accessing a custom geoprocessing tool.

It was created with with the aid of the ArcGIS Web ApBuilder SDK:  https://developers.arcgis.com/web-appbuilder/

It is deployed here: https://mapwv.gov/crc/ (widget is anchored in the UR of the app)

The primary functions of the front end are to:
collect inputs from the user; run basic checks on input (presence/absence); format and submit those inputs to an ESRI geoprocessing service; disply a busy signal to the user while waiting for response, and; display approriate message to the user on response and update the map with an X/Y location

the associated geoprocessing tool source code is available here: https://github.com/erghjunk/esri-ArcPy-logisticsBackEnd

and the live geoprocessing service itself is here: https://appservices.wvgis.wvu.edu/arcgis/rest/services/CRC/CRCTool/GPServer/turnrow%20logistics%20sharing%20tool/
