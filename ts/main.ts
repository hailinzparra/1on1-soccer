const engine = new RscEngine(1280, 540)
const { input, time, stage, scene, draw } = engine

const GRAVITY = 0.2
const ball_image = new Image()
ball_image.src = 'img/ball.png'
const player_image = new Image()
player_image.src = 'img/player.png'

class BoundRect {
    x: number
    y: number
    w: number
    h: number
    left: number
    right: number
    top: number
    bottom: number
    constructor(x: number, y: number, w: number, h: number) {
        this.x = x
        this.y = y
        this.w = w
        this.h = h
        this.left = this.x
        this.right = this.x + this.w
        this.top = this.y
        this.bottom = this.y + this.h
    }
    update_bound() {
        this.left = this.x
        this.right = this.x + this.w
        this.top = this.y
        this.bottom = this.y + this.h
    }
    update_pos(x: number, y: number) {
        this.x = x
        this.y = y
        this.update_bound()
    }
    intersect(other: BoundRect) {
        return this.left < other.right && this.right > other.left && this.top < other.bottom && this.bottom > other.top
    }
}

class Ball {
    x: number = 0
    y: number = 0
    r: number = 0
    vx: number = 0
    vy: number = 0
    bounce_fric: number = 0.97
    ground_fric: number = 0.92
    color: string = 'red'
    gravity: number = GRAVITY
    bound: BoundRect
    is_grounded: boolean = false
    constructor(x: number, y: number, r: number) {
        this.x = x
        this.y = y
        this.r = r
        this.bound = new BoundRect(this.x - this.r, this.y - this.r, this.r * 2, this.r * 2)
    }
    resolve_collision() {
        if (this.x > stage.w - this.r) {
            this.x = stage.w - this.r
            this.vx = -this.vx * this.bounce_fric
        }
        else if (this.x < this.r) {
            this.x = this.r
            this.vx = -this.vx * this.bounce_fric
        }
        if (this.y > stage.h - this.r) {
            this.y = stage.h - this.r
            this.vy = -this.vy * this.bounce_fric
        }
        else if (this.y < this.r) {
            this.y = this.r
            this.vy = -this.vy * this.bounce_fric
        }
    }
    update_after_move() {
        this.resolve_collision()
        this.bound.update_pos(this.x - this.r, this.y - this.r)
    }
    update() {
        if (!this.is_grounded) {
            this.vy += this.gravity
            if (this.y >= stage.h - this.r) {
                this.is_grounded = true
            }
        }
        if (this.is_grounded) {
            this.vx *= this.ground_fric
            if (this.y < stage.h - this.r) {
                this.is_grounded = false
            }
        }
        this.x += this.vx
        this.y += this.vy
        this.update_after_move()
    }
    render() {
        draw.ctx.drawImage(ball_image, this.x - this.r, this.y - this.r, this.r * 2, this.r * 2)
        // draw.ctx.globalAlpha = 0.5
        // draw.set_color(this.is_grounded ? 'green' : this.color)
        // draw.circle(this.x, this.y, this.r)
        // draw.ctx.globalAlpha = 1
    }
}

class Player {
    x: number = 0
    y: number = 0
    bound: BoundRect
    left_key: keyof RscInputCode
    right_key: keyof RscInputCode
    jump_key: keyof RscInputCode

    grav: number = GRAVITY
    fric: number = 0.95
    move_acc: number = 0.4
    move_maxspd: number = 4
    vx: number = 0
    vy: number = 0
    jump_spd: number = 10
    is_grounded: boolean = false
    constructor(
        x: number,
        y: number,
        left_key: keyof RscInputCode,
        right_key: keyof RscInputCode,
        jump_key: keyof RscInputCode,
        bound: BoundRect
    ) {
        this.x = x
        this.y = y
        this.left_key = left_key
        this.right_key = right_key
        this.jump_key = jump_key
        this.bound = bound
    }
    resolve_collision() {
        if (this.y > stage.h) {
            this.y = stage.h
            this.vy = 0
        }
    }
    ball_collision_check() {
        if (this.bound.intersect(ball.bound)) {
            const xdif = this.x - ball.x
            const ydif = this.y - this.bound.h / 2 - ball.y
            if (Math.abs(ydif) < this.bound.h / 4) {
                if (xdif < 0) {
                    ball.x = this.bound.right + ball.r
                }
                else if (xdif >= 0) {
                    ball.x = this.bound.left - ball.r
                }
            }
            ball.vx += (ball.x - this.x) * 0.05
            ball.vy += (ball.y - this.y) * 0.01
            ball.update_after_move()
        }
    }
    update() {
        if (input.is_held(this.left_key)) {
            this.vx -= this.move_acc
            if (this.vx < -this.move_maxspd) {
                this.vx = -this.move_maxspd
            }
        }
        if (input.is_held(this.right_key)) {
            this.vx += this.move_acc
            if (this.vx > this.move_maxspd) {
                this.vx = this.move_maxspd
            }
        }
        if (!this.is_grounded) {
            this.vy += this.grav
            if (this.y >= stage.h) {
                this.is_grounded = true
            }
        }
        if (input.is_pressed(this.jump_key)) {
            if (this.is_grounded) {
                this.vy -= this.jump_spd
                this.is_grounded = false
            }
        }

        this.x += this.vx
        this.y += this.vy
        this.vx *= this.fric
        this.resolve_collision()
        this.bound.update_pos(this.x - this.bound.w / 2, this.y - this.bound.h)

        this.ball_collision_check()
    }
    render() {
        const sw = 40
        const sh = 50
        const dw = 64
        const dh = 100
        const t = Math.round(time.time / 100) % 5
        draw.ctx.drawImage(player_image, sw * t, sh, sw, sh, this.x - dw / 2, this.y - dh, dw, dh)
        // draw.ctx.globalAlpha = 0.5
        // draw.set_color(this.is_grounded ? 'blue' : 'magenta')
        // draw.rect(this.bound.x, this.bound.y, this.bound.w, this.bound.h)
        // draw.ctx.globalAlpha = 1
    }
}

