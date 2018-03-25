var TAU = Math.PI * 2;

function extend(a, b) {
  for (var prop in b) {
    a[prop] = b[prop];
  }
  return a;
}

function lerp(a, b, t) {
  return (b - a) * t + a;
}

function modulo(num, div) {
  return ((num % div) + div) % div;
}

// -------------------------- Vector3 -------------------------- //

function Vector3(position) {
  this.set(position);
}

Vector3.prototype.set = function (pos) {
  pos = Vector3.sanitize(pos);
  this.x = pos.x;
  this.y = pos.y;
  this.z = pos.z;
  return this;
};

Vector3.prototype.rotate = function (rotation) {
  if (!rotation) {
    return;
  }
  this.rotateZ(rotation.z);
  this.rotateY(rotation.y);
  this.rotateX(rotation.x);
  return this;
};

Vector3.prototype.rotateZ = function (angle) {
  rotateProperty(this, angle, 'x', 'y');
};

Vector3.prototype.rotateX = function (angle) {
  rotateProperty(this, angle, 'y', 'z');
};

Vector3.prototype.rotateY = function (angle) {
  rotateProperty(this, angle, 'x', 'z');
};

function rotateProperty(vec, angle, propA, propB) {
  if (angle % TAU === 0) {
    return;
  }
  var cos = Math.cos(angle);
  var sin = Math.sin(angle);
  var a = vec[propA];
  var b = vec[propB];
  vec[propA] = a * cos - b * sin;
  vec[propB] = b * cos + a * sin;
}

Vector3.prototype.add = function (vec) {
  if (!vec) {
    return;
  }
  vec = Vector3.sanitize(vec);
  this.x += vec.x;
  this.y += vec.y;
  this.z += vec.z;
  return this;
};

Vector3.prototype.multiply = function (vec) {
  if (!vec) {
    return;
  }
  vec = Vector3.sanitize(vec);
  this.x *= vec.x;
  this.y *= vec.y;
  this.z *= vec.z;
  return this;
};

Vector3.prototype.lerp = function (vec, t) {
  this.x = lerp(this.x, vec.x, t);
  this.y = lerp(this.y, vec.y, t);
  this.z = lerp(this.z, vec.z, t);
  return this;
};

// ----- utils ----- //

// add missing properties
Vector3.sanitize = function (vec) {
  vec = vec || {};
  vec.x = vec.x || 0;
  vec.y = vec.y || 0;
  vec.z = vec.z || 0;
  return vec;
};


// -------------------------- PathAction -------------------------- //

function PathAction(method, points, previousPoint) {
  this.method = method;
  this.points = points.map(mapVectorPoint);
  this.renderPoints = points.map(mapVectorPoint);
  this.previousPoint = previousPoint;
  this.endRenderPoint = this.renderPoints[this.renderPoints.length - 1];
  // arc actions come with previous point & corner point
  // but require bezier control points
  if (method == 'arc') {
    this.controlPoints = [new Vector3(), new Vector3()];
  }
}

function mapVectorPoint(point) {
  return new Vector3(point);
}

PathAction.prototype.reset = function () {
  // reset renderPoints back to orignal points position
  var points = this.points;
  this.renderPoints.forEach(function (renderPoint, i) {
    var point = points[i];
    renderPoint.set(point);
  });
};

PathAction.prototype.transform = function (translation, rotation, scale) {
  this.renderPoints.forEach(function (renderPoint) {
    renderPoint.multiply(scale);
    renderPoint.rotate(rotation);
    renderPoint.add(translation);
  });
};

PathAction.prototype.render = function (ctx) {
  this[this.method](ctx);
};

PathAction.prototype.move = function (ctx) {
  var point = this.renderPoints[0];
  ctx.moveTo(point.x, point.y);
};

PathAction.prototype.line = function (ctx) {
  var point = this.renderPoints[0];
  ctx.lineTo(point.x, point.y);
};

PathAction.prototype.bezier = function (ctx) {
  var cp0 = this.renderPoints[0];
  var cp1 = this.renderPoints[1];
  var end = this.renderPoints[2];
  ctx.bezierCurveTo(cp0.x, cp0.y, cp1.x, cp1.y, end.x, end.y);
};

