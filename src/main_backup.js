function drawBackground(ctx) {
  let c = gradient([255, 50, 10], [100, 255, 255], 1000);
  
  for (var i = 0; i < c.length; i++) {
    ctx.fillStyle = `rgb(${c[i][0]}, ${c[i][1]}, ${c[i][2]})`;
    ctx.fillRect(i * (1000/c.length), 0, 1000 / c.length, 500)
  }
}

function drawSky(ctx) {
  let width = document.body.clientWidth;
  let height = document.body.clientHeight;
  let c = gradient([130, 130, 255], [255, 255, 255], height);
  
  for (var i = 0; i < c.length; i++) {
    ctx.fillStyle = `rgb(${c[i].r}, ${c[i].g}, ${c[i].b})`;
    ctx.fillRect(0, i * (height/c.length), width, height / c.length)
  }
}

// Returns a gradient between colors 1 and 2 split into n intermediate colors
// Note that n includes the beginning and ending colors
function gradient([r1, g1, b1], [r2, g2, b2], n) {
  colors = [];
  rStep = (r2 - r1) / (n - 1);
  gStep = (g2 - g1) / (n - 1);
  bStep = (b2 - b1) / (n - 1);

  // Math.floor is necessary b.c. colors must be ints
  for (var i = 0; i < n; i++) {
    rNew = Math.floor(r1 + rStep * i);
    gNew = Math.floor(g1 + gStep * i);
    bNew = Math.floor(b1 + bStep * i);

    colors.push({r: rNew, g: gNew, b: bNew});
  }

  return colors;
}

function randRange(min, max) {
    return Math.random() * (max - min) + min;
}

class FallingLeaf {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.angle = 0;
    this.angleIncrement = randRange(-1.5, 1.5)

    this.speed = randRange(1, 2);
    this.size = randRange(10, 20);
    
    // this.color = {
    //   r: 255,
    //   g: Math.floor(randRange(0, 150)),
    //   b: 0,
    //   a: randRange(0.5, 1)
    // };

    // 255, 168, 188
    this.color = {
      r: 255,
      g: Math.floor(randRange(168 - 30, 190)),
      b: Math.floor(randRange(188 - 30, 190)),
      a: randRange(0.75, 1)
    };

    // Choose an angle between 1/5 degrees and 1 degrees to curve the leaf every update.
    this.curve = 0;
    this.curveIncrement = randRange(Math.PI/180/5, Math.PI/180);

    this.pop();
    FallingLeaf.leaves.push(this);
  }

  pop() {
    let desiredSize = this.size;
    this.size = 0;

    let _this = this;
    let x = 0;
    requestAnimationFrame(function loop () {
      _this.size = Math.sin(2 * x) * desiredSize;
      x += Math.PI/180;

      if (_this.size <= desiredSize - 1) { // -1 b.c. it might not make it *quite* there
        requestAnimationFrame(loop);
      }
    });
  }

  update() {
    if (this.color.a >= 0) {
      this.x += this.speed * Math.sin(this.curve);
      this.y += this.speed;

      this.curve += this.curveIncrement;
      this.color.a -= 0.0015;
      this.angle += this.angleIncrement;
    }
    else {
      const index = FallingLeaf.leaves.indexOf(this);
      FallingLeaf.leaves.splice(index, 1);
    }
  }

  draw(ctx) {
    ctx.fillStyle = this.colorString;
    ctx.translate(this.x + this.size/2, this.y + this.size/2);
    ctx.rotate(this.angle * Math.PI/180);
    ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
    
    ctx.rotate(-(this.angle * Math.PI/180));
    ctx.translate(-(this.x + this.size/2), -(this.y + this.size/2));
  }

  get colorString() {
    return `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.color.a})`;
  }
}

// Ugly hack to get a static variable
FallingLeaf.leaves = [];


class Branch {
  constructor({x1, y1, angle, length, color = {r: 0, g: 0, b: 0}}) {
    this.x1 = x1;
    this.y1 = y1;
    this.angle = angle;
    this.length = length;
    this.color = color;

    this.children = [];
    this.twitching = false;
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.moveTo(this.x1, this.y1);
    ctx.lineTo(this.x2, this.y2)
    ctx.lineWidth = 4 * document.body.clientWidth / 1000;
    ctx.strokeStyle = this.colorString;
    ctx.stroke();

    for (var i = 0; i < this.children.length; i++) {
        // if (this.children[i] != null) {
          this.children[i].draw(ctx);
        // }
      }  
  }

  changeAngleBetween(amount) {
    let child1 = this.children[0];
    let child2 = this.children[1];
    
    if (child1 != null) {
      child1.x1 = this.x2;
      child1.y1 = this.y2;
      child1.angle -= amount;
    }

    if (child1 != null) {
      child2.x1 = this.x2;
      child2.y1 = this.y2;
      child2.angle +=  amount;
    }

    this.children.forEach(function(child) {
      child.changeAngle(amount);
    });
    // for (var i = 0; i < this.children.length; i++) {
    //   this.changeAngle(amount, this.children[i]);
    // }
  }

