class RscInputKey {
    id: string
    is_held: boolean = false
    is_pressed: boolean = false
    is_released: boolean = false
    constructor(id: string) {
        this.id = id
    }
    up() {
        this.is_held = false
        this.is_released = true
    }
    down() {
        this.is_held = true
        this.is_pressed = true
    }
    reset() {
        this.is_pressed = false
        this.is_released = false
    }
}

interface RscInputCode {
    'ArrowUp': RscInputKey
    'ArrowDown': RscInputKey
    'ArrowLeft': RscInputKey
    'ArrowRight': RscInputKey
    'KeyA': RscInputKey
    'KeyD': RscInputKey
    'KeyS': RscInputKey
    'KeyW': RscInputKey
    'Space': RscInputKey
}

const RSC_INPUT_CODES: (keyof RscInputCode)[] = [
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'KeyA',
    'KeyD',
    'KeyS',
    'KeyW',
    'Space',
]

class RscInput {
    keys: RscInputCode = {} as any
    constructor() {
        for (const code of RSC_INPUT_CODES) {
            this.keys[code] = new RscInputKey(code)
        }
        window.addEventListener('keyup', ev => {
            for (const code of RSC_INPUT_CODES) {
                if (this.keys[code].id === ev.code) this.keys[code].up()
            }
        })
        window.addEventListener('keydown', ev => {
            for (const code of RSC_INPUT_CODES) {
                if (this.keys[code].id === ev.code && !this.keys[code].is_held) this.keys[code].down()
            }
        })
    }
    reset() {
        for (const code of RSC_INPUT_CODES) {
            this.keys[code].reset()
        }
    }
    is_held(code: keyof RscInputCode) {
        return this.keys[code].is_held
    }
    is_pressed(code: keyof RscInputCode) {
        return this.keys[code].is_pressed
    }
    is_released(code: keyof RscInputCode) {
        return this.keys[code].is_released
    }
}

class RscTime {
    time: number = 0
    last_time: number = 0
    delta_time: number = 0
    constructor() { }
    update(t: number) {
        this.time = t
        this.delta_time = this.time - this.last_time
        this.last_time = this.time
    }
}

class RscStage {
    canvas: HTMLCanvasElement
    w: number = 0
    h: number = 0
    mid = {
        w: 0,
        h: 0,
    }
    constructor(w: number = 0, h: number = 0) {
        this.canvas = document.createElement('canvas')
        if (w < 1 || h < 1) {
            this.init(window.innerWidth, window.innerHeight)
            window.addEventListener('resize', () => {
                this.init(window.innerWidth, window.innerHeight)
            })
        }
        else {
            this.init(w, h)
        }
    }
    init(w: number, h: number) {
        this.w = w
        this.h = h
        this.mid.w = this.w / 2
        this.mid.h = this.h / 2
        this.canvas.width = this.w
        this.canvas.height = this.h
        this.canvas.style.width = `${this.canvas.width}px`
        this.canvas.style.height = `${this.canvas.height}px`
    }
}

class RscScene {
    name: string
    constructor(name: string) {
        this.name = name
    }
    update() { }
    render() { }
}

class RscSceneManager {
    last_scene: RscScene
    current_scene: RscScene
    constructor(starting_scene: RscScene) {
        this.last_scene = this.current_scene = starting_scene
    }
    create(name: string) {
        return new RscScene(name)
    }
    change(new_scene: RscScene) {
        this.last_scene = this.current_scene
        this.current_scene = new_scene
    }
    update() {
        this.current_scene.update()
    }
    render() {
        this.current_scene.render()
    }
}

class RscDraw {
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    TWO_PI: number = 2 * Math.PI
    constructor(canvas: HTMLCanvasElement = document.createElement('canvas')) {
        this.canvas = canvas
        this.ctx = this.canvas.getContext('2d')!
    }
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    }
    set_color(fill: string | CanvasGradient | CanvasPattern, stroke: string | CanvasGradient | CanvasPattern = '') {
        this.ctx.fillStyle = fill
        this.ctx.strokeStyle = stroke || fill
    }
    set_fill(fill: string | CanvasGradient | CanvasPattern) {
        this.ctx.fillStyle = fill
    }
    set_stroke(stroke: string | CanvasGradient | CanvasPattern) {
        this.ctx.strokeStyle = stroke
    }
    set_halign(halign: CanvasTextAlign) {
        this.ctx.textAlign = halign
    }
    set_valign(valign: CanvasTextBaseline) {
        this.ctx.textBaseline = valign
    }
    set_hvalign(halign: CanvasTextAlign, valign: CanvasTextBaseline) {
        this.ctx.textAlign = halign
        this.ctx.textBaseline = valign
    }
    set_font(size: number) {
        this.ctx.font = ''
    }
    text(x: number, y: number, text: string) {
        this.ctx.fillText(text, x, y)
    }
    draw(is_stroke: boolean = false) {
        is_stroke ? this.ctx.stroke() : this.ctx.fill()
    }
    circle(x: number, y: number, r: number, is_stroke: boolean = false) {
        this.ctx.beginPath()
        this.ctx.arc(x, y, r, 0, this.TWO_PI)
        this.draw(is_stroke)
    }
    rect(x: number, y: number, w: number, h: number, is_stroke: boolean = false) {
        this.ctx.beginPath()
        this.ctx.rect(x, y, w, h)
        this.draw(is_stroke)
    }
}

class RscRunner {
    engine: RscEngine
    constructor(engine: RscEngine) {
        this.engine = engine
    }
    run() {
        const _run = (t: number) => {
            this.tick(t)
            window.requestAnimationFrame(_run)
        }
        window.requestAnimationFrame(_run)
    }
    tick(t: number) {
        this.engine.update(t)
    }
}

class RscEngine {
    input: RscInput
    time: RscTime
    stage: RscStage
    scene: RscSceneManager
    draw: RscDraw
    runner: RscRunner
    constructor(w: number = 0, h: number = 0, canvas_parent: HTMLElement = document.body) {
        this.input = new RscInput()
        this.time = new RscTime()
        this.stage = new RscStage(w, h)
        this.scene = new RscSceneManager(new RscScene(''))
        this.draw = new RscDraw(this.stage.canvas)
        this.runner = new RscRunner(this)

        canvas_parent.appendChild(this.stage.canvas)
    }
    start(starting_scene: RscScene) {
        this.scene.change(starting_scene)
        this.runner.run()
    }
    update(t: number) {
        this.time.update(t)
        this.scene.update()
        this.draw.clear()
        this.scene.render()
        this.input.reset()
    }
}
