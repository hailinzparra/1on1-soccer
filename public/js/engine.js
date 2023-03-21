"use strict";
class RscInputKey {
    constructor(id) {
        this.is_held = false;
        this.is_pressed = false;
        this.is_released = false;
        this.id = id;
    }
    up() {
        this.is_held = false;
        this.is_released = true;
    }
    down() {
        this.is_held = true;
        this.is_pressed = true;
    }
    reset() {
        this.is_pressed = false;
        this.is_released = false;
    }
}
const RSC_INPUT_CODES = [
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'KeyA',
    'KeyD',
    'KeyS',
    'KeyW',
    'Space',
];
class RscInput {
    constructor() {
        this.keys = {};
        for (const code of RSC_INPUT_CODES) {
            this.keys[code] = new RscInputKey(code);
        }
        window.addEventListener('keyup', ev => {
            for (const code of RSC_INPUT_CODES) {
                if (this.keys[code].id === ev.code)
                    this.keys[code].up();
            }
        });
        window.addEventListener('keydown', ev => {
            for (const code of RSC_INPUT_CODES) {
                if (this.keys[code].id === ev.code && !this.keys[code].is_held)
                    this.keys[code].down();
            }
        });
    }
    reset() {
        for (const code of RSC_INPUT_CODES) {
            this.keys[code].reset();
        }
    }
    is_held(code) {
        return this.keys[code].is_held;
    }
    is_pressed(code) {
        return this.keys[code].is_pressed;
    }
    is_released(code) {
        return this.keys[code].is_released;
    }
}
class RscTime {
    constructor() {
        this.time = 0;
        this.last_time = 0;
        this.delta_time = 0;
    }
    update(t) {
        this.time = t;
        this.delta_time = this.time - this.last_time;
        this.last_time = this.time;
    }
}
class RscStage {
    constructor(w = 0, h = 0) {
        this.w = 0;
        this.h = 0;
        this.mid = {
            w: 0,
            h: 0,
        };
        this.canvas = document.createElement('canvas');
        if (w < 1 || h < 1) {
            this.init(window.innerWidth, window.innerHeight);
            window.addEventListener('resize', () => {
                this.init(window.innerWidth, window.innerHeight);
            });
        }
        else {
            this.init(w, h);
        }
    }
    init(w, h) {
        this.w = w;
        this.h = h;
        this.mid.w = this.w / 2;
        this.mid.h = this.h / 2;
        this.canvas.width = this.w;
        this.canvas.height = this.h;
        this.canvas.style.width = `${this.canvas.width}px`;
        this.canvas.style.height = `${this.canvas.height}px`;
    }
}
class RscScene {
    constructor(name) {
        this.name = name;
    }
    update() { }
    render() { }
}
class RscSceneManager {
    constructor(starting_scene) {
        this.last_scene = this.current_scene = starting_scene;
    }
    create(name) {
        return new RscScene(name);
    }
    change(new_scene) {
        this.last_scene = this.current_scene;
        this.current_scene = new_scene;
    }
    update() {
        this.current_scene.update();
    }
    render() {
        this.current_scene.render();
    }
}
class RscDraw {
    constructor(canvas = document.createElement('canvas')) {
        this.TWO_PI = 2 * Math.PI;
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
    }
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    set_color(fill, stroke = '') {
        this.ctx.fillStyle = fill;
        this.ctx.strokeStyle = stroke || fill;
    }
    set_fill(fill) {
        this.ctx.fillStyle = fill;
    }
    set_stroke(stroke) {
        this.ctx.strokeStyle = stroke;
    }
    set_halign(halign) {
        this.ctx.textAlign = halign;
    }
    set_valign(valign) {
        this.ctx.textBaseline = valign;
    }
    set_hvalign(halign, valign) {
        this.ctx.textAlign = halign;
        this.ctx.textBaseline = valign;
    }
    set_font(size) {
        this.ctx.font = '';
    }
    text(x, y, text) {
        this.ctx.fillText(text, x, y);
    }
    draw(is_stroke = false) {
        is_stroke ? this.ctx.stroke() : this.ctx.fill();
    }
    circle(x, y, r, is_stroke = false) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, r, 0, this.TWO_PI);
        this.draw(is_stroke);
    }
    rect(x, y, w, h, is_stroke = false) {
        this.ctx.beginPath();
        this.ctx.rect(x, y, w, h);
        this.draw(is_stroke);
    }
}
class RscRunner {
    constructor(engine) {
        this.engine = engine;
    }
    run() {
        const _run = (t) => {
            this.tick(t);
            window.requestAnimationFrame(_run);
        };
        window.requestAnimationFrame(_run);
    }
    tick(t) {
        this.engine.update(t);
    }
}
class RscEngine {
    constructor(w = 0, h = 0, canvas_parent = document.body) {
        this.input = new RscInput();
        this.time = new RscTime();
        this.stage = new RscStage(w, h);
        this.scene = new RscSceneManager(new RscScene(''));
        this.draw = new RscDraw(this.stage.canvas);
        this.runner = new RscRunner(this);
        canvas_parent.appendChild(this.stage.canvas);
    }
    start(starting_scene) {
        this.scene.change(starting_scene);
        this.runner.run();
    }
    update(t) {
        this.time.update(t);
        this.scene.update();
        this.draw.clear();
        this.scene.render();
        this.input.reset();
    }
}
