// SIR model
// Copyright Shodor, 2022
// Written by Aaron Weeden
// Graph JavaScript code

// Declare global constants
const FILL_GRAPH = false;
const MAX_VERTICAL_GRID_LINES = 8;
const GRAPH_Y_MIN = 0;
const GRAPH_POINT_RADIUS = 0;

// Declare global variables
var Graph;
var GraphCanvas;

// To initialize the graph given the number of people in the model, and the
// data about the types of people in the model
function initializeGraph() {

  // Fetch the graph canvas
  GraphCanvas = document.getElementById("graph");

  // Use the Chart.js library
  Graph = new Chart(GraphCanvas, {
    type: "line",
    data: {
      /* The labels and datasets will be filled in later */
      labels: [],
      datasets: []
    },
    options: {
      /* Do not animate the graph, since updates will be happening quickly as the model is
         running */
      animation: {
        duration: 0
      },
      elements: {
        line: {
          tension: 0
        }
      },
      legend: {
        position: "bottom"
      },
      scales: {
        xAxes: [{
          scaleLabel: {
            display: true,
            labelString: "Time"
          },
          ticks: {
            maxTicksLimit: MAX_VERTICAL_GRID_LINES
          }
        }],
        yAxes: [{
          scaleLabel: {
            display: false
          },
          ticks: {
            fixedStepSize: 1,
            min: GRAPH_Y_MIN,
            max: NumPeople
          }
        }]
      }
    }
  });

  // Create the graph datasets
  createGraphDatasets();
}

// To create the graph datasets,
function createGraphDatasets() {

  // For each type of person,
  for (let type in PARAMETERS.PEOPLE.TYPES) {

    // Get the data for that type of person
    var data = PARAMETERS.PEOPLE.TYPES[type];

    // Add a dataset to the graph given that data
    Graph.data.datasets.push({
      backgroundColor: data.COLOR,
      borderColor: data.COLOR,
      data: [],
      fill: FILL_GRAPH,
      fillColor: data.COLOR,
      label: type,
      pointRadius: GRAPH_POINT_RADIUS
    });
  }
}

// To reset the graph,
function resetGraph() {

  // Empty the graph's list of labels
  Graph.data.labels = [];

  // For each of the graph's datasets,
  for (var i = 0; i < Graph.data.datasets.length; i++) {

    // Empty the list of data for that graph
    Graph.data.datasets[i].data = [];
  }
}

// To add data to the graph,
function addGraphData() {

  // Add the label for the current time step to the x-axis
  Graph.data.labels.push(TimeStep);

  // For each type of person
  let i = 0;
  for (let type in PARAMETERS.PEOPLE.TYPES) {

    // Add a new data point to the dataset for the number of that person
    Graph.data.datasets[i++].data.push(PersonCounts[type]);
  }

  // Refresh the graph display
  Graph.update(0);
}