PathAction.prototype.arc = function (ctx) {
  var prev = this.previousPoint;
  var corner = this.renderPoints[0];
  var end = this.renderPoints[1];
  var cp0 = this.controlPoints[0];
  var cp1 = this.controlPoints[1];
  cp0.set(prev).lerp(corner, 9 / 16);
  cp1.set(end).lerp(corner, 9 / 16);
  ctx.bezierCurveTo(cp0.x, cp0.y, cp1.x, cp1.y, end.x, end.y);
};


// -------------------------- Shape -------------------------- //

function Shape(options) {
  this.create(options);
}

Shape.prototype.create = function (options) {
  // default
  extend(this, Shape.defaults);
  // set options
  setOptions(this, options);

  this.updatePathActions();

  // transform
  this.translate = new Vector3(options.translate);
  this.rotate = new Vector3(options.rotate);
  var scale = extend({
    x: 1,
    y: 1,
    z: 1
  }, options.scale);
  this.scale = new Vector3(scale);
  // children
  this.children = [];
  if (this.addTo) {
    this.addTo.addChild(this);
  }
};

Shape.defaults = {
  stroke: true,
  fill: false,
  color: 'black',
  lineWidth: 1,
  closed: true,
  rendering: true,
  path: [{}],
};

var optionKeys = Object.keys(Shape.defaults).concat([
  'rotate',
  'translate',
  'scale',
  'addTo',
  'width',
  'height',
]);

function setOptions(shape, options) {
  for (var key in options) {
    if (optionKeys.includes(key)) {
      shape[key] = options[key];
    }
  }
}

var actionNames = [
  'move',
  'line',
  'bezier',
  'arc',
];

// parse path into PathActions
Shape.prototype.updatePathActions = function () {
  var previousPoint;
  this.pathActions = this.path.map(function (pathPart, i) {
    // pathPart can be just vector coordinates -> { x, y, z }
    // or path instruction -> { arc: [ {x0,y0,z0}, {x1,y1,z1} ] }
    var keys = Object.keys(pathPart);
    var method = keys[0];
    var points = pathPart[method];
    var isInstruction = keys.length === 1 && actionNames.includes(method) &&
      Array.isArray(points);

    if (!isInstruction) {
      method = 'line';
      points = [pathPart];
    }

    // first action is always move
    method = i === 0 ? 'move' : method;
    // arcs require previous last point
    var pathAction = new PathAction(method, points, previousPoint);
    // update previousLastPoint
    previousPoint = pathAction.endRenderPoint;
    return pathAction;
  });
};

Shape.prototype.addChild = function (shape) {
  this.children.push(shape);
};

// ----- update ----- //

Shape.prototype.update = function () {
  // update self
  this.reset();
  // update children
  this.children.forEach(function (child) {
    child.update();
  });
  this.transform(this.translate, this.rotate, this.scale);
};

Shape.prototype.reset = function () {
  // reset pathAction render points
  this.pathActions.forEach(function (pathAction) {
    pathAction.reset();
  });
};

Shape.prototype.transform = function (translation, rotation, scale) {
  // transform points
  this.pathActions.forEach(function (pathAction) {
    pathAction.transform(translation, rotation, scale);
  });
  // transform children
  this.children.forEach(function (child) {
    child.transform(translation, rotation, scale);
  });
};

Shape.prototype.updateSortValue = function () {
  var sortValueTotal = 0;
  this.pathActions.forEach(function (pathAction) {
    sortValueTotal += pathAction.endRenderPoint.z;
  });
  // average sort value of all points
  // def not geometrically correct, but works for me
  this.sortValue = sortValueTotal / this.pathActions.length;
};

// ----- render ----- //

Shape.prototype.render = function (ctx) {
  var length = this.pathActions.length;
  if (!this.rendering || !length) {
    return;
  }
  var isDot = length == 1;
  if (isDot) {
    this.renderDot(ctx);
  } else {
    this.renderPath(ctx);
  }
};

// Safari does not render lines with no size, have to render circle instead
Shape.prototype.renderDot = function (ctx) {
  ctx.fillStyle = this.color;
  var point = this.pathActions[0].endRenderPoint;
  ctx.beginPath();
  var radius = this.lineWidth / 2;
  ctx.arc(point.x, point.y, radius, 0, TAU);
  ctx.fill();
};

