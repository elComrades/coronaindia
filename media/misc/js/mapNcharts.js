//Map code start here
var apiPrashantCall = null;
var mapFinalMarkerCoords = null;
var infoWindowContent = null;
var dailyStatsData = null;

function initMap() {
  var indiaCenter = new google.maps.LatLng(20.5937, 78.9629);
  var indiaBorderBounds={
        north: 40,
        south: 7,
        west: 68.7,
        east: 97.25,
      };
  var map;
  var bounds = new google.maps.LatLngBounds();
  var mapOptions = {
    mapTypeId: 'roadmap',
    zoom: 0,
    position: markerPosition,
    restriction: {
            latLngBounds: indiaBorderBounds,
            strictBounds: false,
          },
    streetViewControl: false,
    mapTypeControl: false,
    //draggable: false,
    scrollwheel: false,
    //backgroundColor: '#FFF',
    disableDefaultUI: true,
    zoomControl: true,
    scaleControl: false,
    fullscreenControl: true,
    //mapTypeId:google.maps.MapTypeId.ROADMAP
    styles: googleMapStyles
  };

  // Display a map on the web page
  map = new google.maps.Map(document.getElementById("map"), mapOptions);
  map.setTilt(50);

  // Add multiple markers to map
  var infoWindow = new google.maps.InfoWindow(), marker, i;

 // var userGeoMarkerImage = {
   // url: "dist/img/geolocationWithBase.svg",
    //scaledSize: new google.maps.Size(35, 35)
 // }

    // Try HTML5 user geolocation.
   // if (navigator.geolocation) {
     // navigator.geolocation.getCurrentPosition(function(position) {
       // var userGeoLocation = {
         // lat: position.coords.latitude,
         // lng: position.coords.longitude
       // };

       // infoWindow.setPosition(userGeoLocation);
       // infoWindow.setContent('Your Location');
       // infoWindow.open(map);
      // map.setCenter(pos);

       // userGeoMarker = new google.maps.Marker({
         // position: userGeoLocation,
         // map: map,
         // optimized: false,
         // icon: userGeoMarkerImage,
         // title: 'Your Location'
       // });

       //Add info window to user geo location
       // google.maps.event.addListener(userGeoMarker, 'mouseover', (function() {
           // infoWindow.setContent('Your Location');
           // infoWindow.open(map);
       // }));

     // }, function() {
       // handleLocationError(true, infoWindow, map.getCenter());
     // });
   // } else {
     //Browser doesn't support Geolocation
     // handleLocationError(false, infoWindow, map.getCenter());
   // }

  var markerImage = {
    url: mapMarkerIcon,
    scaledSize: new google.maps.Size(35, 35)
  }
  // Place each marker on the map
  if (mapFinalMarkerCoords) {
    for (i = 0; i < mapFinalMarkerCoords.length; i++) {
      var markerPosition = new google.maps.LatLng(mapFinalMarkerCoords[i][1], mapFinalMarkerCoords[i][2]);
      bounds.extend(markerPosition);
      marker = new google.maps.Marker({
        position: markerPosition,
        map: map,
        optimized: false,
        icon: markerImage,
        title: mapFinalMarkerCoords[i][0]

      });

      // Add info window to marker
      google.maps.event.addListener(marker, 'mouseover', (function(marker, i) {
        return function() {
          infoWindow.setContent(infoWindowContent[i][0]);
          infoWindow.open(map, marker);
        }
      })(marker, i));

	   google.maps.event.addListener(marker, 'click', (function(marker, i) {
        return function() {
          infoWindow.setContent(infoWindowContent[i][0]);
          infoWindow.open(map, marker);
        }
      })(marker, i));

      // Center the map to fit all markers on the screen
      map.fitBounds(bounds);
    }
  }
  // Set zoom level
  var boundsListener = google.maps.event.addListener((map), 'bounds_changed', function(event) {
    this.setZoom(4.6);
    google.maps.event.removeListener(boundsListener);
  });

}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
  //infoWindow.setPosition(pos);
  //infoWindow.setContent(browserHasGeolocation ? 'Error: The Geolocation service failed.' : 'Error: Your browser doesn\'t support geolocation.');
  //infoWindow.open(map);
}

var coronaCasesSummary=null;

var apiUrlLatestCases = 'https://api.rootnet.in/covid19-in/stats/latest';
var ajaxLatestCases = $.ajax({
  type: "GET",
  url: apiUrlLatestCases,
  dataType: "json",
  success: function(result) {
    coronaCasesSummary=result.data.summary;

    //set values in dashboard tiles
      setDashboardStats(result.data.summary);

    //generate and set donut Chart for covi19 cases
      generateDonutChart(result.data.summary);

    //generate and set markers coordinate and marker html for map
      generateMapMarkers(result.data.regional);
  },
  error: function(results) {
    alert("There is an error. " + results.stringfy);
  },
});


