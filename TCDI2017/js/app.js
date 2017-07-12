//Extend L.GeoJSON -- add setOptions method
L.GeoJSON = L.GeoJSON.extend({
    setOptions: function(opts) {
        //save original json data
        this._data = this._data || this.toGeoJSON();
        //destory layer group
        this.clearLayers();
        L.setOptions(this, opts);
        //recreate layer group
        this.addData(this._data);
    },
    //return polygon layers that contain the given point
    identify: function(latlng) {
        var geopoint = {
                type: 'Point',
                coordinates: [latlng.lng, latlng.lat]
            },
            features = new L.FeatureGroup();
        this.eachLayer(function(layer) {
            if (gju.pointInPolygon(geopoint, layer.feature.geometry)) {
                features.addLayer(layer);
            }
        });
        return features;
    }
});


var map;
var mapLayers = [], identifyLayers = [];
var layer_ids = [];

//OPEN ABOUT DIALOG
//$('#aboutModal').modal();
//   $('#slidercase').appendTo('#map');

$(window).resize(function() {
    $('.tt-dropdown-menu').css('max-height', $('#container').height() - $('.navbar').height() - 20);
});

    //Layer Control Modifications
    $('input:checkbox[name="layerTCDI"]').on('change', function() {    //Target checkbox input element with the name 'layerTCDI'  and trigger a function after a change to that element
        var layers = []; // Create array to store variables
        $('input:checkbox[name="layerTCDI"]').each(function() { // Target checkbox input element with the name 'layerTCDI' and pass each item in array through function
            // Remove all overlay layers
            hideLayer($(this).attr('id')); // Hide this object (item in array)
            if ($('#' + $(this).attr('id')).is(':checked')) { // Check to see if item has the checkbox attribute :checked
                // Add checked layers to array for sorting
                showLayer($(this).attr('id')); // Show layer associated with checked item 
                layers.push($(this).attr('id')); // Push the 'id' tag of checked item to array

            }
        });
        identifyLayers = layers; // Move local array (layer) to a global array (identifyLayers)

    });



    //Document Ready
    $(document).ready(function() {
        //set checkbox status
        $('.legPanel').each(function() { // Target elements containing the class '.legPanel' and pass each element through function
        var loadall = $(this).find('input.layer').length;
        var loadchecked = $(this).find('input.layer:checked').length; // Create variable 'loadChecked' and set it to the number of checked layers
            if (loadall == loadchecked) { // Check to see if number of layers in loadChecked is equal to the total number of layers
                $(this).closest('.panel').find('input.checked_all').prop('checked', true); // if loadChecked == loadAll mark "checked_all" checkbox as true (checked)
            } else {
                $(this).closest('.panel').find('input.checked_all').prop('checked', false); // if loadChecked =/= loadAll mark "checked_all" checkbox as false (unchecked)
            }

        });
      //  layer group check all functionality
        // $('input.checked_all').on('change', function() {

        //     //var listPanel = $(this)
        //     var $element = $(this);
        //     if ($element.prop('checked') == true) {
        //         $element.siblings('.checkbox').find('input').prop('checked', true).change();
        //     } else {
        //         $element.siblings('.checkbox').find('input').prop('checked', false).change();
        //     }
        // });
    });
    // //update check all button on layer toggle
    // $('.layer').on('change', function() {

    //     var all = $(this).closest('.panel-body').find('input.layer').length;
    //     var checked = $(this).closest('.panel-body').find('input.layer:checked').length;
    //     if (all == checked) {
    //         $(this).closest('.panel').find('input.checked_all').prop('checked', true);

    //     }
    //     else {
    //         $(this).closest('.panel').find('input.checked_all').prop('checked', false);

    //     }
    //     $("#infosidebar").empty();
    //  });


//Populate new Layer groups
function onEachFeature(feature, featureLayer) {
    //does layerGroup already exist? if not create it and add to map
    var lg = mapLayers[feature.properties.YR];
    if (lg === undefined) {
        lg = new L.layerGroup();
        //add the layer to the map
        lg.addTo(map);
        //store layer
        mapLayers[feature.properties.YR] = lg;
    }
    featureLayer.on({
        click: TCDIID,
        mouseover: hover,
        mouseout: resetHighlight,
        dblclick: zoomToFeature
    });
    featureLayer.bindTooltip(feature.properties.TITLE , {
        sticky: false,
        className: "popup",
        direction: 'auto'
    });
    //add the feature to the layer
    lg.addLayer(featureLayer);
    identifyLayers.push(feature.properties.YR);
}
/*
 * show/hide layerGroup   
 */
function showLayer(id) {
    var lg = mapLayers[id];
    map.addLayer(lg);
    
}

function hideLayer(id) {
    var lg = mapLayers[id];
    map.removeLayer(lg);

}

function activateTooltip() {
    $("[data-toggle=infotooltip]").tooltip({
        placement: 'left'
    });
}

var map;
map = L.map("map", {
    minZoom: 9,
    zoomControl: true,
});

// Basemap Layers