Shape.prototype.renderPath = function (ctx) {
  // set render properties
  ctx.fillStyle = this.color;
  ctx.strokeStyle = this.color;
  ctx.lineWidth = this.lineWidth;

  // render points
  ctx.beginPath();
  this.pathActions.forEach(function (pathAction) {
    pathAction.render(ctx);
  });
  var isTwoPoints = this.pathActions.length == 2 &&
    this.pathActions[1].method == 'line';
  if (!isTwoPoints && this.closed) {
    ctx.closePath();
  }
  if (this.stroke) {
    ctx.stroke();
  }
  if (this.fill) {
    ctx.fill();
  }
};

// return Array of self & all child shapes
Shape.prototype.getShapes = function () {
  var shapes = [this];
  this.children.forEach(function (child) {
    var childShapes = child.getShapes();
    shapes = shapes.concat(childShapes);
  });
  return shapes;
};

Shape.prototype.copy = function (options) {
  // copy options
  var shapeOptions = {};
  optionKeys.forEach(function (key) {
    shapeOptions[key] = this[key];
  }, this);
  // add set options
  setOptions(shapeOptions, options);
  var ShapeClass = this.constructor;
  return new ShapeClass(shapeOptions);
};

// -------------------------- Ellipse -------------------------- //

function Ellipse(options) {
  options = this.setPath(options);
  // always keep open
  // fixes overlap bug when lineWidth is greater than radius
  options.closed = false;
  this.create(options);
}

Ellipse.prototype = Object.create(Shape.prototype);
Ellipse.prototype.constructor = Ellipse;

Ellipse.prototype.setPath = function (options) {
  var w = options.width / 2;
  var h = options.height / 2;
  options.path = [{
      x: 0,
      y: -h
    },
    {
      arc: [ // top right
        {
          x: w,
          y: -h
        },
        {
          x: w,
          y: 0
        },
      ]
    },
    {
      arc: [ // bottom right
        {
          x: w,
          y: h
        },
        {
          x: 0,
          y: h
        },
      ]
    },
    {
      arc: [ // bottom left
        {
          x: -w,
          y: h
        },
        {
          x: -w,
          y: 0
        },
      ]
    },
    {
      arc: [ // bottom left
        {
          x: -w,
          y: -h
        },
        {
          x: 0,
          y: -h
        },
      ]
    },
  ];
  return options;
};

// -------------------------- Dragger -------------------------- //

// quick & dirty drag event stuff
// messes up if multiple pointers/touches

// event support, default to mouse events
var downEvent = 'mousedown';
var moveEvent = 'mousemove';
var upEvent = 'mouseup';
if (window.PointerEvent) {
  // PointerEvent, Chrome
  downEvent = 'pointerdown';
  moveEvent = 'pointermove';
  upEvent = 'pointerup';
} else if ('ontouchstart' in window) {
  // Touch Events, iOS Safari
  downEvent = 'touchstart';
  moveEvent = 'touchmove';
  upEvent = 'touchend';
}

function noop() {}

function Dragger(options) {
  this.startElement = options.startElement;
  this.onPointerDown = options.onPointerDown || noop;
  this.onPointerMove = options.onPointerMove || noop;
  this.onPointerUp = options.onPointerUp || noop;

  this.startElement.addEventListener(downEvent, this);
}

Dragger.prototype.handleEvent = function (event) {
  var method = this['on' + event.type];
  if (method) {
    method.call(this, event);
  }
};

Dragger.prototype.onmousedown =
  Dragger.prototype.onpointerdown = function (event) {
    this.pointerDown(event, event);
  };

Dragger.prototype.ontouchstart = function (event) {
  this.pointerDown(event, event.changedTouches[0]);
};

Dragger.prototype.pointerDown = function (event, pointer) {
  event.preventDefault();
  this.dragStartX = pointer.pageX;
  this.dragStartY = pointer.pageY;
  window.addEventListener(moveEvent, this);
  window.addEventListener(upEvent, this);
  this.onPointerDown(pointer);
};