var apiUrlDailyStats = 'https://api.rootnet.in/covid19-in/stats/daily';
ajaxDailyStats = $.ajax({
  type: "GET",
  url: apiUrlDailyStats,
  dataType: "json",
  success: function(result) {

    //storing data in global variable for use in future
    dailyStatsData = result.data;
    //passing last result because it will have most recent cases
    generateStateList(result.data[result.data.length-1]);
    //generate line graph for corona Cases daywise
    generateLineGraph(result.data);

    $.when(ajaxLatestCases).then(function(){
        generateLineDblGraph(coronaCasesSummary, result.data);
    });

  },
  error: function(results) {
    alert("There is an error. " + results.stringfy);
  },
});

//set values in dashboard tiles
function setDashboardStats(statsSummary) {
  var totalActive = statsSummary.total - statsSummary.discharged - statsSummary.deaths;
  $('#totalCases').html(JSON.stringify(statsSummary.total));
  $('#totalActive').html(totalActive);
  //$('#cic').html(JSON.stringify(statsSummary.confirmedCasesIndian));
  //$('#cfc').html(JSON.stringify(statsSummary.confirmedCasesForeign));
  var fatalityRate = (statsSummary.deaths/statsSummary.total)*100;
  $('#cfc').html(fatalityRate.toFixed(2) + "%");
  $('#discharged').html(JSON.stringify(statsSummary.discharged));
  $('#deaths').html(JSON.stringify(statsSummary.deaths));
  $('#clu').html(JSON.stringify(statsSummary.confirmedButLocationUnidentified));

}

//generate and set markers coordinate and marker html for map
function generateMapMarkers(regionalData) {

  var mapMarkerCoord = [];
  var mapMarkerHtml = [];

  for (key in regionalData) {
    var apiInSateDtl = regionalData[key]
    var apiInSateName = apiInSateDtl.loc;
    var inConfCases = apiInSateDtl.confirmedCasesIndian;
    var frnConfCases = apiInSateDtl.confirmedCasesForeign;
    var dischargedCont = apiInSateDtl.discharged;
    var deathCont = apiInSateDtl.deaths;

    var inStateDtlHardCode = cordinatList.indianState;
    for (inStateName in inStateDtlHardCode) {
      if (inStateName == apiInSateName) {
        var inStateLat = inStateDtlHardCode[inStateName].lat;
        var inStateLong = inStateDtlHardCode[inStateName].long;

        var mapMarkerCoordState = [inStateName, inStateLat, inStateLong];
        mapMarkerCoord.push(mapMarkerCoordState);

        var mapMarkerHtmlState = [
          '<div class="info_content googleCoronMarkerInfo">' +
          '<h6 style="color:'+markerInfoStateColor+'">' + inStateName + '</h6>' +
          '<p><span class="badge badge-secondary">Total Indian cases </span><span class="badge badge-dark float-right ml-5">' + inConfCases + '</span>' +
          '<br><span class="badge badge-warning">Total Foreign cases </span><span class="badge badge-dark float-right ml-5">' + frnConfCases + '</span>' +
          '<br><span class="badge badge-success">Total Cured </span><span class="badge badge-dark float-right ml-5">' + dischargedCont + '</span>' +
          '<br><span class="badge badge-danger">Deaths </span><span class="badge badge-dark float-right ml-5">' + deathCont + '</span>' +
          '</p>' +
          '</div>'
        ];
        mapMarkerHtml.push(mapMarkerHtmlState);
      }
    }
  }
  mapMarkerHtml.length = mapMarkerCoord.length;

  mapFinalMarkerCoords = mapMarkerCoord;
  infoWindowContent = mapMarkerHtml;

  // Load initialize gogle map function initMap
  if(typeof google !== 'undefined')
  google.maps.event.addDomListener(window, 'load', initMap);
}

var randomColorGenerator = function () {
    return '#' + (Math.random().toString(16) + '0000000').slice(2, 8);
};

//generate and set donut Chart for covi19 cases
function generateDonutChart(statsSummary) {
  var dognutChartValArry = [statsSummary.total, statsSummary.discharged, statsSummary.deaths];

  var ctx = document.getElementById("myChart");
  var myChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Total Active Cases', 'Total Cured', 'Total Deaths'],
      datasets: [{
        label: 'Cases 2019-nCoV',
        data: dognutChartValArry,
        backgroundColor: [
        // randomColorGenerator(),
        //randomColorGenerator(),
        //randomColorGenerator()
		   'rgba(255,99,132,1)',
       'rgba(144,238,144,1)',
       'rgba(105,105,105, 1)'

        ],
         borderColor: [
          'rgba(0,0,0,5)',
		      'rgba(0,0,0,5)',
		      'rgba(0,0,0,5)'
          //'rgba(144,238,144, 5)',
          //'rgba(105,105,105, 5)'
         ],
        borderWidth: 1
      }]
    },
    options: {
      //cutoutPercentage: 40,
      responsive: true,
      legend: {
      position: 'top',
      labels: {
        fontColor: graphsLabelsColor
    }
  },
  }
  });
}


