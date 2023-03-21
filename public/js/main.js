"use strict";
const engine = new RscEngine(1280, 540);
const { input, time, stage, scene, draw } = engine;
const GRAVITY = 0.2;
const ball_image = new Image();
ball_image.src = 'img/ball.png';
const player_image = new Image();
player_image.src = 'img/player.png';
class BoundRect {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.left = this.x;
        this.right = this.x + this.w;
        this.top = this.y;
        this.bottom = this.y + this.h;
    }
    update_bound() {
        this.left = this.x;
        this.right = this.x + this.w;
        this.top = this.y;
        this.bottom = this.y + this.h;
    }
    update_pos(x, y) {
        this.x = x;
        this.y = y;
        this.update_bound();
    }
    intersect(other) {
        return this.left < other.right && this.right > other.left && this.top < other.bottom && this.bottom > other.top;
    }
}
class Ball {
    constructor(x, y, r) {
        this.x = 0;
        this.y = 0;
        this.r = 0;
        this.vx = 0;
        this.vy = 0;
        this.bounce_fric = 0.97;
        this.ground_fric = 0.92;
        this.color = 'red';
        this.gravity = GRAVITY;
        this.is_grounded = false;
        this.x = x;
        this.y = y;
        this.r = r;
        this.bound = new BoundRect(this.x - this.r, this.y - this.r, this.r * 2, this.r * 2);
    }
    resolve_collision() {
        if (this.x > stage.w - this.r) {
            this.x = stage.w - this.r;
            this.vx = -this.vx * this.bounce_fric;
        }
        else if (this.x < this.r) {
            this.x = this.r;
            this.vx = -this.vx * this.bounce_fric;
        }
        if (this.y > stage.h - this.r) {
            this.y = stage.h - this.r;
            this.vy = -this.vy * this.bounce_fric;
        }
        else if (this.y < this.r) {
            this.y = this.r;
            this.vy = -this.vy * this.bounce_fric;
        }
    }
    update_after_move() {
        this.resolve_collision();
        this.bound.update_pos(this.x - this.r, this.y - this.r);
    }
    update() {
        if (!this.is_grounded) {
            this.vy += this.gravity;
            if (this.y >= stage.h - this.r) {
                this.is_grounded = true;
            }
        }
        if (this.is_grounded) {
            this.vx *= this.ground_fric;
            if (this.y < stage.h - this.r) {
                this.is_grounded = false;
            }
        }
        this.x += this.vx;
        this.y += this.vy;
        this.update_after_move();
    }
    render() {
        draw.ctx.drawImage(ball_image, this.x - this.r, this.y - this.r, this.r * 2, this.r * 2);
    }
}
class Player {
    constructor(x, y, left_key, right_key, jump_key, bound) {
        this.x = 0;
        this.y = 0;
        this.grav = GRAVITY;
        this.fric = 0.95;
        this.move_acc = 0.4;
        this.move_maxspd = 4;
        this.vx = 0;
        this.vy = 0;
        this.jump_spd = 10;
        this.is_grounded = false;
        this.x = x;
        this.y = y;
        this.left_key = left_key;
        this.right_key = right_key;
        this.jump_key = jump_key;
        this.bound = bound;
    }
    resolve_collision() {
        if (this.y > stage.h) {
            this.y = stage.h;
            this.vy = 0;
        }
    }
    ball_collision_check() {
        if (this.bound.intersect(ball.bound)) {
            const xdif = this.x - ball.x;
            const ydif = this.y - this.bound.h / 2 - ball.y;
            if (Math.abs(ydif) < this.bound.h / 4) {
                if (xdif < 0) {
                    ball.x = this.bound.right + ball.r;
                }
                else if (xdif >= 0) {
                    ball.x = this.bound.left - ball.r;
                }
            }
            ball.vx += (ball.x - this.x) * 0.05;
            ball.vy += (ball.y - this.y) * 0.01;
            ball.update_after_move();
        }
    }
    update() {
        if (input.is_held(this.left_key)) {
            this.vx -= this.move_acc;
            if (this.vx < -this.move_maxspd) {
                this.vx = -this.move_maxspd;
            }
        }
        if (input.is_held(this.right_key)) {
            this.vx += this.move_acc;
            if (this.vx > this.move_maxspd) {
                this.vx = this.move_maxspd;
            }
        }
        if (!this.is_grounded) {
            this.vy += this.grav;
            if (this.y >= stage.h) {
                this.is_grounded = true;
            }
        }
        if (input.is_pressed(this.jump_key)) {
            if (this.is_grounded) {
                this.vy -= this.jump_spd;
                this.is_grounded = false;
            }
        }
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= this.fric;
        this.resolve_collision();
        this.bound.update_pos(this.x - this.bound.w / 2, this.y - this.bound.h);
        this.ball_collision_check();
    }
    render() {
        const sw = 40;
        const sh = 50;
        const dw = 64;
        const dh = 100;
        const t = Math.round(time.time / 100) % 5;
        draw.ctx.drawImage(player_image, sw * t, sh, sw, sh, this.x - dw / 2, this.y - dh, dw, dh);
    }
}
class Goal {
    constructor(x, y) {
        this.w = 20;
        this.h = 128;
        this.vy = 2;
        this.score = 0;
        this.goal_alarm = -1;
        this.x = x;
        this.y = y;
        this.bound = new BoundRect(0, 0, this.w, this.h);
    }
    update() {
        this.y += this.vy;
        if (this.y > stage.h - this.h / 2) {
            this.y = stage.h - this.h / 2;
            this.vy = -this.vy;
        }
        if (this.y < this.h / 2) {
            this.y = this.h / 2;
            this.vy = -this.vy;
        }
        this.bound.update_pos(this.x - this.w / 2, this.y - this.h / 2);
        if (this.goal_alarm > 0) {
            this.goal_alarm -= time.delta_time;
            if (this.goal_alarm < 0) {
                this.goal_alarm = -1;
            }
        }
        if (this.bound.intersect(ball.bound)) {
            if (this.goal_alarm === -1) {
                this.score += 1;
                this.goal_alarm = 2000;
            }
        }
    }
    render() {
        draw.set_color('orange');
        draw.rect(this.bound.left, this.bound.top, this.bound.w, this.bound.h);
        draw.set_color('black');
        draw.draw(true);
    }
}
const ball = new Ball(stage.mid.w, stage.mid.h, 30);
const player1 = new Player(stage.w * 0.75, stage.h * 0.7, 'ArrowLeft', 'ArrowRight', 'ArrowUp', new BoundRect(0, 0, 64, 100));
const player2 = new Player(stage.w * 0.25, stage.h * 0.7, 'KeyA', 'KeyD', 'KeyW', new BoundRect(0, 0, 64, 100));
const timer = {
    time: 0,
    default_time: 0.2 * 60 * 1000,
    s() {
        return Math.max(0, Math.ceil(this.time / 1000));
    },
};
let game_state = 'play';
timer.time = timer.default_time;
const goal1 = new Goal(stage.w - 32, stage.mid.h);
const goal2 = new Goal(32, stage.mid.h);
goal2.vy = -goal2.vy;
const scene_play = scene.create('play');
scene_play.update = () => {
    timer.time -= time.delta_time;
    if (timer.time <= 0) {
        game_state = 'end';
    }
    ball.update();
    player1.update();
    player2.update();
    goal1.update();
    goal2.update();
};
scene_play.render = () => {
    ball.render();
    player1.render();
    player2.render();
    goal1.render();
    goal2.render();
    draw.ctx.font = '120px Raleway, sans-serif';
    draw.set_color('black');
    draw.ctx.globalAlpha = 0.7;
    draw.rect(stage.mid.w - 200, 0, 400, 120);
    draw.ctx.globalAlpha = 1;
    draw.set_color('white');
    draw.set_hvalign('center', 'top');
    draw.text(stage.mid.w - 120, 0, `${goal1.score}`);
    draw.text(stage.mid.w + 120, 0, `${goal2.score}`);
    draw.set_hvalign('center', 'middle');
    draw.ctx.font = '40px Raleway, sans-serif';
    draw.text(stage.mid.w, 60, `${timer.s()}`);
    if (game_state === 'end') {
        let message = goal1.score > goal2.score ? 'Player 2 WON!' : 'Player 1 WON';
        if (goal1.score === goal2.score)
            message = 'DRAW!';
        draw.text(stage.mid.w, stage.mid.h, message);
    }
};
engine.start(scene_play);