Dragger.prototype.ontouchmove = function (event) {
  // HACK, moved touch may not be first
  this.pointerMove(event, event.changedTouches[0]);
};

Dragger.prototype.onmousemove =
  Dragger.prototype.onpointermove = function (event) {
    this.pointerMove(event, event);
  };

Dragger.prototype.pointerMove = function (event, pointer) {
  event.preventDefault();
  var moveX = pointer.pageX - this.dragStartX;
  var moveY = pointer.pageY - this.dragStartY;
  this.onPointerMove(pointer, moveX, moveY);
};

Dragger.prototype.onmouseup =
  Dragger.prototype.onpointerup =
  Dragger.prototype.ontouchend =
  Dragger.prototype.pointerUp = function (event) {
    window.removeEventListener(moveEvent, this);
    window.removeEventListener(upEvent, this);
    this.onPointerUp(event);
  };


// -------------------------- demo -------------------------- //

var canvas = document.querySelector('canvas');
// unibody canvas for compositing
var unibodyCanvas = document.createElement('canvas');
var bodyLinesCanvas = document.createElement('canvas');
var ctx = canvas.getContext('2d');
var unibodyCtx = unibodyCanvas.getContext('2d');
var bodyLinesCtx = bodyLinesCanvas.getContext('2d');
// document.body.appendChild( bodyLinesCanvas );
var w = 88;
var h = 88;
var minWindowSize = Math.min(window.innerWidth, window.innerHeight);
var zoom = Math.min(6, Math.floor(minWindowSize / w));
var pixelRatio = window.devicePixelRatio || 1;
zoom *= pixelRatio;
var canvasWidth = canvas.width = w * zoom;
var canvasHeight = canvas.height = h * zoom;
// set canvas screen size
if (pixelRatio > 1) {
  canvas.style.width = canvasWidth / pixelRatio + 'px';
  canvas.style.height = canvasHeight / pixelRatio + 'px';
}
unibodyCanvas.width = bodyLinesCanvas.width = canvasWidth;
unibodyCanvas.height = bodyLinesCanvas.height = canvasHeight;

var isRotating = true;

var jumpRotation = new Vector3({
  x: -10 / 360 * TAU,
  y: 18 / 360 * TAU,
  z: -31 / 360 * TAU,
});

// colors
var magenta = '#C25';
var orange = '#E62';
var gold = '#EA0';
var blue = '#19F';
var black = '#333';

var camera = new Shape({
  rendering: false
});

var outlineCamera = new Shape({
  rendering: false
});

// -- illustration shapes --- //
var positiveUnibody, rightLegCutInA, rightLegCutInB, bodyCutIn, backLegCutIn;