var Mapbox_dark = L.tileLayer.provider('MapBox.crvanpollard.hghkafl4')
//     var Mapbox_dark = L.tileLayer(mapboxUrl, {id: 'MapBox.crvanpollard.hghkafl4', attribution: mapboxAttribution});

var Mapbox_Imagery = L.tileLayer(
    'https://api.mapbox.com/styles/v1/crvanpollard/cimpi6q3l00geahm71yhzxjek/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiY3J2YW5wb2xsYXJkIiwiYSI6Ii00ZklVS28ifQ.Ht4KwAM3ZUjo1dT2Erskgg', {
        tileSize: 512,
        zoomOffset: -1,
        attribution: '© <a href="https://www.mapbox.com/map-feedback/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });

var CartoDB_Positron = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
    subdomains: 'abcd',
    maxZoom: 19
});

// set view to leeds, and add layer. method chaining, yumm.
map.addLayer(CartoDB_Positron);

// TCDI layers for all years
var TCDI = L.geoJson(null, {
    style: function(feature) {
        switch (feature.properties.YR) {
                    case 2002: return {color: "#CB181D", weight: 1, opacity: 1, fillOpacity: .55, clickable: true };
                    case 2003: return {color: "#F46D43", weight: 1, opacity: 1, fillOpacity: .55, clickable: true};
                    case 2004: return {color: "#82C2EA", weight: 1, opacity: 1, fillOpacity: .55, clickable: true};
                    case 2005: return {color: "#87BB40", weight: 1, opacity: 1, fillOpacity: .55, clickable: true};
                    case 2007: return {color: "#CF128A", weight: 1, opacity: 1, fillOpacity: .55, clickable: true};
                    case 2010: return {color: "#B53E98", weight: 1, opacity: 1, fillOpacity: .55, clickable: true};
                    case 2012: return {color: "#0061A6", weight: 1, opacity: 1, fillOpacity: .55, clickable: true};
                    case 2015: return {color: "#DFC27D", weight: 1, opacity: 1, fillOpacity: .55, clickable: true};
                    case 2017: return {color: "#1A9641", weight: 1, opacity: 1, fillOpacity: .55, clickable: true};
                    
                    // case 'County2002': return {color: "#CB181D", weight: 1, opacity: 1, fillOpacity: .55, clickable: true };
                    // case 'County2003': return {color: "#F46D43", weight: 1, opacity: 1, fillOpacity: .55, clickable: true};
                    // case 'County2004': return {color: "#82C2EA", weight: 1, opacity: 1, fillOpacity: .55, clickable: true};
                    // case 'County2005': return {color: "#87BB40", weight: 1, opacity: 1, fillOpacity: .55, clickable: true};
                    // case 'County2007': return {color: "#CF128A", weight: 1, opacity: 1, fillOpacity: .55, clickable: true};
                    // case 'County2010': return {color: "#B53E98", weight: 1, opacity: 1, fillOpacity: .55, clickable: true};
                    // case 'County2012': return {color: "#0061A6", weight: 1, opacity: 1, fillOpacity: .55, clickable: true};
                    // case 'County2015': return {color: "#DFC27D", weight: 1, opacity: 1, fillOpacity: .55, clickable: true};
                    // case 'County2017': return {color: "#1A9641", weight: 1, opacity: 1, fillOpacity: .55, clickable: true};
                }   
    },
    onEachFeature: onEachFeature
});
$.getJSON("data/TCDI.js", function(data) {
    TCDI.addData(data);
});

var DVRPC = L.geoJson(null, {
    style: {
        stroke: true,
        fillColor: 'none',
        color: '#282828',
        weight: 3,
        fill: true,
        opacity: 1,
        fillOpacity: 0.70,
        clickable: false
    },
    onEachFeature: function(feature, layer) {}
});
$.getJSON("data/CountyDVRPC.js", function(data) {
    DVRPC.addData(data);
}).complete(function() {
    map.fitBounds(DVRPC.getBounds());
});

(TCDI).addTo(map);
(DVRPC).addTo(map);

var baseLayers = {
    "Streets (Dark)": Mapbox_dark,
    "Streets (Grey)": CartoDB_Positron,
    "Satellite": Mapbox_Imagery
};

var layerControl = L.control.layers(baseLayers).addTo(map);

var viewCenter = new L.Control.ViewCenter();
map.addControl(viewCenter);

var scaleControl = L.control.scale({
    position: 'bottomright'
});

var searchControl = new L.esri.Controls.Geosearch().addTo(map);

// create an empty layer group to store the results and add it to the map
var results = new L.LayerGroup().addTo(map);

// listen for the results event and add every result to the map
searchControl.on("results", function(data) {
    results.clearLayers();
    for (var i = data.results.length - 1; i >= 0; i--) {
        results.addLayer(L.circleMarker(data.results[i].latlng));
    }
});

//Action on feature selections////////////
function zoomToPoint(e) {
    var layer = e.target;
    var latLng = layer.getLatLng();
    map.setView(latLng, 15);
}

function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
}


