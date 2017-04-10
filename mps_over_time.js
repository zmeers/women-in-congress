// ----------------------------------------------------------------------------
// DEFINE KEY SETTINGS FOR TIMELINE
// ----------------------------------------------------------------------------

// These are the margins for the SVG
var margin = {
    top: 60,
    right: 50,
    bottom: 60,
    left: 100
};

// These are the colours used to identify each political party as well as
// a few additional functions
var colors = {
    "Lab": "#C61148",
    "Con": "#0096DB",
    "SNP": "#FCCA46",
    "Lib Dem": "#F37A48",
    "LD": "#F37A48",
    "Green": "#A1C181",
    "SF": "#008e4b",
    "Other": "#50514F", // Used as fallback when no party colour has been defined
    "Hover": "#e5e5e5", // Used when hovering over an item
    "Active": "#A1C181" // Used for the active slide on the tracker
}

// Track the current and desired slides for transitioning
var new_slide = 0
var current_slide = -1
var partyToggled = false

// These are the labels for each slide
var tracker_data = [{
        section: "Intro",
    },
    {
        section: "All MPs",
    },
    {
        section: "Next",
    },
    {
        section: "Down",
    },
    {
        section: "Down",
    },
    {
        section: "Down",
    },
]

// These are the colours to be used on repeat for the tracker hexagon
var tracker_colors = ["#5c5c5c", "#424242"]

// If a political party has a colour defined,
// then it also has an SVG logo that we can use
var partyHasLogo = Object.keys(colors);

// ----------------------------------------------------------------------------
// WHEN SUPPLIED WITH PARTY ACRONYM, RETURN PARTY COLOUR OR FALLBACK
// IF PARTY WASN'T FOUND
// ----------------------------------------------------------------------------
function colorParty(party) {
    if (colors[party] != undefined) {
        return colors[party];
    } else {
        return colors["Other"];
    }
}
// ----------------------------------------------------------------------------
// UPDATE GRAPH WHEN USER MOVES TO A NEW SLIDE
// ----------------------------------------------------------------------------
function update_state() {
    // Only update if we are actually changing states
    if (current_slide != new_slide) {
        // Go from slide 0 to slide 1
        if (current_slide == 0 & new_slide == 1) {
            second_slide()
        }
        current_slide = new_slide
    }
    // Lastly update the hexagon tracker colours
    d3.selectAll(".arc")
        .selectAll("path")
        .attr("fill", function (a) {
            return a.index == current_slide ? colors["Active"] : tracker_colors[a.index % tracker_colors.length];
        })
}

// ----------------------------------------------------------------------------
// INITIALISE THE HEXAGON TRACKER TO IDENTIFY AND SWITCH BETWEEN SLIDES
// ----------------------------------------------------------------------------
function initialise_tracker() {
    var tracker_outer_radius = 30
    var tracker_inner_radius = 0
    d3.select(".tracker")
        .remove()
    var tracker_div = d3.select("body")
        .append("div")
        .attr("class", "tracker")

    // Prev button
    tracker_div
        .append("button")
        .attr("type", "button")
        .attr("class", "nav-prev")
        .text("Prev")
        .on("click", function () {
            new_slide = Math.max(0, current_slide - 1)
            update_state()
        })
    // Tracker hexagon wrapper
    var tracker_wrapper = tracker_div
        .append("svg")
        .append("g")
        .attr("class", "tracker-wrapper")
        .attr("transform", `translate(${tracker_outer_radius},${tracker_outer_radius})`)

    // Next button
    tracker_div
        .append("button")
        .attr("type", "button")
        .attr("class", "nav-next")
        .text("Next")
        .on("click", function () {
            new_slide = Math.min(tracker_data.length - 1, current_slide + 1)
            update_state()
        })

    var pie = d3.pie()
        .value(1) // Same fraction for every slice

    var path = d3.arc()
        .outerRadius(tracker_outer_radius)
        .innerRadius(tracker_inner_radius)

    var arc = tracker_wrapper.selectAll(".arc")
        .data(pie(tracker_data))
        .enter()
        .append("g")
        .attr("class", "arc")

    arc.append("path")
        .attr("d", path)
        .on("mouseover", function (d) {
            d3.select(this)
                .attr("fill", colors["Hover"])
        })
        .on("mouseout", function (d) {
            update_state()
        })
        .on("click", function (d) {
            new_slide = d.index
            update_state()
        })
    update_state()

    ///////////////////////////////////////////////////////////////////////////
    /////////////////////// Hexagon ///////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////

    var SQRT3 = Math.sqrt(3),
        hexRadius = tracker_outer_radius,
        hexWidth = SQRT3 * hexRadius,
        hexHeight = 2 * hexRadius;
    var hexagonPoly = [
        [0, -1],
        [SQRT3 / 2, 0.5],
        [0, 1],
        [-SQRT3 / 2, 0.5],
        [-SQRT3 / 2, -0.5],
        [0, -1],
        [SQRT3 / 2, -0.5]
    ];
    var hexagonPath = "m" + hexagonPoly.map(function (p) {
            return [p[0] * hexRadius, p[1] * hexRadius].join(',');
        })
        .join('l') + "z";

    //Place a hexagon on the scene
    tracker_wrapper.append("path")
        .attr("class", "tracker-hexagon")
        .attr("d", hexagonPath)
        .style("stroke", colors["Active"])
        .style("stroke-width", "8px")
        .style("fill", "none")

    var defs = svg.append("defs")
    var mask = tracker_wrapper.append("clipPath")
        .attr("id", "hex-mask")
        .append("path")
        .attr("fill", "none")
        .attr("d", hexagonPath)

    // Attach hexagon clip mask to tracker wrapper
    d3.select('.tracker-wrapper')
        .attr("clip-path", "url(#hex-mask)")
}