[false, true].forEach(function (isOutline) {
  var shapeCamera = isOutline ? outlineCamera : camera;
  var outlineWidth = isOutline ? 8 : 0;

  // unibody
  var unibody = new Shape({
    path: [
      // {},
      {
        x: -3,
        y: -8
      },
      {
        x: 3,
        y: -8
      },
      {
        x: 3,
        y: 6
      },
      {
        x: -3,
        y: 6
      },
    ],
    addTo: shapeCamera,
    // rendering: false,
    color: isOutline ? black : magenta,
    lineWidth: 28 + outlineWidth,
    fill: true,
  });

  if (!isOutline) {
    // set positiveUnibody
    positiveUnibody = unibody;
    // body cut-in
    // cut-in points
    var ciA = new Vector3({
      z: 0,
      y: -24
    });
    var ciB = new Vector3({
      z: -16,
      y: -8
    });
    var ciC = new Vector3({
      z: -16,
      y: 6
    });
    var ciD = new Vector3({
      z: 0,
      y: 22
    });
    // 45 degree points
    var topPoints = getQuarterArcPoints(ciA, ciB);
    var bottomPoints = getQuarterArcPoints(ciD, ciC);

    var cutInPath = [
      topPoints[0],
      {
        bezier: [topPoints[1], topPoints[2], ciB]
      },
      ciC,
      {
        bezier: [bottomPoints[2], bottomPoints[1], bottomPoints[0]]
      },
    ];

    bodyCutIn = new Shape({
      path: cutInPath,
      translate: {
        x: 3
      },
      addTo: unibody,
      color: black,
      closed: false,
      lineWidth: 4,
    });

  }

  // right ear
  var ear = new Ellipse({
    width: 4,
    height: 4,
    addTo: unibody,
    translate: {
      x: -14,
      y: -20,
      z: 2
    },
    color: isOutline ? black : magenta,
    lineWidth: 8 + outlineWidth,
  });
  // left ear
  ear.copy({
    translate: {
      x: 14,
      y: -20,
      z: 2
    },
  });


  // face container
  var face = new Shape({
    rendering: false,
    translate: {
      y: -3,
      z: -14
    },
    addTo: unibody,
  });

  // snout
  new Ellipse({
    width: 8,
    height: 4,
    addTo: face,
    translate: {
      y: 4,
      z: -1
    },
    color: isOutline ? black : 'white',
    lineWidth: 6 + outlineWidth,
    fill: true,
  });

  if (!isOutline) {
    // nose
    new Shape({
      path: [{
          x: -1.5,
          y: 0
        },
        {
          x: 1.5,
          y: 0
        },
        {
          x: 0,
          y: 0.5
        },
      ],
      addTo: face,
      translate: {
        y: 1.5,
        z: -4
      },
      color: black,
      lineWidth: 3,
      fill: true,
    });

    // right eye
    var eye = new Shape({
      path: [{
          x: -4,
          y: 0
        },
        {
          arc: [{
              x: -4,
              y: -4
            },
            {
              x: 0,
              y: -4
            }
          ]
        },
        {
          arc: [{
              x: 4,
              y: -4
            },
            {
              x: 4,
              y: 0
            }
          ]
        },
        {
          arc: [{
              x: 3,
              y: -1.5
            },
            {
              x: 0,
              y: -1.5
            }
          ]
        },
        {
          arc: [{
              x: -3,
              y: -1.5
            },
            {
              x: -4,
              y: 0
            }
          ]
        },
      ],
      addTo: face,
      translate: {
        y: -3.25,
        x: -7.5,
        z: 0
      },
      scale: {
        x: 0.6,
        y: 0.5
      },
      color: black,
      lineWidth: 2,
      closed: false,
      fill: true,
    });
    // left eye
    eye.copy({
      translate: {
        y: -3.25,
        x: 7.5,
        z: 0
      },
    });

  }


  // right arm
  new Shape({
    path: [{
        x: -1
      },
      {
        x: -8
      },
    ],
    addTo: unibody,
    translate: {
      x: -17,
      y: 4
    },
    rotate: {
      y: -0.25
    },
    color: isOutline ? black : gold,
    lineWidth: 12 + outlineWidth,
  });
  // left arm
  new Shape({
    path: [{
        x: 0
      },
      {
        bezier: [{
            x: 0,
            y: 0
          },
          {
            x: 5,
            y: -3
          },
          {
            x: 8,
            y: -11
          },
        ]
      }
    ],
    addTo: unibody,
    translate: {
      x: 18,
      y: 4
    },
    rotate: {
      x: 0.4
    },
    color: isOutline ? black : gold,
    lineWidth: 12 + outlineWidth,
    closed: false,
  });

  // right leg
  var rightLeg = new Shape({
    path: [{
        y: 4
      },
      {
        y: 15
      },
    ],
    addTo: unibody,
    translate: {
      x: -10,
      y: 12,
      z: 1
    },
    rotate: {
      z: 49 / 360 * TAU,
      x: 0.3
    },
    color: isOutline ? black : blue,
    lineWidth: 12 + outlineWidth,
  });

  // right leg cut-in
  if (!isOutline) {
    rightLegCutInA = new Shape({
      path: [{
          z: -8,
          y: 4
        },
        {
          z: -8,
          y: 15
        },
        // {
        //   arc: [
        //     { z: -8, y: 23 },
        //     { z: 0, y: 23 },
        //   ]
        // }
      ],
      addTo: rightLeg,
      // rotate: { y: 1 },
      closed: false,
      color: black,
      lineWidth: 4,
    });
    rightLegCutInB = rightLegCutInA.copy({
      scale: {
        z: -1
      },
    });
  }


  // left leg
  var leftThigh = new Shape({
    path: [{
        y: 2
      },
      {
        y: 13
      },
    ],
    addTo: unibody,
    translate: {
      x: 9,
      y: 12,
      z: 1
    },
    rotate: {
      z: 49 / 360 * TAU,
      x: 0.2
    },
    color: isOutline ? black : blue,
    lineWidth: 12 + outlineWidth,
  });
  // left shin
  var leftShin = new Shape({
    path: [{
        y: 0
      },
      {
        y: 12
      },
    ],
    addTo: leftThigh,
    translate: leftThigh.path[1],
    rotate: {
      z: 0.2,
      x: 0.8
    },
    color: isOutline ? black : blue,
    lineWidth: 12 + outlineWidth,
  });

  if (!isOutline) {
    backLegCutIn = new Shape({
      path: [{
          z: -8,
          y: -14
        },
        {
          z: -8,
          y: -8
        },
        // { arc: [
        //   { z: -8, y: 0 },
        //   { z: 0, y: 0 },
        // ]},
      ],
      addTo: leftShin,
      translate: {
        y: 20
      },
      closed: false,
      // rotate: { y: 1 },
      color: black,
      lineWidth: 4,
    });
  }

});

