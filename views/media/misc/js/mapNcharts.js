
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
  map = new google.maps.Map(document.getElementById("googleMapNcovCas"), mapOptions);
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
var coronaCasesAll = null;
var apiUrlLatestCases = 'https://api.rootnet.in/covid19-in/stats/latest';
var ajaxLatestCases = $.ajax({
  type: "GET",
  url: apiUrlLatestCases,
  dataType: "json",
  success: function(result) {
    coronaCasesSummary=result.data.summary;
   var coronaCasesRegionalData = result.data.regional;
   coronaCasesAll = result.data;
    //set values in dashboard tiles
		if (result.data.summary.total==null)
		{
			var totalcases=0;
			var totaldeaths=0;
			var totalcured=0;
			
			for(var i=0;i<coronaCasesRegionalData.length;i++)
			{
				if (coronaCasesRegionalData[i].totalConfirmed !=null)
					totalcases = totalcases +coronaCasesRegionalData[i].totalConfirmed;
				if (coronaCasesRegionalData[i].deaths !=null)
					totaldeaths = totaldeaths +coronaCasesRegionalData[i].deaths;
				if (coronaCasesRegionalData[i].discharged !=null)
					totalcured = totalcured +coronaCasesRegionalData[i].discharged;
			}
			result.data.summary.total=totalcases;
			result.data.summary.deaths=totaldeaths;
			result.data.summary.discharged=totalcured;
			setDashboardStats(result.data.summary);
			
		}
		else
		{
			setDashboardStats(result.data.summary);
		}

    //generate and set donut Chart for covi19 cases
      generateDonutChart(getCopyOfJSONObject(coronaCasesSummary));

    //generate and set markers coordinate and marker html for map
      //generateMapMarkers(result.data.regional);

    //generate am chart series for covid19 satewise cases
      generateAmChartCovCasSeries(result.data.regional);

     
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

    console.log("result.data",result.data);
    getDoublingSeries(getCopyOfJSONObject(result.data));
    //storing data in global variable for use in future
    dailyStatsData = getCopyOfJSONObject(result.data);
    //passing last result because it will have most recent cases
    generateStateList(getCopyOfJSONObject(result.data[result.data.length-1]));

    drawChartStateWise(getCopyOfJSONObject(result.data[result.data.length-1]));
    //generate line graph for corona Cases daywise
    generateLineGraph(getCopyOfJSONObject(result.data), 3);
    setLastSevenDayData(getCopyOfJSONObject(result.data));

     //get doubling rate

    $.when(ajaxLatestCases).then(function(){
        generateLineDblGraph(coronaCasesSummary, getCopyOfJSONObject(result.data));
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
  var recoveryRate = (statsSummary.discharged/statsSummary.total)*100;
  $('#cfc').html(fatalityRate.toFixed(2) + "%");
  $('#cic').html(recoveryRate.toFixed(2) + "%");
  $('#discharged').html(JSON.stringify(statsSummary.discharged));
  $('#deaths').html(JSON.stringify(statsSummary.deaths));
  $('#clu').html(JSON.stringify(statsSummary.confirmedButLocationUnidentified));

}


//generate am chart series for covid19 satewise cases
function generateAmChartCovCasSeries (regionalData) {
  gentAmChartCovCasSeriesDiffObj = jQuery.Deferred();
  amChartSateCovCasSeries.length=0;
  for (key in regionalData) {
    var apiInSateDtl = regionalData[key]
    var apiInSateName = apiInSateDtl.loc;
    var inConfCases = apiInSateDtl.confirmedCasesIndian;
    var frnConfCases = apiInSateDtl.confirmedCasesForeign;
    var dischargedCont = apiInSateDtl.discharged;
    var deathCont = apiInSateDtl.deaths;

    var inStateDtlHardCode = cordinatList.indianState;
    if (indianCharSateCode[apiInSateName]!=null ||indianCharSateCode[apiInSateName]!=undefined ) {
        var stCharCode = indianCharSateCode[apiInSateName];
        amChartSateCovCasSeries.push({id: stCharCode, value: inConfCases+frnConfCases});
      } else {
        console.log("Add this sate char code for: "+apiInSateName);
      }
  }
  gentAmChartCovCasSeriesDiffObj.resolve();
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

  var ctx = document.getElementById("ncovDoughnut");
  ncovDoughnut = new Chart(ctx, {
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
        borderWidth: 0
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
function generateLineGraph(dailyStats, flag) {

  //console.log("dailyStats",dailyStats);
  var dateLable = [];
  var totalCasesData = [];
  var totalActiveCasesData = [];
  var dailyCaseCountData = [];
  var totalDeathData = [];
  var totalRecoveryData = [];

var i=0;
  for (dayIndex in dailyStats) {
    var dayStats = dailyStats[dayIndex];
    dateLable.push(dayStats.day);
    totalCasesData.push(dayStats.summary.total);
    totalDeathData.push(dayStats.summary.deaths);
    totalRecoveryData.push(dayStats.summary.discharged);
    totalActiveCasesData.push(dayStats.summary.total - dayStats.summary.deaths - dayStats.summary.discharged);
    var dayCaseCount = totalCasesData[i]-totalCasesData[i-1];
    dayCaseCount = dayCaseCount<0?0:dayCaseCount;
    dailyCaseCountData.push(dayCaseCount);
    i++;
  }

  totalCasesData.length = dateLable.length;

  //  //moved to other function because of state filter
  // //By Siddharth, hackish for computing average of last 7 days
  // var countI = 0;
  // var sum = 0;
  // dailyCaseCountData.slice().reverse().forEach(function(x) {
  //   if(countI < 7) {
  //     sum += x;
  //     countI++;
  //   }
  // })
  // $('#cic').html(JSON.stringify(sum));
  resetCanvas();
  var ctx = null;


  var ctx = document.getElementById("lineChart1").getContext("2d");
   lineChart1 = new Chart(ctx, {
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
	elements: {
                    point:{
                        radius: 0
                    }
                },
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

  var ctx1 = document.getElementById("lineChart2").getContext("2d");
   lineChart2 = new Chart(ctx1, {
    type: 'line',
    data: {
      labels: dateLable,
      datasets: [{
        label: "Total Deaths ",
        data: totalDeathData,
        backgroundColor: ['rgba(0, 0, 0, 0.1)'],
        borderColor: '#FF0078',
        borderWidth: 2,
        fill: false
      },
      {
        label: "Total Recovered ",
        data: totalRecoveryData,
        backgroundColor: ['rgba(0, 0, 0, 0.1)'],
        borderColor: '#00DF14',
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
function setLastSevenDayData(dailyStats){
  var i=0;
  var dateLable = [];
  var totalCasesData = [];
  var totalActiveCasesData = [];
  var dailyCaseCountData = [];
  var totalDeathData = [];
  var totalRecoveryData = [];

  for (dayIndex in dailyStats) {
    var dayStats = dailyStats[dayIndex];
    dateLable.push(dayStats.day);
    totalCasesData.push(dayStats.summary.total);
    totalDeathData.push(dayStats.summary.deaths);
    totalRecoveryData.push(dayStats.summary.discharged);
    totalActiveCasesData.push(dayStats.summary.total - dayStats.summary.deaths - dayStats.summary.discharged);
    var dayCaseCount = totalCasesData[i]-totalCasesData[i-1];
    dayCaseCount = dayCaseCount<0?0:dayCaseCount;
    dailyCaseCountData.push(dayCaseCount);
    i++;
  }

  totalCasesData.length = dateLable.length;

  //By Siddharth, hackish for computing average of last 7 days
  // var countI = 0;
  // var sum = 0;
  // dailyCaseCountData.slice().reverse().forEach(function(x) {
  //   if(countI < 7) {
  //     sum += x;
  //     countI++;
  //   }
  // })
  // $('#cic').html(JSON.stringify(sum));
}
//having problem after data reload, this was proper way I Found on internet
var resetCanvas = function(){
  $('#lineChart1').remove(); // this is my <canvas> element
  $('#trendsOf2019').append('<canvas id="lineChart1"><canvas>');

  $('#lineChart2').remove(); // this is my <canvas> element
  $('#DandRTrend').append('<canvas id="lineChart2"><canvas>');
};

//generate bar graph for doubling corona Cases daywise
function generateLineDblGraph(statsSummary, dailyStats) {

console.log(dailyStats);
console.log(statsSummary);
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
    casValTemp+=" |"+moment(dailyStats[dailyStats.length-1].day).format('DD-MMM');
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
            tempVal+=" |"+moment(tempDate).format('DD-MMM');

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

  var ctx = document.getElementById("lineChart3").getContext("2d");
  lineChart3 = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dublingCasesValArr ,
      datasets: [{
        label: "No. of days to double the total count",
        data: dublingCasesDayCountArr,
        //backgroundColor: '#8bd1f7',
        borderColor: '#04A2B3',
        borderWidth: 2,
        fill: false
      }
    ]
    },
    options: {
      //cutoutPercentage: 40,
      responsive: true,
      maintainAspectRatio: false,
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
          reverse: true,
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
  //ctx[0].height=400;
}

function generateStateList(data){

  var stateList = [];
  $("#stateList").find('option').remove();
  $('<option/>', { value : "All States" }).text("All States").appendTo('#stateList');

  // $("#stateList1").find('option').remove();
  // $('<option/>', { value : "All States" }).text("All States").appendTo('#stateList1');

  for(var i=0;i<data.regional.length;i++){
    var state = data.regional[i].loc;
    stateList.push(state);
    $('<option/>', { value : state }).text(state).appendTo('#stateList');
    // $('<option/>', { value : state }).text(state).appendTo('#stateList1');
  }
  //console.log("state list",stateList);
  //return stateList;
}
function filterDataStateWise(state, flag){

  if(state == "All States"){
    console.log("dailyStatsData",dailyStatsData);
      generateLineGraph(getCopyOfJSONObject(dailyStatsData), flag);
      setDashboardStats(coronaCasesSummary);
      generateLineDblGraph(coronaCasesSummary, getCopyOfJSONObject(dailyStatsData));
      generateDonutChart(coronaCasesSummary);


  }
  else{
    //deep copy
    var copiedObject = JSON.parse(JSON.stringify(dailyStatsData));
    var filteredData = extractDataForGivenState(copiedObject,state);
    var filteredTotalData = extractDataForGivenStateTotal(coronaCasesAll,state);
    generateLineGraph(filteredData, flag);
    setDashboardStats(filteredTotalData);
    generateLineDblGraph(filteredTotalData, getCopyOfJSONObject(filteredData));
    generateDonutChart(filteredTotalData);
  }
}

function extractDataForGivenStateTotal(data,state){

// console.log(data);
  //to be used where data is not available for any state on a given day
  var summaryObject = {
    loc : state,
    confirmedCasesIndian : 0,
    discharged : 0,
    deaths : 0,
    confirmedCasesForeign : 0
  };

   for(var i=0;i<data.regional.length;i++){
     var stateData = data.regional[i];
     if(stateData != null && typeof stateData != "undefined"){
         if(stateData.loc == state) {

         if(stateData.length !=0){

            summaryObject.total = stateData.totalConfirmed;
            summaryObject.deaths =stateData.deaths;
            summaryObject.discharged =stateData.discharged;
          }
          else{
            summaryObject = blankSummaryObject;
          }
        }
      }
     }
    // console.log(data.summary);
    return summaryObject;
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
            data[i].summary.deaths =getSumOfTheRequiredObjects(data[i].summary, 1);
            data[i].summary.discharged =getSumOfTheRequiredObjects(data[i].summary, 2);
            data[i].summary.active = data[i].summary.total - data[i].summary.deaths - data[i].summary.discharged;
          }
          else{
            data[i].summary = blankSummaryObject;
          }
      }
    }

    return data;
}

function getSumOfTheRequiredObjects(localData, flag){
// hackish, iterating over keys may be better


  var total = 0;
  // for(var i=0;i<keys.length;i++){
  //   if(!isNaN(localData[keys[i]])){
  //     total += localData[keys[i]];
  //   }
  // }
  if (flag == 1)
  {
    total = localData.deaths;
  }
  else if (flag == 2)
  {
    total = localData.discharged;
  }
  return total;
}

//expecting all the object keys , containing numeric data is no. of cases
function getSumOfTheObjectKeys(localData){

  var keys = Object.keys(localData);

  var total = 0;
  // for(var i=0;i<keys.length;i++){
  //   if(!isNaN(localData[keys[i]])){
  //     total += localData[keys[i]];
  //   }
  // }
  total = localData.confirmedCasesIndian + localData.confirmedCasesForeign;
  return total;
}


function drawChartStateWise( data){
  console.log("for am charts",data);
  am4core.ready(function() {
  // Themes begin
    am4core.useTheme(am4themes_material);
  // Themes end
  var chart = am4core.create("nCoVSatesCasesAmChart", am4charts.XYChart);

// Add data
addTotalField(data.regional);
data.regional = sortDataByTotalNo(data.regional);
chart.data = data.regional;

chart.legend = new am4charts.Legend();
chart.legend.position = "bottom";
chart.legend.labels.template.fill = graphsLabelsColor;

chart.maskBullets = false;
// Create axes
var categoryAxis = chart.yAxes.push(new am4charts.CategoryAxis());
categoryAxis.dataFields.category = "amChartLabel";
categoryAxis.renderer.grid.template.opacity = 0;
categoryAxis.renderer.labels.template.fill = am4core.color(amInnerColumnLabelsColor);
categoryAxis.renderer.labels.template.fontSize = 15;
//categoryAxis.renderer.labels.template.valign = "";
categoryAxis.renderer.labels.template.align = "left";
categoryAxis.renderer.inside = true;
categoryAxis.renderer.minGridDistance = 0;
//categoryAxis.renderer.cellStartLocation = 0;
categoryAxis.renderer.cellEndLocation = 0.8;

chart.exporting.menu = new am4core.ExportMenu();
chart.exporting.menu.align = "right";
chart.exporting.menu.verticalAlign = "top";


var valueAxis = chart.xAxes.push(new am4charts.ValueAxis());
valueAxis.min = 0;
valueAxis.renderer.grid.template.opacity = 0;
valueAxis.renderer.ticks.template.strokeOpacity = 0.5;
valueAxis.renderer.ticks.template.stroke = am4core.color("#4572A7");
valueAxis.renderer.ticks.template.length = 10;
valueAxis.renderer.line.strokeOpacity = 0.5;
valueAxis.renderer.baseGrid.disabled = true;
valueAxis.renderer.minGridDistance = 100;
valueAxis.renderer.labels.template.fill = am4core.color(graphsLabelsColor);

// Create series

function createSeries(field, name) {
  var series = chart.series.push(new am4charts.ColumnSeries());
  series.dataFields.valueX = field;
  series.dataFields.categoryY = "amChartLabel";
  series.stacked = true;
  series.name = name;
  series.stroke = am4core.color("#f66");
  series.fill = am4core.color("#f66");
  //series.columns.template.width = am4core.percent(5);
  series.columns.template.height = am4core.percent(100);

  //commented as total cases value is commbined with sate name
  var valueLabel = series.columns.template.createChild(am4core.Label);
  //valueLabel.text = "{valueX}";
  valueLabel.fontSize = 12;
  valueLabel.valign = "middle";
  valueLabel.align = "center";
  valueLabel.strokeWidth = 0;
  valueLabel.paddingLeft = 50;

  //valueLabel.dx = 10;
  // var labelBullet = series.bullets.push(new am4charts.LabelBullet());
  // //labelBullet.locationX = -0.1;
  // labelBullet.label.horizontalCenter = "left";
  // labelBullet.label.dx = 10;
  // labelBullet.label.text = themeTypeVal=="2"?"{valueX}":"[bold]{valueX}[/]";
  // labelBullet.label.fill = graphsLabelsColor;
  // labelBullet.label.truncate = false;
  //valueLabel.label.hideOversized = false;
}

createSeries("total","Total Cases");
//createSeries("deaths", "Deaths");
//createSeries("discharged", "Cured");
nCoVSatesCasesAmChart = chart;

  });

}
function sortDataByTotalNo(data){

  return data.sort(function(a, b){return a.total - b.total});

}

//utility function
function addTotalField(data){
  for(var i=0;i<data.length;i++){
    data[i].total = getSumOfTheObjectKeys(data[i]);
    data[i].amChartLabel = data[i].loc+' ('+data[i].total+')';
  }
}
//deep copy
function getCopyOfJSONObject(data){
  return JSON.parse(JSON.stringify(data));
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

function getDoublingSeries(data){
  console.log("doubling data",data);
  var allData = [];
  var todayLatestCases =  parseInt(data[data.length-1].summary.total)-parseInt(data[data.length-2].summary.total);
  var yesterDayCases = parseInt(data[data.length-2].summary.total);
  
  var r =todayLatestCases/yesterDayCases;
  //console.log("value of r is",r);
  
  for(var i=2;i<=5;i++){
    var double = (Math.log(i)/Math.log(1+r));
    allData["all"+i] = double;
  }

  generateStateData(data);

 }

 function generateStateData(data){

  var todayAllData = data[data.length-1];
  var todayStateData = [];

  var yesterdayAllData = data[data.length-2];
  var yesterdayStateData = [];
  
  for(var i=0;i<todayAllData.regional.length;i++){
    var state = todayAllData.regional[i].loc;;
    let data1 = todayAllData.regional[i];
    todayStateData[state] = getSumOfTheObjectKeys(data1);
    
  }

  
  for(var i=0;i<yesterdayAllData.regional.length;i++){
    var state = yesterdayAllData.regional[i].loc;;
    var data1 = yesterdayAllData.regional[i];
    yesterdayStateData[state] = getSumOfTheObjectKeys(data1)
    
  }
  console.log("today list",todayStateData);
  console.log("yesterday list",yesterdayStateData);
  return [todayStateData,yesterdayStateData];
}

//Coro cases choropleth map
am4core.ready(function() {
// Themes begin
am4core.useTheme(am4themes_animated);
// Themes end
window.onload = function() {

/*
jQuery.getJSON( "https://www.amcharts.com/lib/4/geodata/json/india2019Low.json", function( geo ) {
  if ( am4geodata_data_countries2[ geo.country_code ] !== undefined ) {
    currentMap = am4geodata_data_countries2[ geo.country_code ][ "maps" ][ 0 ];
    // add country title
    if ( am4geodata_data_countries2[ geo.country_code ][ "country" ] ) {
      title = am4geodata_data_countries2[ geo.country_code ][ "country" ];
    }
  }
});
*/

  // Default map
  var defaultMap = "india2019High";
  // calculate which map to be used
  var currentMap = defaultMap;
  var title = "";

  // Create map instance
  var chart = am4core.create("amMapdiv", am4maps.MapChart);
  chart.titles.create().text = title;

  // Set map definition
  chart.geodataSource.url = "views/media/amCharts/geodata/json/" + currentMap + ".json";
  chart.geodataSource.events.on("parseended", function(ev) {
    /* for(var i = 0; i < ev.target.data.features.length; i++) { polygonSeries.data.push(); } */
    $.when( gentAmChartCovCasSeriesDiffObj ).then(function( status ) {
      polygonSeries.data = amChartSateCovCasSeries;
      console.log("data for india map",amChartSateCovCasSeries);
    });
  });

  // Set projection
  chart.projection = new am4maps.projections.Mercator();

  chart.seriesContainer.draggable = false;
  chart.seriesContainer.resizable = false;
  chart.maxZoomLevel = 1;

  // Create map polygon series
  var polygonSeries = chart.series.push(new am4maps.MapPolygonSeries());

  //Set min/max fill color for each area
  polygonSeries.heatRules.push({
    property: "fill",
    target: polygonSeries.mapPolygons.template,
    //min: chart.colors.getIndex(1).brighten(1),
    //max: chart.colors.getIndex(1).brighten(-0.6)
    "min": am4core.color("#e3f2fd"),
    "max": am4core.color("#1a237e")
  });

  // Make map load polygon data (state shapes and names) from GeoJSON
  polygonSeries.useGeodata = true;

  // Set up heat legend
  let heatLegend = chart.createChild(am4maps.HeatLegend);
  heatLegend.series = polygonSeries;
  heatLegend.align = "right";
  heatLegend.width = am4core.percent(25);
  heatLegend.marginRight = am4core.percent(4);
  heatLegend.minValue = 0;
  heatLegend.maxValue = 40000000;
  heatLegend.valign = "bottom";

  // Set up custom heat map legend labels using axis ranges
  var minRange = heatLegend.valueAxis.axisRanges.create();
  minRange.value = heatLegend.minValue;
  minRange.label.text = "COVID19 Cases Scale";
  var maxRange = heatLegend.valueAxis.axisRanges.create();
  maxRange.value = heatLegend.maxValue;
  maxRange.label.text = "";

  // Blank out internal heat legend value axis labels
  heatLegend.valueAxis.renderer.labels.template.adapter.add("text", function(labelText) {
    return "";
  });

  // Configure series tooltip
  var polygonTemplate = polygonSeries.mapPolygons.template;
  polygonTemplate.tooltipText = "{name}: {value}";
  polygonTemplate.nonScalingStroke = true;
  polygonTemplate.strokeWidth = 0.5;
  polygonTemplate.fill = am4core.color("#00e676");
  //#74B266

  // Create hover state and set alternative fill color
  var hs = polygonTemplate.states.create("hover");
  //hs.properties.fill = chart.colors.getIndex(1).brighten(-0.5);
  hs.properties.fill = am4core.color("#673ab7");

};


}); // end am4core.ready()