//generate line graph for corona Cases daywise
function generateLineGraph(dailyStats) {
  var dateLable = [];
  var totalCasesData = [];
  var totalActiveCasesData = [];
  var dailyCaseCountData = [];

var i=0;
  for (dayIndex in dailyStats) {
    var dayStats = dailyStats[dayIndex];
    dateLable.push(dayStats.day);
    totalCasesData.push(dayStats.summary.total);
    totalActiveCasesData.push(dayStats.summary.total - dayStats.summary.deaths - dayStats.summary.discharged);
    var dayCaseCount = totalCasesData[i]-totalCasesData[i-1];
    dayCaseCount = dayCaseCount<0?0:dayCaseCount;
    dailyCaseCountData.push(dayCaseCount);
    i++;
  }

  totalCasesData.length = dateLable.length;

  //By Siddharth, hackish for computing average of last 7 days
  var countI = 0;
  var sum = 0;
  dailyCaseCountData.slice().reverse().forEach(function(x) {
    if(countI < 7) {
      sum += x;
      countI++;
    }
  })
  $('#cic').html(JSON.stringify(sum));

  resetCanvas();
  var ctx = document.getElementById("lineChart").getContext("2d");
   var lineChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dateLable,
      datasets: [{
        label: "Total Cases ",
        data: totalCasesData,
        backgroundColor: ['rgba(0, 0, 0, 0.1)'],
        borderColor: '#20EDE9',
        borderWidth: 2,
        fill: false
      },
      {
        label: "Total Active Cases",
        data: totalActiveCasesData,
        backgroundColor: ['rgba(0, 0, 0, 0.1)'],
        borderColor: '#ff0078',
        borderWidth: 2,
        fill: false
      },
      {
        label: "Daily Increase",
        data: dailyCaseCountData,
        backgroundColor: ['rgba(0, 0, 0, 0.1)'],
        borderColor: '#ffe900',
        borderWidth: 2,
        fill: false
      }
    ]
    },
    options: {
      legend: {
      position: 'top',
      labels: {
        fontColor: graphsLabelsColor
      }
    },

      //cutoutPercentage: 40,
      responsive: true,
      xAxisID: "dd",
    maintainAspectRatio: false
    ,
      scales: {
      yAxes: [{
        ticks: {
          fontColor: graphsLabelsColor,
    }
      }],
      xAxes: [{
        ticks: {
          fontColor: graphsLabelsColor,
        }
      }]
    }
    }
  });

}
//having problem after data reload, this was proper way I Found on internet
var resetCanvas = function(){
  $('#lineChart').remove(); // this is my <canvas> element
  $('#trendsOf2019').append('<canvas id="lineChart"><canvas>');
};