var bodyFillWidth = 34;
var bodyFillDepth = 28;
var bodyLineWidth = 10.5;

var blXA = (bodyFillWidth - bodyLineWidth) / 2 + 2.75;
var blXB = (bodyFillWidth - bodyFillDepth) / 2 + 2.75;
var blZ = (bodyFillDepth - bodyLineWidth) / 2 + 2.75;

// body lines
var bodyLines = [magenta, orange, gold, blue].map(function (color, i) {
  return new Shape({
    path: [{
        x: -blXA,
        z: 0
      },
      {
        arc: [{
            x: -blXA,
            z: -blZ
          },
          {
            x: -blXB,
            z: -blZ
          }
        ]
      },
      {
        x: blXB,
        z: -blZ
      },
      {
        arc: [{
            x: blXA,
            z: -blZ
          },
          {
            x: blXA,
            z: 0
          }
        ]
      },
      {
        arc: [{
            x: blXA,
            z: blZ
          },
          {
            x: blXB,
            z: blZ
          },
        ]
      },
      {
        x: -blXB,
        z: blZ
      },
      {
        arc: [{
            x: -blXA,
            z: blZ
          },
          {
            x: -blXA,
            z: 0
          },
        ]
      },
    ],
    addTo: positiveUnibody,
    translate: {
      y: -16.75 + 10.5 * i
    },
    color: color,
    lineWidth: 11,
    fill: true,
    closed: false,
  });
});

// unibody composited rendering
var unibodyRender = positiveUnibody.render;
positiveUnibody.render = function (ctx) {
  // render unibody on its own canvas, so we can use lineWidth
  unibodyRender.call(positiveUnibody, unibodyCtx);
  // render body lines separately, on its own canvas
  bodyLinesCtx.globalCompositeOperation = 'source-over';
  bodyLines.forEach(function (bodyLine) {
    bodyLine.render(bodyLinesCtx);
  });
  // composite bodyLines in unibody
  bodyLinesCtx.restore();
  bodyLinesCtx.globalCompositeOperation = 'destination-in';
  bodyLinesCtx.drawImage(unibodyCanvas, 0, 0);
  zoomContext(bodyLinesCtx);
  // draw unibody composite on to canvas
  ctx.restore();
  ctx.drawImage(bodyLinesCanvas, 0, 0);
  zoomContext(ctx);
};

var outlineShapes = outlineCamera.getShapes();
var positiveShapes = camera.getShapes();
// filter out bodyLines
positiveShapes = positiveShapes.filter(function (shape) {
  return !bodyLines.includes(shape);
});

// -- animate --- //

var t = 0;

function animate() {
  update();
  render();
  requestAnimationFrame(animate);
}

animate();

// -- update -- //

// i, 0->1
function easeOut(i) {
  var isFirstHalf = i < 0.5;
  var i1 = isFirstHalf ? i : 1 - i;
  i1 = i1 / 0.5;
  // make easing steeper with more multiples
  var i2 = i1 * i1 * i1;
  i2 = i2 / 2;
  return isFirstHalf ? i2 : i2 * -1 + 1;
}

