//(number);

google.charts.load("current", { packages: ["corechart", "gauge", "calendar"] });
var Myarr;
var stations;
var bikestands;
var predictvals = [];

var xmlhttp = new XMLHttpRequest();
xmlhttp.onreadystatechange = function () {
  if (this.readyState == 4 && this.status == 200) {
    stations = JSON.parse(this.responseText);
    //.log(stations);
    stations.forEach((element) => {
      if (element["number"] == number) {
        document.getElementById("stationname").innerHTML = element["name"];
        bikestands = element["bike_stands"];
      }
    });
  }
};

xmlhttp.open("GET", "static/static_bikes.json", true);
xmlhttp.send();

function fetch48(number) {
  fetch("/hour48-" + number)
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      //("data: ", data);
      var arr = [];
      var predictbikes = [];
      for (var date in data) {
        arr.push([date, data[date]]);
        predictbikes.push([date, bikestands - data[date]]);
        predictvals.push([date, data[date], bikestands - data[date]]);
      }
      //(arr);
      var graphdata = new google.visualization.DataTable();
      graphdata.addColumn("string", "time_queried");
      graphdata.addColumn("number", "available_bike_stands");
      graphdata.addRows(arr);
      google.charts.setOnLoadCallback(drawChart48hr(graphdata));
      var graphdatabikes = new google.visualization.DataTable();
      graphdatabikes.addColumn("string", "time_queried");
      graphdatabikes.addColumn("number", "available_bikes");
      graphdatabikes.addRows(predictbikes);
      google.charts.setOnLoadCallback(drawChart48hrbikes(graphdatabikes));
      populatedays();
    });
}

function fetchAverage(number) {
  fetch("/averagestation-" + number)
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      //("data: ", data);
      google.charts.setOnLoadCallback(drawCalAvailBikeStation(data));
      google.charts.setOnLoadCallback(drawCalAvailBikes(data));
    });
}

function fetchStation(number) {
  fetch("/statstation-" + number)
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      //("data: ", data);
      Myarr = data;
      document.getElementById("status").innerText =
        Myarr["station"][0]["station_status"];
      if (Myarr["station"][0]["station_status"] == "OPEN") {
        document.getElementById("status").style.color = "green";
      } else {
        document.getElementById("status").style.color = "red";
      }
      var graphbikes = new google.visualization.DataTable();
      var availablebikes = [];
      var graphstations = new google.visualization.DataTable();
      var availablestations = [];
      var pieData = new google.visualization.DataTable();
      pieData.addColumn("string", "Type");
      pieData.addColumn("number", "Number");
      //(Myarr["station"][0]["available_bike_stands"]);
      pieData.addRows([
        ["Available bike stands", Myarr["station"][0]["available_bike_stands"]],
        ["Available Bikes", Myarr["station"][0]["available_bikes"]],
      ]);
      graphbikes.addColumn("string", "time_queried");
      graphbikes.addColumn("number", "available_bikes");

      graphstations.addColumn("string", "time_queried");
      graphstations.addColumn("number", "available_bike_station");
      Myarr["station"].forEach((element) => {
        availablestations.push([
          element["time_queried"],
          element["available_bike_stands"],
        ]);
        availablebikes.push([
          element["time_queried"],
          element["available_bikes"],
        ]);
      });
      //.log(availablestations);
      graphbikes.addRows(availablebikes);
      graphstations.addRows(availablestations);
      google.charts.setOnLoadCallback(drawPieChart(pieData));
      google.charts.setOnLoadCallback(drawChart(graphbikes));
      google.charts.setOnLoadCallback(drawChart2(graphstations));
    });
}
fetchStation(number);
fetch48(number);
fetchAverage(number);

function drawChart(data) {
  var options = {
    title: "Available Bikes",
    legend: { position: "bottom" },
    colors: ["red"],
  };

  var chart = new google.visualization.LineChart(
    document.getElementById("curve_chart")
  );

  chart.draw(data, options);
}

function drawChart2(data) {
  var options = {
    title: "Available Bike Stands",
    legend: { position: "bottom" },
  };

  var chart = new google.visualization.LineChart(
    document.getElementById("curve_chart_station")
  );

  chart.draw(data, options);
}

function drawChart48hr(data) {
  var options = {
    title: "Predicted Available Bike Stands",
    legend: { position: "bottom" },
  };

  var chart = new google.visualization.LineChart(
    document.getElementById("48hour")
  );

  chart.draw(data, options);
}

function drawChart48hrbikes(data) {
  var options = {
    title: "Predicted Available Bikes",
    legend: { position: "bottom" },
    colors: ["red"],
  };

  var chart = new google.visualization.LineChart(
    document.getElementById("48hourbikes")
  );

  chart.draw(data, options);
}

function drawPieChart(pieData) {
  //(pieData);
  var data = pieData;

  var options = {
    title: "Current availability",
    pieHole: 0.4,
  };

  var chart = new google.visualization.PieChart(
    document.getElementById("donutchart")
  );
  chart.draw(data, options);
}

function drawCalAvailBikes(data) {
  var dataTable = new google.visualization.DataTable();
  dataTable.addColumn({ type: "date", id: "Date" });
  dataTable.addColumn({ type: "number", id: "Availability" });

  var finaldata = [];
  data.forEach((element) => {
    finaldata.push([
      new Date(element["yearq"], element["monthq"] - 1, element["dateq"]),
      parseFloat(element["avgavailbikes"]),
    ]);
  });
  //(finaldata);
  dataTable.addRows(finaldata);

  var chart = new google.visualization.Calendar(
    document.getElementById("calendar_basic")
  );

  var options = {
    title: "Average available bikes",
    height: 350,
  };

  chart.draw(dataTable, options);
}

function drawCalAvailBikeStation(data) {
  var dataTable = new google.visualization.DataTable();
  dataTable.addColumn({ type: "date", id: "Date" });
  dataTable.addColumn({ type: "number", id: "Availability" });

  var finaldata = [];
  data.forEach((element) => {
    //(element["yearq"], element["monthq"] - 1, element["dateq"]);
    finaldata.push([
      new Date(element["yearq"], element["monthq"] - 1, element["dateq"]),
      parseFloat(element["avgavailbikestation"]),
    ]);
  });
  //(finaldata);
  dataTable.addRows(finaldata);

  var chart = new google.visualization.Calendar(
    document.getElementById("calendar_basic_stations")
  );

  var options = {
    title: "Average available bike Stations",
    height: 350,
  };

  chart.draw(dataTable, options);
}

function populatedays() {
  var days = "";
  predictvals.forEach((element) => {
    days += "<option value='" + element[0] + "'>" + element[0] + "</option>";
  });
  //.log(days);
  document.getElementById("select-day").innerHTML = days;
}

function populatepredict() {
  var prebikes;
  var prestations;
  var document_value = document.getElementById("select-day").value;
  //.log(document_value);
  predictvals.forEach((element) => {
    if (document_value == element[0]) {
      prebikes = element[1];
      prestations = element[2];
    }
  });
  //.log(prebikes);
  document.getElementById("predbikes").innerHTML = prebikes.toFixed(2);
  document.getElementById("predstation").innerHTML = prestations.toFixed(2);
}
