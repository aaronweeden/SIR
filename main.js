// Agent-based SIR model
// Copyright Shodor, 2022
// Written by Aaron Weeden, modified by 
// Main JavaScript code
// Model story:
//   - People are placed randomly and move randomly in the world.
//   - Some of the people are susceptible (do not have the disease yet), some
//     are infected (have the disease), and some are recovered (had the disease
//     but do not anymore and cannot catch it again).
//   - If an infected person is next to a susceptible person, with some percent
//     chance, that susceptible person will become an infected person.
//   - After an infected person has had the disease for a certain number of time
//     steps, the person becomes recovered.
//   - The model continues running until there are no more infected people or
//     until a specified number of time steps has elapsed.

// Declare global constants
const PARAMETERS = Object.freeze({
  PEOPLE: {
    TYPES: {
      SUSCEPTIBLE: {
        INIT_NUM: 599,
        COLOR: "blue",
        MAX_SPEED: 10
      },
      INFECTED: {
        INIT_NUM: 1,
        COLOR: "orange",
        MAX_SPEED: 2
      },
      RECOVERED: {
        INIT_NUM: 0,
        COLOR: "green",
        MAX_SPEED: 5
      }
    },
    RADIUS: 2
  },
  INFECTION: {
    PERCENT_CHANCE: 60,
    RADIUS: 6,
    DURATION: Infinity,
    COLOR: "rgba(255, 100, 0, .3)"
  },
  WORLD: {
    WIDTH: 300,
    HEIGHT: 300
  },
  TIME: {
    STOP_WHEN_NO_INFECTED: true,
    NUM_STEPS: Infinity,
    MILLISECS_PER_TIME_STEP: 150
  }
});
const NEARBY_DISTANCE = PARAMETERS.INFECTION.RADIUS + PARAMETERS.PEOPLE.RADIUS;
const SHOW_PERSON_INDICES = false;

// Declare global variables
var IsRunning;
var NumPeople;
var People;
var TimeStep;
var PersonCounts;
var Canvas;
var Context;
var StartStopButton;
var StepButton;
var CounterOutputs = {
  TimeSteps: null,
  SUSCEPTIBLE: null,
  INFECTED: null,
  RECOVERED: null
};

// To initialize the model,
function initialize() {

  // Fetch the canvas and context objects
  Canvas = document.getElementById("world");
  Context = Canvas.getContext("2d");

  // Fetch the start and step buttons
  StartStopButton = document.getElementById("start-stop-button");
  StepButton = document.getElementById("step-button");

  // Fetch the counter outputs
  CounterOutputs.TimeSteps = document.getElementById("num-time-steps");
  for (const personType in PARAMETERS.PEOPLE.TYPES) {
    CounterOutputs[personType] =
      document.getElementById("num-" + personType.toLowerCase());
  }

  // Set the world size
  Canvas.width = PARAMETERS.WORLD.WIDTH;
  Canvas.height = PARAMETERS.WORLD.HEIGHT;

  // Start counting number of people at zero
  NumPeople = 0;

  // For each person type,
  for (const personType in PARAMETERS.PEOPLE.TYPES) {

    // Add the initial number of people of that type to the count of people
    NumPeople += PARAMETERS.PEOPLE.TYPES[personType].INIT_NUM;

    // Set the key color for the given type
    document.getElementById(
      personType.toLowerCase() + "-key"
    ).style.backgroundColor = PARAMETERS.PEOPLE.TYPES[personType].COLOR;
  }

  // Initialize the graph
  initializeGraph();

  // Reset the model
  reset();
}

// To reset the model,
function reset() {

  // Stop the model in case it is running
  stop();

  // Allow the start button to be clicked
  StartStopButton.disabled = false;

  // Set the number of time steps to zero
  TimeStep = 0;

  // Construct a new array to hold people objects
  People = new Array();

  // For each person,
  for (let i = 0; i < NumPeople; i++) {

    // Construct a new person object, passing in the array index
    let person = new Person(i);

    // Add the person object to the array
    People.push(person);
  }

  // Reset the graph
  resetGraph();

  // Output the model data to the screen
  output();
}