function update() {
  if (isRotating) {
    t += TAU / 180;
    var easeT = easeOut((t / TAU) % 1);
    camera.rotate.y = easeT * TAU * -2 + jumpRotation.y;
  }

  camera.update();
  outlineCamera.update();
  // normalize angle y
  var cameraRY = camera.rotate.y = modulo(camera.rotate.y, TAU);
  // update cut-in rotates
  rightLegCutInA.rotate.y = 1.2 - cameraRY;
  rightLegCutInB.rotate.y = 1.2 - cameraRY;
  backLegCutIn.rotate.y = 1.4 - cameraRY;
  var isCameraYFront = cameraRY < TAU / 4 || cameraRY > TAU * 3 / 4;
  var isCameraYRight = cameraRY < TAU / 2;
  bodyCutIn.rotate.y = isCameraYFront == isCameraYRight ? 1.5 : -1.5;
  bodyCutIn.rotate.y -= cameraRY;
  bodyCutIn.translate.x = isCameraYRight ? 3 : -3;

  // render shapes
  positiveShapes.forEach(updateEachSortValue);
  bodyLines.forEach(updateEachSortValue);
  // perspective sort
  positiveShapes.sort(sortBySortValue);
  bodyLines.sort(sortBySortValue);
}

function updateEachSortValue(shape) {
  shape.updateSortValue();
}

function sortBySortValue(a, b) {
  return b.sortValue - a.sortValue;
}

// -- render -- //
ctx.lineCap = 'round';
ctx.lineJoin = 'round';
unibodyCtx.lineCap = bodyLinesCtx.lineCap = 'round';
unibodyCtx.lineJoin = bodyLinesCtx.lineJoin = 'round';
setJumpRotate();

function render() {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  unibodyCtx.clearRect(0, 0, canvasWidth, canvasHeight);
  bodyLinesCtx.clearRect(0, 0, canvasWidth, canvasHeight);
  zoomContext(ctx);
  zoomContext(unibodyCtx);
  zoomContext(bodyLinesCtx);

  outlineShapes.forEach(eachShapeRender);
  positiveShapes.forEach(eachShapeRender);

  ctx.restore();
  unibodyCtx.restore();
  bodyLinesCtx.restore();
}

function eachShapeRender(shape) {
  shape.render(ctx);
}

function zoomContext(context) {
  context.save();
  context.scale(zoom, zoom);
  /* nudge up to center (lazy) */
  context.translate(w / 2, h / 2 - 4);
}


// ----- inputs ----- //

// click drag to rotate
var dragStartAngleX, dragStartAngleY;

new Dragger({
  startElement: document,
  onPointerDown: function () {
    isRotating = false;
    dragStartAngleX = camera.rotate.x;
    dragStartAngleY = camera.rotate.y;
  },
  onPointerMove: function (pointer, moveX, moveY) {
    var angleXMove = moveY / canvasWidth * TAU;
    var angleYMove = moveX / canvasWidth * TAU;
    camera.rotate.x = dragStartAngleX + angleXMove;
    camera.rotate.y = dragStartAngleY + angleYMove;
  },
});

function setJumpRotate() {
  camera.rotate.set(jumpRotation);
  syncCameras();
}

function syncCameras() {
  camera.rotate.y = ((camera.rotate.y % TAU) + TAU) % TAU;
  outlineCamera.rotate = camera.rotate;
}


function getQuarterArcPoints(a, b) {
  var start = new Vector3({
    z: lerp(a.z, b.z, 5 / 7),
    y: lerp(a.y, b.y, 2 / 7),
  });
  // control points
  var cp0 = new Vector3({
    z: lerp(a.z, b.z, 24 / 28),
    y: lerp(a.y, b.y, 12 / 28),
  });
  var cp1 = new Vector3({
    z: b.z,
    y: lerp(a.y, b.y, 5 / 7),
  });

  return [start, cp0, cp1];
}


/* Demo purposes only */
$(".hover").mouseleave(
  function () {
    $(this).removeClass("hover");
  }
);