class Goal {
    x: number
    y: number
    w: number = 20
    h: number = 128
    vy: number = 2
    bound: BoundRect
    score: number = 0
    goal_alarm: number = -1
    constructor(x: number, y: number) {
        this.x = x
        this.y = y
        this.bound = new BoundRect(0, 0, this.w, this.h)
    }
    update() {
        this.y += this.vy
        if (this.y > stage.h - this.h / 2) {
            this.y = stage.h - this.h / 2
            this.vy = -this.vy
        }
        if (this.y < this.h / 2) {
            this.y = this.h / 2
            this.vy = -this.vy
        }
        this.bound.update_pos(this.x - this.w / 2, this.y - this.h / 2)

        if (this.goal_alarm > 0) {
            this.goal_alarm -= time.delta_time
            if (this.goal_alarm < 0) {
                this.goal_alarm = -1
            }
        }
        if (this.bound.intersect(ball.bound)) {
            if (this.goal_alarm === -1) {
                // goallll
                this.score += 1
                this.goal_alarm = 2000
            }
        }

    }
    render() {
        draw.set_color('orange')
        draw.rect(this.bound.left, this.bound.top, this.bound.w, this.bound.h)
        draw.set_color('black')
        draw.draw(true)
    }
}

const ball = new Ball(stage.mid.w, stage.mid.h, 30)
const player1 = new Player(
    stage.w * 0.75, stage.h * 0.7,
    'ArrowLeft', 'ArrowRight', 'ArrowUp',
    new BoundRect(0, 0, 64, 100),

)
const player2 = new Player(
    stage.w * 0.25, stage.h * 0.7,
    'KeyA', 'KeyD', 'KeyW',
    new BoundRect(0, 0, 64, 100)
)

const timer = {
    time: 0,
    default_time: 0.2 * 60 * 1000,
    s() {
        return Math.max(0, Math.ceil(this.time / 1000))
    },
}

type GameState = 'play' | 'end'

let game_state: GameState = 'play'
timer.time = timer.default_time

const goal1 = new Goal(stage.w - 32, stage.mid.h)
const goal2 = new Goal(32, stage.mid.h)
goal2.vy = -goal2.vy

const scene_play = scene.create('play')

scene_play.update = () => {
    timer.time -= time.delta_time
    if (timer.time <= 0) {
        game_state = 'end'
    }

    ball.update()
    player1.update()
    player2.update()
    goal1.update()
    goal2.update()
}

scene_play.render = () => {
    ball.render()
    player1.render()
    player2.render()
    goal1.render()
    goal2.render()

    draw.ctx.font = '120px Raleway, sans-serif'
    draw.set_color('black')
    draw.ctx.globalAlpha = 0.7
    draw.rect(stage.mid.w - 200, 0, 400, 120)
    draw.ctx.globalAlpha = 1
    draw.set_color('white')
    draw.set_hvalign('center', 'top')
    draw.text(stage.mid.w - 120, 0, `${goal1.score}`)
    draw.text(stage.mid.w + 120, 0, `${goal2.score}`)
    draw.set_hvalign('center', 'middle')
    draw.ctx.font = '40px Raleway, sans-serif'
    draw.text(stage.mid.w, 60, `${timer.s()}`)

    if (game_state === 'end') {
        let message = goal1.score > goal2.score ? 'Player 2 WON!' : 'Player 1 WON'
        if (goal1.score === goal2.score) message = 'DRAW!'
        draw.text(stage.mid.w, stage.mid.h, message)
    }
}

engine.start(scene_play)
