let segments = [];
let length = 100;
let endSegment;
let firstTime = true;
let viewScale = 0.1;
let transitionAmount = 0;
let frameCounter = 0;
let iterationCount = 0;
let iterationComplete = true;
let growthFactor = 1.4142; // Square root of 2
let totalObjects = 0;

// Debug mode and pause variables
let debugMode = false;
let paused = false;
let fpsHistory = [];
let maxFpsHistory = 120; // Keep 2 minutes of data at 60fps

function setup() {
  createCanvas(1500, 700);
  // Create initial vertical segment
  let a = createVector(0, 0);
  let b = createVector(0, length);
  endSegment = new Segment(a, b, b);
  endSegment.completed = true;
  segments.push(endSegment);
  
  calculateInitialBounds();
}

function draw() {
  background(0);
  frameCounter++;
  
  // Record FPS history
  fpsHistory.push(frameRate());
  if (fpsHistory.length > maxFpsHistory) {
    fpsHistory.shift(); // Remove oldest FPS value
  }
  
  // Handle paused state
  if (!paused) {
    // Update transition with smooth easing
    if (transitionAmount < 1) {
      transitionAmount += 0.01;
    }
    
    // Start next iteration when current one is complete
    if (iterationComplete && transitionAmount >= 1) {
      // Before starting next set, update the actual view scale
      viewScale = viewScale / growthFactor;
      
      nextSet();
      iterationCount++;
      transitionAmount = 0;
    }
  }
  
  push();
  // Center the view
  translate(width / 2, height / 2);
  
  // Get current scale based on transition
  let currentScale = getCurrentScale();
  
  // Update and draw segments
  iterationComplete = true;
  for (let s of segments) {
    if (!paused && !s.completed) {
      s.update();
      iterationComplete = false;
    }
    s.show(currentScale);
  }
  
  pop();
  
  // Display stats
  fill(0, 230, 0);
  textSize(32);
  text("Segments: " + segments.length, 10, 50);
  text("Iteration: " + iterationCount, 10, 100);
  text("FPS: " + frameRate().toFixed(1), 10, 150);
  
  // Display pause status
  if (paused) {
    text("PAUSED", 10, 200);
  }
  
  totalObjects = segments.length;
  
  // Draw FPS chart in debug mode
  if (debugMode) {
    drawDebugInfo();
  }
}

function getCurrentScale() {
  let progressRatio = transitionAmount;
  return viewScale * (1 - progressRatio * (1 - 1/growthFactor));
}

function drawDebugInfo() {
  // Draw FPS history chart
  let chartWidth = 400;
  let chartHeight = 150;
  let chartX = width - chartWidth - 20;
  let chartY = 20;
  
  // Chart background
  fill(0, 60, 0);
  rect(chartX, chartY, chartWidth, chartHeight);
  
  // Chart title
  fill(0, 230, 0);
  textSize(18);
  text("FPS History", chartX + 10, chartY + 20);
  
  // Draw FPS values
  stroke(0, 230, 0);
  strokeWeight(1);
  noFill();
  beginShape();
  for (let i = 0; i < fpsHistory.length; i++) {
    let x = chartX + (i / maxFpsHistory) * chartWidth;
    let y = chartY + chartHeight - (fpsHistory[i] / 60) * chartHeight;
    vertex(x, y);
  }
  endShape();
  
  // Add more debug info
  noStroke();
  fill(0, 230, 0);
  textSize(16);
  let infoX = chartX;
  let infoY = chartY + chartHeight + 20;
  text("Segments: " + segments.length, infoX, infoY);
  text("View Scale: " + viewScale.toFixed(6), infoX, infoY + 20);
  text("Current Scale: " + getCurrentScale().toFixed(6), infoX, infoY + 40);
  text("Transition: " + transitionAmount.toFixed(2), infoX, infoY + 60);
  text("Iteration: " + iterationCount, infoX, infoY + 80);
  
  // Draw keyboard controls help
  let helpX = 10;
  let helpY = height - 100;
  textSize(16);
  text("Controls:", helpX, helpY);
  text("D - Toggle Debug Mode", helpX, helpY + 20);
  text("P - Pause/Resume", helpX, helpY + 40);
}

// Check if an object is visible on screen
function isOnScreen(pos, size) {
  return (
    pos.x + size > -width/2 && 
    pos.x - size < width/2 && 
    pos.y + size > -height/2 && 
    pos.y - size < height/2
  );
}

function calculateInitialBounds() {
  // Set initial bounds to encompass the first segment with padding
  let fractalBounds = {};
  fractalBounds.minX = -length;
  fractalBounds.maxX = length;
  fractalBounds.minY = -length;
  fractalBounds.maxY = length;
  
  let fractalWidth = fractalBounds.maxX - fractalBounds.minX;
  let fractalHeight = fractalBounds.maxY - fractalBounds.minY;
  
  let widthScale = (width * 0.8) / fractalWidth;
  let heightScale = (height * 0.8) / fractalHeight;
  
  viewScale = min(widthScale, heightScale);
}

function nextSet() {
  let newSegments = [];
  
  for (let s of segments) {
    let newSegment = s.duplicate(endSegment.a);
    
    if (firstTime) {
      newSegment.origin = endSegment.b.copy();
      firstTime = false;
    }
    
    newSegments.push(newSegment);
  }
  
  endSegment = newSegments[0];
  segments = segments.concat(newSegments);
}

// Handle keyboard input
function keyPressed() {
  if (key === 'd' || key === 'D') {
    debugMode = !debugMode;
  } else if (key === 'p' || key === 'P') {
    paused = !paused;
  }
}

class Segment {
  constructor(a, b, origin) {
    this.startA = a.copy();
    this.startB = b.copy();
    this.a = a.copy();
    this.b = b.copy();
    this.origin = origin.copy();
    this.angle = 0;
    this.completed = false;
    this.weight = 12;
  }

  show(scale) {
    let adaptiveWeight = constrain(this.weight * sqrt(scale), 1, 16);
    
    strokeWeight(adaptiveWeight);
    stroke(0, 238, 0);
    
    let screenA = p5.Vector.mult(this.a, scale);
    let screenB = p5.Vector.mult(this.b, scale);
    fill(255,0,0)
    line(screenA.x, screenA.y, screenB.x, screenB.y);
  }

  duplicate(origin) {
    return new Segment(this.a.copy(), this.b.copy(), origin);
  }

  update() {
    this.angle = lerp(0, Math.PI/2, transitionAmount);
    
    if (this.angle >= Math.PI/2) {
      this.angle = Math.PI/2;
      this.completed = true;
    }
    
    let Va = p5.Vector.sub(this.startA, this.origin);
    let Vb = p5.Vector.sub(this.startB, this.origin);
    Va.rotate(this.angle);
    Vb.rotate(this.angle);
    this.a = p5.Vector.add(Va, this.origin);
    this.b = p5.Vector.add(Vb, this.origin);
  }
}