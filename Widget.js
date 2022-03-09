///////////////////////////////////////////////////////////////////////////
// Copyright © Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////
define(['dojo/_base/declare',
  'jimu/BaseWidget',
    'dojo/_base/html',
    'dojo/Deferred',
    'dojo/promise/all',
    'dojo/dom',
    'dojo/_base/lang',
    'esri/tasks/Geoprocessor',
    'dojo/on',
    'esri/request',
    'jimu/zoomToUtils',
    'jimu/dijit/LoadingIndicator',
    'esri/geometry/Point', 
    'esri/SpatialReference', 
    'esri/symbols/PictureMarkerSymbol',
    'esri/graphic'
],
function(declare, BaseWidget, html, Deferred, all, dom, lang, Geoprocessor, on, esriRequest, zoomToUtils, loadingIndicator, esriPoint, esriSpatialRef, esriPictureMarker, esriGraphic) {
  
  var clazz = declare([BaseWidget], {
    
    name: 'Logistics-Sharing-Tool',
    baseClass: 'logshare',

    startup: function(){
      this.startExtent = this.map.extent;
      this.spatialRef = this.map.spatialReference;
      this.url = 'https://appservices.wvgis.wvu.edu/arcgis/rest/services/CRC/CRCTool/GPServer/turnrow%20logistics%20sharing%20tool/';
      this.gp = new Geoprocessor(this.url);
      // flow control for returns from geoprocessing call
      this.own(on(this.gp, 'execute-complete', lang.hitch(this, this.report)));
      this.own(on(this.gp, 'error', lang.hitch(this, this.gperror)));
      this.loading = new loadingIndicator({
        hidden: true
      }, this.loadingNode);
      this.loading.startup();
    },

    clearLastResult: function(){
      var node = dom.byId('returnDiv');
      dojo.empty(node);
      zoomToUtils.zoomToExtent(this.map, this.startExtent);
      this.map.graphics.clear()
    }, 

    _showLoading: function(){
      this.loading.show();
      html.setStyle(this.loading, 'display', 'block');
    },

    _hideLoading: function(){
      html.setStyle(this.loading, 'display', 'none');
      this.loading.hide();
    },

    getInputValues: function(){
      // these are the ids of the divs from the web form
      var inputNodes = ['destA', 'destC', 'destS', 'destZ', 'delivByDate', 'quantity', 'unit'];
      var values = []
      dojo.forEach(inputNodes, function(node){
        if (node!=='delivByDate') {
          values.push(dom.byId(node).value);
      } else {
        // the GP service is expecing a date string of mm/dd/yyyy format so this reformats it
        temp = dom.byId(node).value;
        dateSplit = temp.split('-');
        correctDate = dateSplit[1] + '/' + dateSplit[2]  + '/' + dateSplit[0];
        // console.log(correctDate);
        values.push(correctDate);
      }
      })
      return values;
    },

    logisticsGP: function(){ 
      this.clearLastResult();
      this._showLoading();
      var params = this.getInputValues();
      if (this.hasNullValues(params) == true){
        this.formerror();
        return
      }
      var paramsObj = {Address:params[0], City:params[1], State:params[2], Zip:params[3], Date:params[4], Quantity:params[5], Unit:params[6]}
      console.log(paramsObj);
      // Send a request to service url to make it added to corsEnabledServers.
      esriRequest({
        url: this.url,
        content: {
          f: 'json'
        },
        handleAs : 'json',
        callbackParamName:'Result'
      }).then(lang.hitch(this, function(){
      this.gp.execute(paramsObj);
      }));
    },

    hasNullValues: function(arr){
      for(var i=0; i<arr.length; i++) {
        if(arr[i] === "") return true;
      }
      return false;
      },

    formerror: function(){
      this._hideLoading();
      // this fires if the user doesn't fill out the form completely
      var node = dom.byId('returnDiv');
      var div = dojo.create('div', {id: 'errorDiv', class: 'error'}, node);
      var returnMessage = 'Please fill out the form completely!';
      div.innerHTML = returnMessage;
    },

    gperror: function(dataFull){
      this._hideLoading();
      // this fires if gp.execute returns an error
      console.log(dataFull);
      var node = dom.byId('returnDiv');
      var div = dojo.create('div', {id: 'errorDiv', class: 'error'}, node);
      var returnMessage = 'There was a problem! Please check the address and date and try again.';
      div.innerHTML = returnMessage;
    },

    report: function(dataFull){
      this._hideLoading();
      console.log(dataFull);
      var data = dataFull.results[0].value;
      console.log(data);
      var node = dom.byId('returnDiv');
      if (data.outputFlag == 1) {
        var div1 = dojo.create('div', {id: 'add', class: 'address'}, node);
        div1.innerHTML = 'For delivery to ' + data.message[0].destFull + ': ';
        for (var i = 0; i <= parseInt(data.routes); i++) {
          let iString = i.toString();
          var divId = 'div' + iString;
          var div = dojo.create('div', {id: divId, class: 'route'}, node); //needs a div class for CSS purposes
          if (data.message[i].capacity.length == 0) {
            var returnMessage = 'For delivery on ' + data.message[i].delivDate + ', deliver products to ' + data.message[i].partnerName + ' no later than noon on ' + data.message[i].aggDate + '. ' + data.message[i].distanceMessage + ' Contact them to arrange final details: ' + data.message[i].partnerPOC + '; ' + data.message[i].partnerAddress + '; ' + data.message[i].partnerPhone + '; ' + data.message[i].partnerEmail;
          } else { // end of inner if, start of inner else
            var returnMessage = data.message[i].capacity + ' For delivery on ' + data.message[i].delivDate + ', deliver products to ' + data.message[i].partnerName + ' no later than noon on ' + data.message[i].aggDate + '. ' + data.message[i].distanceMessage + ' Contact them to arrange final details: ' + data.message[i].partnerPOC + '; ' + data.message[i].partnerAddress + '; ' + data.message[i].partnerPhone + '; ' + data.message[i].partnerEmail;
          } // end of inner if else
          div.innerHTML = returnMessage;
          var destination = [data.destX, data.destY];
          this.mapMoveAndDraw(destination);
        } // end of for                           
      } else { // end of outer if, start of outer else
        var div = dojo.create('div', {id: 'errorDiv', class: 'error'}, node);
        var returnMessage = data.message;
        div.innerHTML = returnMessage;
      } //end of outer if else
    }, // end of report fn

    mapMoveAndDraw: function(location){
      this.map.centerAndZoom(location, 12);
      var point = new esriPoint(location, new esriSpatialRef({wkid:4326}));
      var pictureSymbol = new esriPictureMarker({
        "type" : "esriPMS",
        "url" : "widgets/LogisticsSharing/images/destination.png",
        "contentType" : "image/png",
        "width" : 40,
        "height" : 40,
        "xoffset" : 0,
        "yoffset" : 8
      });
      var graphic = new esriGraphic(point, pictureSymbol);
      this.map.graphics.add(graphic);
    }
  }); // end of master constructor
  return clazz;
});
