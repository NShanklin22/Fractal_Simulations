let segments = [];
let squares = [];
let length = 300;
let endSegment;
let firstTime = true;
let viewScale = 0.5;
let targetViewScale = 0.5;
let transitionAmount = 0;
let fractalBounds = { minX: -300, maxX: 300, minY: -300, maxY: 300 };
let segmentToSquareThreshold = 3;
let frameCounter = 0;
let iterationComplete = true;

function setup() {
  createCanvas(1500, 700);
  // Create initial vertical segment
  let a = createVector(0, 0);
  let b = createVector(0, length);
  endSegment = new Segment(a, b, b); // Important: first segment is endSegment
  endSegment.completed = true;
  segments.push(endSegment);
  
  calculateViewScale();
}

function draw() {
  background(0);
  frameCounter++;
  
  // Center the view
  translate(width / 2, height / 2);
  
  // Update transition with smooth easing
  if (transitionAmount < 1) {
    transitionAmount += 0.01;
  }
  
  // Smooth scale transition
  viewScale = lerp(viewScale, targetViewScale, 0.1);
  
  // Draw squares (transformed segments)
  for (let sq of squares) {
    sq.show(viewScale);
  }
  
  // Update and draw active segments
  iterationComplete = true;
  for (let s of segments) {
    if (!s.completed) {
      s.update();
      iterationComplete = false;
    }
    s.show(viewScale);
  }
  
  // Start next iteration when current one is complete
  if (iterationComplete && transitionAmount >= 1) {
    nextSet();
    transitionAmount = 0;
  }
  
  // Convert tiny segments to squares periodically
  if (frameCounter % 30 === 0) {
    checkSegmentsForConversion();
  }
}

function nextSet() {
  // CRITICAL: Exactly matching your original logic
  let newSegments = [];
  
  for (let s of segments) {
    // Use endSegment.a as the origin for duplicated segments
    let newSegment = s.duplicate(endSegment.a);
    
    // Special case for the first time
    if (firstTime) {
      newSegment.origin = endSegment.b.copy();
      firstTime = false;
    }
    
    newSegments.push(newSegment);
  }
  
  // VERY IMPORTANT: Update endSegment to be the first segment of the new set
  endSegment = newSegments[0];
  
  // Add new segments to the array
  segments = segments.concat(newSegments);
  
  // Update view scale
  updateFractalBounds();
  calculateViewScale();
}

function updateFractalBounds() {
  fractalBounds = { 
    minX: Infinity, 
    maxX: -Infinity, 
    minY: Infinity, 
    maxY: -Infinity 
  };
  
  for (let s of segments) {
    fractalBounds.minX = min(fractalBounds.minX, s.a.x, s.b.x);
    fractalBounds.maxX = max(fractalBounds.maxX, s.a.x, s.b.x);
    fractalBounds.minY = min(fractalBounds.minY, s.a.y, s.b.y);
    fractalBounds.maxY = max(fractalBounds.maxY, s.a.y, s.b.y);
  }
  
  const padding = 50;
  fractalBounds.minX -= padding;
  fractalBounds.maxX += padding;
  fractalBounds.minY -= padding;
  fractalBounds.maxY += padding;
}

function calculateViewScale() {
  let fractalWidth = fractalBounds.maxX - fractalBounds.minX;
  let fractalHeight = fractalBounds.maxY - fractalBounds.minY;
  
  let widthScale = (width * 0.8) / fractalWidth;
  let heightScale = (height * 0.8) / fractalHeight;
  
  targetViewScale = min(widthScale, heightScale);
}

function checkSegmentsForConversion() {
  let segmentsToKeep = [];
  
  for (let s of segments) {
    let screenLength = p5.Vector.dist(s.a, s.b) * viewScale;
    
    if (screenLength < segmentToSquareThreshold && s.completed) {
      let midpoint = p5.Vector.add(s.a, s.b).mult(0.5);
      let size = p5.Vector.dist(s.a, s.b) * 0.5;
      squares.push(new Square(midpoint, size));
    } else {
      segmentsToKeep.push(s);
    }
  }
  
  segments = segmentsToKeep;
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
    
    // Rotate points around the origin, exactly as in your original code
    let Va = p5.Vector.sub(this.startA, this.origin);
    let Vb = p5.Vector.sub(this.startB, this.origin);
    Va.rotate(this.angle);
    Vb.rotate(this.angle);
    this.a = p5.Vector.add(Va, this.origin);
    this.b = p5.Vector.add(Vb, this.origin);
  }
}

class Square {
  constructor(center, size) {
    this.center = center;
    this.size = size;
    this.color = color(0, 200, 100, 200);
  }
  
  show(scale) {
    noStroke();
    fill(this.color);
    
    let screenPos = p5.Vector.mult(this.center, scale);
    let screenSize = this.size * scale;
    
    rectMode(CENTER);
    rect(screenPos.x, screenPos.y, screenSize * 2, screenSize * 2);
  }
}