// To construct a person object with the given array index,
function Person(index) {

  // Assign this person its array index
  this.index = index;

  // Assign this person random x- and y-positions
  this.x = getRandomIntLessThan(
    PARAMETERS.WORLD.WIDTH
  );
  this.y = getRandomIntLessThan(
    PARAMETERS.WORLD.HEIGHT
  );

  // If the index is less than the number of susceptible people, assign this
  // person to be susceptible
  if (index < PARAMETERS.PEOPLE.TYPES.SUSCEPTIBLE.INIT_NUM) {
    this.type = "SUSCEPTIBLE";
  }
  // Otherwise, if the index is less than the number of susceptible plus
  // infected people, assign this person to be infected
  else if (index < PARAMETERS.PEOPLE.TYPES.SUSCEPTIBLE.INIT_NUM +
      PARAMETERS.PEOPLE.TYPES.INFECTED.INIT_NUM) {
    this.type = "INFECTED";
  }
  // Otherwise, assign this person to be recovered
  else {
    this.type = "RECOVERED";
  }

  // Assume for now that this person will have the same state in the next time
  // step
  this.nextType = this.type;

  // Assign the number of time steps this person has been sick to 0
  this.infectedTimeSteps = 0;

  // Move the person once to make sure they stay in the bounds of the world
  move(this);
}

// To get a random integer greater than or equal to 0 and less than a given
// maximum value,
function getRandomIntLessThan(max) {

  // Get a random number greater than or equal to 0 and less than or
  // equal to 1
  let r = Math.random();

  // Multiply the number by the maximum value
  r *= max;

  // Round the number down to the nearest integer
  r = Math.floor(r);

  // Return the number
  return r;
}

// To output the model data to the screen,
function output() {

  // Clear the canvas
  Context.clearRect(0, 0, PARAMETERS.WORLD.WIDTH, PARAMETERS.WORLD.HEIGHT);

  // Start counting the number of each type of person at zero
  PersonCounts = {
    SUSCEPTIBLE: 0,
    INFECTED: 0,
    RECOVERED: 0
  };

  // For each person,
  for (let i = 0; i < NumPeople; i++) {

    // Get the person object from the array
    let person = People[i];

    // Add 1 to the count of the person's type
    PersonCounts[person.type]++;

    // Draw the person on the canvas
    draw(person);
  }

  // Update the counter outputs
  CounterOutputs.TimeSteps.innerHTML = TimeStep;
  if (PARAMETERS.TIME.NUM_STEPS < Infinity) {
    CounterOutputs.TimeSteps.innerHTML += " / " + PARAMETERS.TIME.NUM_STEPS;
  }
  for (const personType in PARAMETERS.PEOPLE.TYPES) {
    CounterOutputs[personType].innerHTML = PersonCounts[personType];
  }

  // Add data to the graph
  addGraphData();
}

// To start or stop the model,
function startOrStop() {

  // If the model is already running,
  if (IsRunning) {

    // Stop the model
    stop();
  }
  // Otherwise (if the model is not already running)
  else {

    // Start the model
    start();
  }
}

// To start the model,
function start() {

  // Set that the model has started running
  IsRunning = true;

  // Change the start button to a stop button
  StartStopButton.innerHTML = "Stop";

  // Prevent the step button from being clicked
  StepButton.disabled = true;

  // Set a timeout, after which, if the model is still running, the model
  // steps, pausing for the given number of milliseconds between steps
  setTimeout(function () {
    if (IsRunning) {
      step();
    }
  }, PARAMETERS.TIME.MILLISECS_PER_TIME_STEP);
}

// To stop the model,
function stop() {

  // Set that the model has stopped running
  IsRunning = false;

  // Change the stop button to a start button
  StartStopButton.innerHTML = "Start";

  // Allow the step button to be clicked
  StepButton.disabled = false;
}

// To advance the model by one time step,
function step() {

  // For each person,
  for (let i = 0; i < NumPeople; i++) {

    // Get the person object from the array
    let person = People[i];

    // If the person is infected,
    if (person.type == "INFECTED") {

      // Infect people next to the sick person
      infect(person);

      // If the person has been infected for the infection duration,
      // set them to be recovered in the next time step
      if (person.infectedTimeSteps >= PARAMETERS.INFECTION.DURATION) {
        person.nextType = "RECOVERED";
      }

      // Increment the number of time steps the person has been infected
      person.infectedTimeSteps++;
    }
  }

  // For each person,
  for (let i = 0; i < NumPeople; i++) {

    // Get the person object from the array
    let person = People[i];

    // Move the person
    move(person);

    // Change the person's type for the next time step
    person.type = person.nextType;
  }

  // Increment the time step counter
  TimeStep++;

  // Output the model data to the screen
  output();

  // If the model is set to stop when there are no more infected people,
  // and there are indeed no more infected people, or if the model has run for
  // more than the total number of time steps,
  if ((PARAMETERS.TIME.STOP_WHEN_NO_INFECTED && PersonCounts.INFECTED == 0) ||
      TimeStep >= PARAMETERS.TIME.NUM_STEPS) {

    // Stop the model
    stop();

    // Prevent the start and step buttons from being clicked
    StartStopButton.disabled = true;
    StepButton.disabled = true;
  }
  // Otherwise, if the model is set as running
  else if (IsRunning) {

    // Set a timeout, after which, if the model is still running, the model will
    // step again, pausing for the given number of milliseconds between steps
    setTimeout(function () {
      if (IsRunning) {
        step();
      }
    }, PARAMETERS.TIME.MILLISECS_PER_TIME_STEP);
  }
}

