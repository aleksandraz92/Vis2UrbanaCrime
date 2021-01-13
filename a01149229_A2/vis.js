d3.csv("urbana_crimes.csv", function (data) {

    var svg = d3.select("body").append("svg")
        .attr("height", 500)
        .attr("width", 900);



    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);


    // https://www.quora.com/What-are-the-latitude-and-longitude-of-the-U-S-A  Variable which gives us Longitude and Latitude for USA
    var longitudeAmericaR = -124.75;
    var longitudeAmericaL = -66.95;
    var latitudeAmericaT = 25.84;
    var latitudeAmericaB = 49.38;

    // Urbana Longitude and Latitude from .csv file
    var UrbanaLatitude = 40.10;
    var UrbanaLongitude = -88.21;

    //Scaling
    var longitudeScale = d3.scaleLinear()
        .domain([longitudeAmericaR, longitudeAmericaL])
        .range([0, 900]);

    var latitudeScale = d3.scaleLinear()
        .domain([latitudeAmericaB, latitudeAmericaT])
        .range([0, 500]);


    var allData = [];
    var n = 0;


    data.forEach((element) => {
        var mappedArresteeHomeCity = element['ARRESTEE HOME CITY - MAPPED'];
        if (mappedArresteeHomeCity != null) {
            var coordinatesAsString = mappedArresteeHomeCity.substr(mappedArresteeHomeCity.indexOf('(') + 1).slice(0, -1);
            var coordinates = coordinatesAsString.split(/,/);
            var coordinatesAsFloats = [];

            coordinates.forEach((el) => {


                // coordinatesAsFloats.push(parseFloat(el));
                coordinatesAsFloats.push(el.trim());
            });


            //in Range so it can display?
            if ((coordinatesAsFloats[0] > latitudeAmericaT && coordinatesAsFloats[0] < latitudeAmericaB) || (coordinatesAsFloats[1] > longitudeAmericaL && coordinatesAsFloats[1] < longitudeAmericaR) && !isNaN(coordinatesAsFloats[0]) && !isNaN(coordinatesAsFloats[1])) {
                allData[n] = {latitude:coordinatesAsFloats[0],
                    longitude:coordinatesAsFloats[1],
                    gender:element['ARRESTEE SEX'],
                    name:element['ARRESTEE HOME CITY']};
                n++;
            }
        }

    });

// quelle https://stackoverflow.com/questions/14446511/what-is-the-most-efficient-method-to-groupby-on-a-javascript-array-of-objects
    var groupElements = function(first, key) {
        return first.reduce(function(second, value) {
          (second[value[key]] = second[value[key]] || []).push(value);
          return second;
        }, {});
      };
      
    var groupedData = groupElements(allData, 'name');

    // sumarize duplicated data
    allDataAggregated = [];


    var i = 0;
    for (var property in groupedData) {
        if (groupedData.hasOwnProperty(property)) {
            var cityArrayList = groupedData[property];

            var maleCount = 0,femaleCount = 0;
            for(var j = 0;j<cityArrayList.length;j++) {
                if(cityArrayList[j].gender==='MALE'){
                    ++maleCount;
                }else if(cityArrayList[j].gender==='FEMALE'){
                    ++femaleCount;
                }
            }

            allDataAggregated[i] = {
                name: cityArrayList[0].name,
                latitude: cityArrayList[0].latitude,
                longitude: cityArrayList[0].longitude,
                totalArreestes:cityArrayList.length,
                maleArreestes:maleCount,
                femaleArreestes:femaleCount
            };
            i++;
        }
    }

    var brush = d3.brush()
    .extent([[0, 0], [900, 500]])
    .on("start brush end", brushmoved);

    var gBrush = svg.append("g")
    .attr("class", "brush")
    .call(brush);

var handle = gBrush.selectAll(".handle--custom")
  .data([{type: "w"}, {type: "e"}])
  .enter().append("path")
    .attr("class", "handle--custom")
    .attr("fill", "#666")
    .attr("fill-opacity", 0.8)
    .attr("stroke", "#000")
    .attr("stroke-width", 1.5)
    .attr("cursor", "ew-resize")
;

    svg.selectAll("line")
        .data(allDataAggregated)
        .enter()
        .append("line")
        .attr("x1", longitudeScale(UrbanaLongitude))

        .attr("y1", latitudeScale(UrbanaLatitude))

        .attr("x2", function (d) {
            return longitudeScale(d.longitude);
        })
        .attr("y2", function (d) {
            return latitudeScale(d.latitude);
        })
        .style("stroke", function (d) {
            if(d.totalArreestes>3){
                return "red";
            }else if(d.totalArreestes>1){
                return "black";
            }else{
                return "steelblue";
            }
        })
        // .style("stroke", "steelblue")
        .style("stroke-width", 0.4)
        .on("mouseover", function (d) {
            highlightLine(this, d, false);
        })
        .on("mouseout", function (d) {
            highlightLine(this, d, true);
        });


        var modal = document.getElementById('myModal');
        var cityNameInPopup = document.getElementById('cityName');
        var span = document.getElementsByClassName("close")[0];
        span.onclick = function() {
            modal.style.display = "none";
        }
        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        }


    var circle = svg.selectAll("circle")
        .data(allDataAggregated)
        .enter()
        .append("circle")
        .attr("cx", function (d) {
            return longitudeScale(d.longitude);
        })
        .attr("cy", function (d) {
            return latitudeScale(d.latitude);
        })
        .attr("r", 1)
        .style("fill", function (d) {
            if(d.totalArreestes>3){
                return "red";
            }else if(d.totalArreestes>1){
                return "black";
            }else{
                return "steelblue";
            }
        })

        //// quelle : http://bl.ocks.org/d3noob/a22c42db65eb00d4e369 mouseover
        .on("mouseover", function (d) {
            highlightOutline(this, false);
            div.transition()
                .duration(200)
                .style("opacity", .9);
            div.html(d.name + "<br/>")
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", function (d) {
            highlightOutline(this, true);
            div.transition()
                .duration(500)
                .style("opacity", 0)
        })
        .on("click", function (d) {
            modal.style.display = "block";
            cityNameInPopup.innerHTML = d.name;
            var button = document.getElementById("showInfoBtn");
            button.onclick = function() {
                window.open("./table.html?name="+d.name+"&total="+d.totalArreestes+"&maleCount="+d.maleArreestes+"&femaleCount="+d.femaleArreestes, 
                '_blank', 
                'toolbar=0,location=0,menubar=0');
            }
        });  


        function brushmoved() {
            var s = d3.event.selection;

            console.log(x0,y0,x1,y1);


            if (s == null) {
              handle.attr("display", "none");
             // stroke: #f00;
              circle.style("fill", function (d) {
                  console.log(d);
                if(d.totalArreestes>3){
                    return "red";
                }else if(d.totalArreestes>1){
                    return "black";
                }else{
                    return "steelblue";
                }
            }).style("stroke-opacity",0.0);
            } else {
            var x0 = s[0][0],
            y0 = s[0][1],
            x1 = s[1][0],
            y1 = s[1][1];

              circle.style("stroke-opacity",function(d){
                if(longitudeScale(d.longitude)>=x0 && longitudeScale(d.longitude)<=x1 &&
                latitudeScale(d.latitude)>=y0 && latitudeScale(d.latitude)<=y1)
                    return 1.0;
                else{
                    return 0.0;
                }
              }).
              style("stroke","green").
              style("stroke-width", "10px");

              
            }
          }


    var xAxis = d3.axisBottom();
    xAxis.scale(longitudeScale);
    var xAxisGroup = svg.append("g")
        .call(xAxis);


    var yAxis = d3.axisRight();
    yAxis.scale(latitudeScale);
    var yAxisGroup = svg.append("g")
        .call(yAxis);

    function highlightOutline(thisElement, isMouseOut) {
        d3.select(thisElement).style("stroke-opacity", isMouseOut ? 0.0 : 1.0);
        d3.select(thisElement).style("stroke", "green");
        d3.select(thisElement).style("stroke-width", "10px");

    }

    function highlightLine(thisElement, d, isMouseOut) {
        var color;
        if(d.totalArreestes>3){
            color = "red";
        }else if(d.totalArreestes>1){
            color = "black";
        }else{
            color = "steelblue";
        }

        d3.select(thisElement).style("stroke", isMouseOut ? color : 'green');
        d3.select(thisElement).style("stroke-width", isMouseOut ? 0.4 : '5px');

    }


})
    ;