// ----------------------------------------------------------------------------
// SET UP FOR THE FIRST SLIDE: ALL WOMEN MPS OVER TIME
// ----------------------------------------------------------------------------
function initial_render() {
    // INITIALISE THE X AND Y AXIS SCALES AND RANGES
    x = d3.scaleTime()
        .domain([new Date(1915, 01, 01), new Date(2020, 01, 01)])
        .range([0, width]);

    y = d3.scaleLinear()
        .domain([0, 200]) // Almost 200 MPs by 2020
        .range([height, 0]);

    // Add the group wrapper that contains the whole graph
    var wrapper = svg
        .append("g")
        .attr("class", "timeline-wrapper")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Initialise the hexagon tracker that tracks the state of the graph
    initialise_tracker()

    // Add a bounding box to clip points so that they aren't visible outside
    // the chart area when we zoom in
    var boundingBox = wrapper
        .append("rect")
        .style("opacity", 0.0)
        .attr("width", width)
        .attr("height", height)

    var stage = 1

    // Initialise the tooltip
    tooltip = d3.tip()
        .attr("class", "d3-tip")
        // .offset([-10, 0])
        .direction('s')
        .html(function (d) {
            if (partyHasLogo.indexOf(d.party) != -1) {
                partyLogo = 0
            } else {
                partyLogo = 1
            }
            return `<h1 style="background-color: ${colorParty(d.party)};">${d.name}</h1><div class="mp-term">${d3.timeFormat("%Y")(d.term_start)} &rarr; \
            ${d3.timeFormat("%Y")(d.term_end)}</div><div class="mp-party" style="opacity: ${partyLogo}">${d.party}</div><div class="mp-constituency">${d.constituency}</div>
            <svg role="img"><title>${d.party}</title><use xlink:href="./party_logos/party_logos.svg#${d.party}"/></svg>`;
        })

    wrapper.call(tooltip);

    // Add a group and clip it to a rectangle defined below
    var clippedArea = wrapper.append("g")
        .attr("id", "clippedArea")
        .attr("clip-path", "url(#clip)")

    // Add the points group that will hold all our data points
    // pointsGroup is a GLOBAL variable
    pointsGroup = clippedArea
        .append("g")
        .attr("id", "points")

    // Create the clip rectangle used for the graph
    wrapper.append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", width)
        .attr("height", height);

    // Add the x axis to the bottom of the graph
    var xAxis = d3.axisBottom(x)
    var gX = wrapper.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    // Add the y axis to the left of the graph
    yAxis = d3.axisLeft(y)
    gY = wrapper.append("g")
        .attr("class", "y-axis")
        .call(yAxis);

    // Tooltip target location, defined as a circle in svg
    var target = wrapper
        .append("circle")
        .attr("id", "target-loc")
        .attr("cx", Math.max(100, margin.left + 0.2 * width))
        .attr("cy", 0.1 * height)
        .attr("r", 5)
        .style("opacity", 0)
        .node()

    // Add a group to contain each data point and bind to timeline data
    instance = pointsGroup
        .selectAll("g")
        .data(mps_over_time_data)
        .enter()
        .append("g")

    // Add circle to signify start and end of term
    instance
        .append("circle")
        .attr("r", circleRadius)
        .attr("class", "term-start")

    instance
        .append("circle")
        .attr("r", circleRadius)
        .attr("class", "term-end")

    // Add a line connecting start and end of term
    instance
        .append("line")
        .attr("class", "line-connect")
        .style("stroke-width", lineThickness)

    // Use a hidden rect to catch mouseovers more easily (similar to voronoi mouseover grid)
    instance
        .append("rect")
        .attr("class", "hover-rect")
        .style("opacity", 0)

    // For each start and end point, set position and colour
    instance.selectAll(".term-start")
        .attr("cx", function (d) {
            return x(d.term_start)
        })
        .attr("cy", function (d) {
            return y(d.stream)
        })
        .attr("fill", function (d) {
            return colorParty(d.party);
        })

    instance.selectAll(".term-end")
        .attr("cx", function (d) {
            return x(d.term_end)
        })
        .attr("cy", function (d) {
            return y(d.stream)
        })
        .attr("fill", function (d) {
            return colorParty(d.party);
        })

    // For each MP line, set position and stroke colour
    instance.selectAll(".line-connect")
        .attr("x1", function (d) {
            return x(d.term_start)
        })
        .attr("x2", function (d) {
            return x(d.term_end)
        })
        .attr("y1", function (d) {
            return y(d.stream)
        })
        .attr("y2", function (d) {
            return y(d.stream)
        })
        .attr("stroke", function (d) {
            return colorParty(d.party);
        })

    // For each hidden rectangle belonging to a point, set position and size
    // so that it covers the space between points
    instance.selectAll(".hover-rect")
        .attr("x", function (d) {
            return x(d.term_start) - circleRadius / 2
        })
        .attr("y", function (d) {
            return y(d.stream) - (y(1) - y(2)) / 2
        })
        .attr("width", function (d) {
            return x(d.term_end) - x(d.term_start) + circleRadius
        })
        .attr("height", y(1) - y(2)) // height of rectangle is one unit of the y axis

    // For each point group, set tooltip to display on mouseover
    // Each group includes the start and end cirles, line inbetween and the hidden hover rectangle
    instance
        .on("mouseover", function (d) {
            // Only show mouseover if MP is in toggled party or if no party is filtered
            if (partyToggled == false | d.party == partyToggled) {
                tooltip.show(d, target)

                // Increase line thickness of all terms of the same MP
                pointsGroup.selectAll(".line-connect")
                    .style("stroke-width", function (a) {
                        return (d.clean_name == a.clean_name) ? 2 * lineThickness : lineThickness
                    })
                // Also make the start and end circles bigger
                pointsGroup.selectAll(".term-start")
                    .attr("r", function (a) {
                        return (d.clean_name == a.clean_name) ? 1.5 * circleRadius : circleRadius
                    })
                pointsGroup.selectAll(".term-end")
                    .attr("r", function (a) {
                        return (d.clean_name == a.clean_name) ? 1.5 * circleRadius : circleRadius
                    })
            }
        })
        // On mouse out, change everything back
        .on("mouseout", function (d) {
            pointsGroup
                .selectAll(".line-connect")
                .style("stroke-width", lineThickness)
            pointsGroup
                .selectAll(".term-start")
                .attr("r", circleRadius)
            pointsGroup
                .selectAll(".term-end")
                .attr("r", circleRadius)
        })
        // When an MP point is clicked, toggle show all MPs from the same party and hide the rest
        .on("click", function (d) {
            if (partyToggled == false) {
                // Store toggled party
                partyToggled = d.party
            } else {
                partyToggled = false
            }
            pointsGroup.selectAll("g")
                .style("opacity", function (a) {
                    return (d.party == a.party) ? 1.0 : ((partyToggled == false) ? 1.0 : 0.1)
                })
        })

    // Add chart title
    wrapper.append("text")
        .attr("x", (width / 2))
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")
        .attr("class", "chart-title")
        .text("Women MPs in the House of Commons")

    // Add zoom capabilities for the points
    var zoom = d3.zoom()
        .scaleExtent([0.95, 40])
        .on("zoom", zoomed);
    svg.call(zoom);

    function zoomed() {
        pointsGroup.attr("transform", d3.event.transform)
        gX.call(xAxis.scale(d3.event.transform.rescaleX(x)));
        gY.call(yAxis.scale(d3.event.transform.rescaleY(y)));
    }

    // Exit
    instance
        .exit()
        .remove();

    // Update current slide number
    current_slide = 0

}