function createView(layer) {
    var props = layer.feature.properties;
    if (props.WEBLINK ==='na'){ 
        var wblink = '';}
    else { 
        var wblink = '<img style="margin:0px 0px 5px 0px" src="http://www.dvrpc.org/asp/TIPsearch/2015/PA/img/document.png"/>&nbsp; - <a class="one" href="' 
            +(props.WEBLINK) + 
            '" target="_blank" stye="color:white; background-color:#000">View Report</a><br>'
            ;}
 
    if (props.YR === 2002){ var bancolor = '#CB181D';}
    else if (props.YR === 2003){ var bancolor = '#F46D43';}
    else if (props.YR === 2004){ var bancolor = '#82C2EA';}
    else if (props.YR === 2005){ var bancolor = '#87BB40';}
    else if (props.YR === 2007){ var bancolor = '#CF128A';}
    else if (props.YR === 2010){ var bancolor = '#B53E98';}
    else if (props.YR === 2012){ var bancolor = '#0061A6';}    
    else if (props.YR === 2015){ var bancolor = '#DFC27D';}
    else {var bancolor ='#1A9641';}

    if (props.PROJ_DESC2 === undefined){ var pd2 = '';}
    else { var pd2 = (props.PROJ_DESC2) ;}


    if (props.PROJ_DESC3 === undefined ){ var pd3 = '';}
    else { var pd3 = (props.PROJ_DESC3) ;}
 

    var info = '<div class="projectinfo"><h4 id="titlepr" style="background-color:' 
    + bancolor 
    + '"><div id="labeltcdi">' 
    + (props.TITLE)
    + '<span style="float:right; font-weight: normal;">'+(props.YR)+'</span></div></h4>' 
//    + "<div class='labelfield'><b>Amount: </b>" 
//    + (props.AMT_WEB) 
//    + "</div>" 
     + '<div class="row" style="margin-bottom:5px;"><div class="col-sm-3" id="money">' 
    + (props.AMT_WEB) 
    + "<div id='money2'>awarded</div></div>" 
//    + "<div class='labelfield'><b>Year Awarded: </b>" 
//    + (props.YR) 
 //   + "</div>" 
    + "<div class='col-sm-8' id='labelfield'>" 
    + (props.MUN_NAME) +", "+(props.CO_NAME)+ " County, "+ (props.STATE)
   // + '<a href="#" id="zoomToBtn" style="float:right" class="btn btn-primary" onclick="map.setView(new L.LatLng( ' + (props.LAT) + ' , ' + (props.LONG) + ' ),12); return false;">Zoom To Project</a>' + "</div>" + "<br></br>"
    + "</div></div>" 
    + "<div class='labelfield'><b>Description: </b>" 
    + (props.PROJ_DESC) 
    + pd2    
    + pd3
    + "</div>"
    + wblink
     + "</div>"; 

    $('#infosidebar').append(info);
    $('#myTab a[href="#Results"]').tab('show');
    length++;
}

function TCDIID(e) {
    $('#click_help').hide();
    $('#infosidebar').html('');
    var layers = TCDI.identify(e.latlng);
    layers.eachLayer(function(f) {
        if (identifyLayers.indexOf(f.feature.properties.YR) > -1) { // HAS TO BE THE SAME AS feature.properties ON LINE 126
            createView(f);
        }
    });  
}

//Opacity slide -- preventing map dragging/panning
$('#slide').on('mouseover', function(e) {
    e.preventDefault();
    e.stopPropagation();
    map.dragging.disable();
});

$('#slide').on('mouseout', function() {
    map.dragging.enable();
});

$('#slide').slider({
    reversed: false
}).on('slide', function(e) {
    e.preventDefault();
    e.stopPropagation();
    map.dragging.disable();
    var sliderVal = e.value;
    TCDI.setStyle({
        fillOpacity: sliderVal / 100
    });
});

$('#slide').slider({
    reversed: false
}).on('slideStop', function(e) {
    e.preventDefault();
    e.stopPropagation();
    map.dragging.enable();
});

function hover(e) {
    var layer = e.target;
    var props = layer.feature.properties;
    layer.setStyle({
        weight: 3
        //   color: 'red'
        //   opacity:1
    });
    if (!L.Browser.ie && !L.Browser.opera) {
        layer.bringToFront();
    }
};

function resetHighlight(e) {
    var layer = e.target;
    //return layer to back of map
    if (!L.Browser.ie && !L.Browser.opera) {
        layer.bringToBack();
    }
    //  TCDI.resetStyle(e.target);
    layer.setStyle({
        weight: 1.5
        //   color: 'red'
        //   opacity:1
    });
}

// Placeholder hack for IE
if (navigator.appName == "Microsoft Internet Explorer") {
    $("input").each(function() {
        if ($(this).val() == "" && $(this).attr("placeholder") != "") {
            $(this).val($(this).attr("placeholder"));
            $(this).focus(function() {
                if ($(this).val() == $(this).attr("placeholder")) $(this).val("");
            });
            $(this).blur(function() {
                if ($(this).val() == "") $(this).val($(this).attr("placeholder"));
            });
        }
    });
}