  changeAngle(amount) {
    this.angle += amount;

    for (var i = 0; i < this.children.length; i++) {
      this.children[i].x1 = this.x2;
      this.children[i].y1 = this.y2;
      this.children[i].angle += amount;

      this.children[i].changeAngle(amount);
    }
  }

  // Twitch branch in the wind
  twitch(amount = 1, speed = 1) {
    if (!this.twitching) {
      this.twitching = true;
      amount = amount * Math.PI/180
      let desiredAngle = this.angle + amount;

      let _this = this;
      let x = 0;

      let interval = setInterval(function() {
        if (x * speed <= Math.PI*2) {
          _this.changeAngle(amount * Math.sin(speed * x));
          x += Math.PI/180;
        }
        else {
          clearInterval(interval);
          _this.twitching = false;
        }
      }, 17);

      for (var i = 0; i < this.children.length; i++) {
        this.children[i].twitch(amount);
      }
    }
  }

  get x2() {
    return this.x1 - this.length * Math.cos((Math.PI/180)*this.angle);
  }

  get y2() {
    return this.y1 - this.length * Math.sin((Math.PI/180)*this.angle);
  }

  get colorString() {
    return `rgb(${this.color.r}, ${this.color.g}, ${this.color.b})`;
  }
}

class Tree {
  constructor(rootX, rootY, rootHeight) {
    this.root = new Branch({ x1: rootX, y1: rootY, angle: 90, length: rootHeight});
    this.levels = 1;

    this.grad = gradient([160, 80, 40], [104, 168, 4], 8);
    this.root.color = this.grad[0];

    for (var i = 0; i < 7; i++) {
      this.addLevel();
    }

    this.upperBranches = this.getUpperBranches();
  }

  addLevel() {
    let leaves = this.getEdges();

    leaves.forEach((l) => {
      let angleChange = 30;
      let levels = this.levels;

      let branch1 = new Branch({
        x1: l.x2,
        y1: l.y2,
        angle: l.angle - angleChange,
        length: l.length - l.length*.2,
        color: this.grad[levels]
      });

      let branch2 = new Branch({
        x1: l.x2,
        y1: l.y2,
        angle: l.angle + angleChange,
        length: l.length - l.length*.2,
        color: this.grad[levels]
      });

      l.children.push(branch1, branch2);
    });

    this.levels++;
  }

  // Returns branches which have no children
  getEdges() {
    let leaves = [];

    let find = (branch) => {
      if (branch.children.length == 0) {
        leaves.push(branch);
      }

      branch.children.forEach((child) => {
          find(child);
      });
    }

    find(this.root);


    if (leaves.length > 0) {
      return leaves;
    }
    else {
      return [this.root];
    }
  }

  // Get all branches that are n
  // branches away from the root
  getLevel(n) {
    let leaves = [];

    let find = (branch, level) => {
      if (level == n) {
        leaves.push(branch);
        return;
      }

      branch.children.forEach((b) => {
        find(b, level + 1);
      });
    }

    find(this.root, 1);
    return leaves;
  }

  // Returns all branches
  getUpperBranches() {
    let branches = [];
    let levels = [];

    for (var i = 3; i <= this.levels; i++) {
      levels.push(this.getLevel(i));
    }

    levels.forEach(function(lvl) {
      branches = branches.concat(lvl);
    });

    return branches;
  }

  // Changes angle of all branches
  changeAngle(amount) {
    this.root.changeAngle(amount);
  }
  
  draw(ctx) {
    this.root.draw(ctx); 
  }
}

$(document).ready(() => {
  let canvas = document.getElementById("main-canvas");
  window.c = canvas.getContext('2d');
  canvas.width = document.body.clientWidth;
  canvas.height = document.body.clientHeight;

  window.tree = new Tree(canvas.width/2, canvas.height, canvas.height/5);

  requestAnimationFrame(update);
});

function update() {
  c.clearRect(0, 0, document.body.clientWidth, document.body.clientHeight);

  drawSky(c);
  tree.draw(c);

  let spawningBranches = tree.getLevel(8).concat(tree.getLevel(7)).concat(tree.getLevel(6));
  // let spawningBranches = tree.getEdges();

  spawningBranches.forEach(function(b) {
    if (Math.random() < 0.002) {
      new FallingLeaf(b.x2, b.y2);
    }    
  });

  tree.upperBranches.forEach(function(b) {
    if (Math.random() < 0.002) {
      let amount = randRange(2, 4);
      let speed = randRange(2, 3);

      b.twitch(amount, speed);
    }    
  });

  FallingLeaf.leaves.forEach(function(l) {
    l.draw(c);
    l.update();
  });

  requestAnimationFrame(update);
}