// ----------------------------------------------------------------------------
// SECOND SLIDE: SHOW THE TOTAL NUMBER OF MPS OVER TIME AS A LINE GRAPH
// ----------------------------------------------------------------------------
function second_slide() {
    // Delete all objects belonging to this slide so that we don't duplicate them
    d3.select(".max-mps-line").remove()
    d3.select(".max-mps-area").remove()
    d3.select(".half-max-mps-path").remove()
    d3.select(".total-women-mps-path").remove()
    d3.select(".total-women-mps-area").remove()
    // Add interpolation line for total mps ove time
    var max_mps_line = d3.line()
        .x(function (d) {
            return x(d.year)
        })
        .y(function (d) {
            return y(d.total_mps)
        })
        .curve(d3.curveBasis)

    // Add the svg path to display this line
    var max_mps_path = pointsGroup.append("path")
        .datum(total_mps_over_time_data)
        .attr("fill", "none")
        .attr("stroke", colors["Hover"])
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 1.5)
        .attr("d", max_mps_line)
        .attr("class", "max-mps-line")

    // Also add an area curve to shade the whole region below the max mp line
    var max_mps_area = d3.area()
        .curve(d3.curveBasis)
        .x(function (d) {
            return x(d.year);
        })
        .y0(height)
        .y1(function (d) {
            return y(d.total_mps);
        });

    // Add the svg path for this shaded region
    var max_mps_path_area = pointsGroup.append("path")
        .data([total_mps_over_time_data])
        .attr("d", max_mps_area)
        .attr("fill", colors["Lab"])
        .style("opacity", 0)
        .attr("class", "max-mps-area")

    // Add a 50% line to show halfway mark for gender
    var half_max_mps_line = d3.line()
        .x(function (d) {
            return x(d.year)
        })
        .y(function (d) {
            return y(d.total_mps / 2)
        })
        .curve(d3.curveBasis)

    // Add this in svg
    var half_max_mps_path = pointsGroup.append("path")
        .datum(total_mps_over_time_data)
        .attr("fill", "none")
        .attr("stroke", colors["Hover"])
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "5,10")
        .attr("d", half_max_mps_line)
        .attr("class", "half-max-mps-path")

    // Curve to show total number of women MPs over time
    var total_women_mps_line = d3.line()
        .x(function (d) {
            return x(d.year)
        })
        .y(function (d) {
            return y(d.total_women_mps)
        })
        .curve(d3.curveBasis)

    // add the line path
    var total_women_mps_path = pointsGroup.append("path")
        .datum(number_women_over_time_data)
        .attr("fill", "none")
        .attr("stroke", colors["Hover"])
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 1.5 * circleRadius)
        .attr("d", total_women_mps_line)
        .attr("stroke-dasharray", function (d) {
            return this.getTotalLength()
        })
        .attr("stroke-dashoffset", function (d) {
            return this.getTotalLength()
        })
        .attr("class", "total-women-mps-path")

    // Area curve for total number of women MPs
    var total_women_mps_area = d3.area()
        .curve(d3.curveBasis)
        .x(function (d) {
            return x(d.year);
        })
        .y0(height)
        .y1(function (d) {
            return y(d.total_women_mps);
        });

    // Add the area path
    var total_women_mps_path_area = pointsGroup.append("path")
        .data([number_women_over_time_data])
        .attr("d", total_women_mps_area)
        .attr("fill", colors["Hover"])
        .style("opacity", 0)
        .attr("class", "total-women-mps-area")

    // ----------------------------------------------------------------------------
    // START THE TRANSITION FROM MP POINTS TO LINE GRAPH
    // ------------------------------------------------------------------------

    // Hide the tooltip
    tooltip.hide()
    // Create a bisector method to find the nearest point in the total mp data
    bisect = d3.bisector(function (a) {
            return a.year
        })
        .left
    pointsGroup.selectAll(".line-connect")
        .transition()
        .duration(1000)
        .attr("x2", function (a) {
            return x(a.term_start)
        })
    pointsGroup.selectAll(".term-start")
        // .attr("r", function (a) {
        //     return (d.party == a.party) ? 1.5 * circleRadius : circleRadius
        // })
        .transition()
        .delay(1000)
        .duration(1000)
        .attr("cx", function (a) {
            return x(number_women_over_time_data[bisect(number_women_over_time_data, a.term_start)].year)
        })
        .attr("cy", function (a) {
            return y(number_women_over_time_data[bisect(number_women_over_time_data, a.term_start)].total_women_mps)
        })
        .style("opacity", 0)
    pointsGroup.selectAll(".term-end")
        // .attr("r", function (a) {
        //     return (d.party == a.party) ? 1.5 * circleRadius : circleRadius
        // })
        .transition()
        .duration(1000)
        .attr("cx", function (a) {
            return x(a.term_start)
        })
        .transition()
        .attr("r", function (a) {
            return 3 * circleRadius
        })
        .attr("cy", function (a) {
            return y(number_women_over_time_data[bisect(number_women_over_time_data, a.term_start)].total_women_mps)
        })
        .transition()
        .delay(3000)
        .attr("r", 0)

    total_women_mps_path
        .transition()
        .delay(2000)
        .duration(500)
        .transition()
        .ease(d3.easeCubic)
        .duration(3000)
        .attr("stroke-dashoffset", 0)

    y.domain([0, 750])

    gY
        .transition()
        .delay(6000)
        .duration(2000)
        .call(yAxis)
    total_women_mps_path
        .transition()
        .delay(6000)
        .duration(2000)
        .attr("d", total_women_mps_line)

    total_women_mps_path_area
        .transition()
        .delay(6000)
        .duration(2000)
        .attr("d", total_women_mps_area)
        .style("opacity", 1)

    max_mps_path
        .transition()
        .delay(6000)
        .duration(2000)
        .attr("d", max_mps_line)

    max_mps_path_area
        .transition()
        .delay(6000)
        .duration(2000)
        .attr("d", max_mps_area)
        .style("opacity", 1)
    half_max_mps_path
        .transition()
        .delay(6000)
        .duration(2000)
        .attr("d", half_max_mps_line)

    instance
        .on("mouseover", null)
        .on("mouseout", null)
        .on("click", null)
}