// To move the given person,
function move(person) {

  // Get the person's max speed
  const maxSpeed = PARAMETERS.PEOPLE.TYPES[person.type].MAX_SPEED;

  // Get random x- and y-velocities
  const xVelocity = getRandomIntLessThan(maxSpeed * 2 + 1) - maxSpeed;
  const yVelocity = getRandomIntLessThan(maxSpeed * 2 + 1) - maxSpeed;

  // Move the person
  person.x += xVelocity;
  person.y += yVelocity;

  // If the person is outside the bounds of the world, put
  // them back in
  if (person.x - PARAMETERS.PEOPLE.RADIUS < 0) {
    person.x = PARAMETERS.PEOPLE.RADIUS;
  }
  if (person.y - PARAMETERS.PEOPLE.RADIUS < 0) {
    person.y = PARAMETERS.PEOPLE.RADIUS;
  }
  if (person.x + PARAMETERS.PEOPLE.RADIUS > PARAMETERS.WORLD.WIDTH) {
    person.x = PARAMETERS.WORLD.WIDTH - PARAMETERS.PEOPLE.RADIUS;
  }
  if (person.y + PARAMETERS.PEOPLE.RADIUS > PARAMETERS.WORLD.HEIGHT) {
    person.y = PARAMETERS.WORLD.HEIGHT - PARAMETERS.PEOPLE.RADIUS;
  }
}

// To infect people next to the given person,
function infect(person) {

  // For each person,
  for (let i = 0; i < NumPeople; i++) {

    // Get the other person
    const otherPerson = People[i];

    // If we are comparing a person to itself, continue to the next person
    if (person.index == otherPerson.index) {
      continue;
    }

    // If the other person is susceptible, next to the infected person, and
    // given a percent chance,
    if (otherPerson.type == "SUSCEPTIBLE" &&
        nextTo(person, otherPerson) &&
        getRandomIntLessThan(100) < PARAMETERS.INFECTION.PERCENT_CHANCE) {

      // Infect the other person
      otherPerson.nextType = "INFECTED";
    }
  }
}

// To check if two given people are next to each other,
function nextTo(person, otherPerson) {

  // Calculate the distance between the two people
  const distance = Math.sqrt(
    Math.pow(person.x - otherPerson.x, 2) +
    Math.pow(person.y - otherPerson.y, 2)
  );

  // Check if the two circles overlap and
  // return whether they do
  return distance <= NEARBY_DISTANCE
}

// To draw the given person on the canvas,
function draw(person) {

  // If the person is infected
  if (person.type == "INFECTED") {

    // Set the color for filling the infection circle
    Context.fillStyle = PARAMETERS.INFECTION.COLOR;

    // Fill in a circle with the person's center coordinates
    Context.beginPath()
    Context.arc(
      person.x,
      person.y,
      PARAMETERS.INFECTION.RADIUS,
      0,
      2 * Math.PI
    );
    Context.closePath();
    Context.fill();
  }

  // Set the color for filling the person circle
  Context.fillStyle = PARAMETERS.PEOPLE.TYPES[person.type].COLOR;

  // Fill in a circle with the person's center coordinates
  Context.beginPath()
  Context.arc(
    person.x,
    person.y,
    PARAMETERS.PEOPLE.RADIUS,
    0,
    2 * Math.PI
  );
  Context.closePath();
  Context.fill();

  // If we are showing the indices of people,
  if (SHOW_PERSON_INDICES) {
    Context.fillText(
      person.index,
      person.x + PARAMETERS.PEOPLE.RADIUS,
      person.y + PARAMETERS.PEOPLE.RADIUS
    );
  }
}