//generate bar graph for doubling corona Cases daywise
function generateLineDblGraph(statsSummary, dailyStats) {

var dublingCasesDateArr =[];
var dublingCasesDayCountArr =[];
var dublingCasesValArr =[];

var totalCaseCount =statsSummary.total
var ttcase= totalCaseCount;
var expectedDublingArr=[totalCaseCount];

  while(ttcase != 0 && ttcase > 0){
    var halfOfTtlCase = parseInt(ttcase/2);
    expectedDublingArr.unshift(halfOfTtlCase);
    ttcase = halfOfTtlCase;
    //expectedDublingArr.push(expectedDublingArr);
  }

    dublingCasesDateArr.push(dailyStats[dailyStats.length-1].day);
    //dublingCasesValArr.push(dailyStats[dailyStats.length-1].summary.total);

    var casValTemp = dailyStats[dailyStats.length-1].summary.total;
    casValTemp+="("+dailyStats[dailyStats.length-1].day+")"
    dublingCasesValArr.push(casValTemp);

    var dayIndex = dailyStats.length-1;

    for(var k=expectedDublingArr.length-2; k>0; k--){
          var tempDate=null;
          var tempVal=null;
          if(dayIndex==0)
          break;
          var dayStats = dailyStats[dayIndex];
          while(expectedDublingArr[k]<dayStats.summary.total && (expectedDublingArr[k+1]>dayStats.summary.total || expectedDublingArr[k+1]==dayStats.summary.total))
          {
            tempDate=dayStats.day;
            tempVal=dayStats.summary.total;
            tempVal+=" ("+tempDate+")";

            if(dayIndex==0)
            break;

            dayIndex--;
            dayStats = dailyStats[dayIndex];
          }
          dublingCasesDateArr.unshift(tempDate);
          dublingCasesValArr.unshift(tempVal);
        }


//dublingCasesDayCountArr.push(0);
dublingCasesDayCountArr.push((moment(dublingCasesDateArr[0]) - moment(dailyStats[0].day))/1000/60/60/24);

for(y=1; y<dublingCasesDateArr.length; y++){
  var dayDiff = moment(dublingCasesDateArr[y]) - moment(dublingCasesDateArr[y-1]);
  dublingCasesDayCountArr.push(dayDiff/1000/60/60/24);
}
//expectedDublingArr.length = dublingCasesDateArr.length;
dublingCasesValArr.shift();
dublingCasesDayCountArr.shift();

console.log(expectedDublingArr);
//dublingCasesValArr.shift();
console.log(dublingCasesValArr);
console.log(dublingCasesDateArr);

  var ctx = document.getElementById("lineChart2").getContext("2d");
  var lineChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dublingCasesValArr ,
      datasets: [{
        label: "No. of days to double the total count",
        data: dublingCasesDayCountArr,
        backgroundColor: '#8bd1f7',
        borderColor: '#04A2B3',
        borderWidth: 2,
        fill: true
      }
    ]
    },
    options: {
      //cutoutPercentage: 40,
      responsive: true,
      xAxisID: "dd",
      legend: {
      position: 'top',
      labels: {
        fontColor: graphsLabelsColor
      }
    },
      scales: {
      yAxes: [{
        ticks: {
          beginAtZero: true,
          fontColor: graphsLabelsColor,
          callback: function(value) {if (value % 1 === 0) {return value;}}
        }
      }],
      xAxes: [{
        ticks: {
          fontColor: graphsLabelsColor,
        }
      }]
    }

    }
  });
}

function generateStateList(data){

  var stateList = [];
  $("#stateList").find('option').remove();
  $('<option/>', { value : "All States" }).text("All States").appendTo('#stateList');

  for(var i=0;i<data.regional.length;i++){
    var state = data.regional[i].loc;
    stateList.push(state);
    $('<option/>', { value : state }).text(state).appendTo('#stateList');
  }
  //console.log("state list",stateList);

}
function filterDataStateWise(state){

  if(state == "All States"){
    generateLineGraph(dailyStatsData);
  }
  else{
    //deep copy
    var copiedObject = JSON.parse(JSON.stringify(dailyStatsData));
    var filteredData = extractDataForGivenState(copiedObject,state);
    generateLineGraph(filteredData);
  }
}

function extractDataForGivenState(data,state){

  //to be used where data is not available for any state on a given day
  var blankSummaryObject = {
    loc : state,
    confirmedCasesIndian : 0,
    discharged : 0,
    deaths : 0,
    confirmedCasesForeign : 0
  };

  for(var i=0;i<data.length;i++){
     if(data[i].regional != null && typeof data[i].regional != "undefined"){
         var stateData =  data[i].regional.filter(function(regional){
            return regional.loc == state;
          });
         if(stateData.length !=0){
            data[i].summary = stateData[0];
            data[i].summary.total = getSumOfTheObjectKeys(data[i].summary);
          }
          else{
            data[i].summary = blankSummaryObject;
          }
      }
    }

    return data;
}

//expecting all the object keys , containing numeric data is no. of cases
function getSumOfTheObjectKeys(localData){

  var keys = Object.keys(localData);

  var total = 0;
  for(var i=0;i<keys.length;i++){
    if(!isNaN(localData[keys[i]])){
      total += localData[keys[i]];
    }
  }
  return total;
}


////Object Keys local implementation, for low end browsers
if (!Object.keys) {
  Object.keys = (function() {
    'use strict';
    var hasOwnProperty = Object.prototype.hasOwnProperty,
        hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString'),
        dontEnums = [
          'toString',
          'toLocaleString',
          'valueOf',
          'hasOwnProperty',
          'isPrototypeOf',
          'propertyIsEnumerable',
          'constructor'
        ],
        dontEnumsLength = dontEnums.length;

    return function(obj) {
      if (typeof obj !== 'function' && (typeof obj !== 'object' || obj === null)) {
        throw new TypeError('Object.keys called on non-object');
      }

      var result = [], prop, i;

      for (prop in obj) {
        if (hasOwnProperty.call(obj, prop)) {
          result.push(prop);
        }
      }

      if (hasDontEnumBug) {
        for (i = 0; i < dontEnumsLength; i++) {
          if (hasOwnProperty.call(obj, dontEnums[i])) {
            result.push(dontEnums[i]);
          }
        }
      }
      return result;
    };
  }());
}

// government contact list populator
$(document).ready(function() {
  var hackerList = new List('hacker-list', govConListJsoptions);
  hackerList.add(govContactJson);
});