// ----------------------------------------------------------------------------
// FIND TIMELINE DIV AND ADD SVG
// ----------------------------------------------------------------------------
var timeline = document.getElementById("timeline")
var svg = d3.select(timeline)
    .append("svg")

// ----------------------------------------------------------------------------
// GLOBAL VARIABLES TO STORE SPECIFIC SELECTORS AND DATA
// ----------------------------------------------------------------------------
var pointsGroup,
    instance,
    x, y,
    yAxis, gY,
    tooltip,
    lineThickness,
    circleRadius,
    mps_over_time_data,
    number_women_over_time_data,
    total_mps_over_time_data

// ----------------------------------------------------------------------------
// GET DATA AND DRAW INITIAL GRAPH, WHILE RESIZING TO FIT WITHIN WINDOW
// ----------------------------------------------------------------------------
function draw_graph() {
    d3.selectAll("g")
        .remove()
    d3.select(".d3-tip")
        .remove()
    // Chart dimensions - use parent div size
    width = timeline.clientWidth - margin.left - margin.right,
        height = timeline.clientHeight - margin.top - margin.bottom;
    // SET THE THICKNESS OF EACH LINE BASED ON THE CHART HEIGHT
    lineThickness = 0.0018 * height;
    // SET THE RADIUS OF EACH LINE'S END BASED ON THE LINE THICKNESS
    circleRadius = lineThickness;
    svg
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    d3.queue()
        .defer(d3.csv, "mps_over_time.csv", function (d) {
            var parseDate = d3.timeParse("%Y-%m-%d");
            return {
                name: d.name,
                constituency: d.constituency,
                term_start: parseDate(d.term_start),
                term_end: parseDate(d.term_end),
                party: d.party,
                byelection: (d.byelection == "TRUE"),
                notes: d.notes,
                clean_name: d.clean_name,
                stream: +d.stream
            };
        })
        .defer(d3.csv, "number_women_over_time.csv", function (d) {
            var parseDate = d3.timeParse("%Y-%m-%d");
            return {
                year: parseDate(d.Year),
                total_women_mps: +d.Total,
                total_mps: +d.total_mps
            }
        })
        .defer(d3.csv, "total_mps_over_time.csv", function (d) {
            var parseDate = d3.timeParse("%Y-%m-%d");
            return {
                year: parseDate(d.Year),
                total_mps: +d.total_mps
            }
        })
        .await(analyze);

    function analyze(error, mps_over_time, number_women_over_time, total_mps_over_time) {
        // Make global
        mps_over_time_data = mps_over_time
        number_women_over_time_data = number_women_over_time
        total_mps_over_time_data = total_mps_over_time
        initial_render()
    };
}

// INITIAL DRAW
draw_graph()
// ----------------------------------------------------------------------------
// REDRAW GRAPH ON WINDOW RESIZE
// ----------------------------------------------------------------------------
window.addEventListener('resize', draw_graph);
