class_name PistolThug
extends CharacterBody2D

## Pistol Thug Enemy
## FSM: REPOSITION -> AIM (Laser line) -> FIRE -> RELOAD -> PANIC_RETREAT
## HP: 25, Preferred Range: 200px, 0.8s Laser sight telegraph

signal enemy_died(enemy_node: Node)

const MAX_HP: int = 25
const SPEED: float = 70.0
const PREFERRED_RANGE: float = 180.0
const PANIC_RANGE: float = 90.0
const GRAVITY: float = 800.0

enum State { REPOSITION, AIM, FIRE, RELOAD, PANIC_RETREAT, FLINCH, DEAD }

var state: State = State.REPOSITION
var hp: int = MAX_HP
var state_timer: float = 0.0
var target_player: Node2D = null

var laser_line: Line2D

func _ready() -> void:
	add_to_group("enemy")
	laser_line = Line2D.new()
	laser_line.width = 1.5
	laser_line.default_color = Color(1.0, 0.0, 0.0, 0.7)
	laser_line.visible = false
	add_child(laser_line)
	_find_player()

func _find_player() -> void:
	var players = get_tree().get_nodes_in_group("player")
	if players.size() > 0:
		target_player = players[0] as Node2D

func _physics_process(delta: float) -> void:
	if state == State.DEAD:
		return

	if not is_on_floor():
		velocity.y += GRAVITY * delta

	if not is_instance_valid(target_player):
		_find_player()
		move_and_slide()
		return

	var dist_x = target_player.global_position.x - global_position.x
	var abs_dist = abs(dist_x)

	match state:
		State.REPOSITION:
			if abs_dist < PANIC_RANGE:
				state = State.PANIC_RETREAT
			elif abs_dist > PREFERRED_RANGE + 40.0:
				velocity.x = sign(dist_x) * SPEED
			elif abs_dist < PREFERRED_RANGE - 30.0:
				velocity.x = -sign(dist_x) * SPEED
			else:
				velocity.x = 0
				state = State.AIM
				state_timer = 0.8
				laser_line.visible = true

		State.PANIC_RETREAT:
			velocity.x = -sign(dist_x) * (SPEED * 1.2)
			if abs_dist >= PREFERRED_RANGE:
				state = State.REPOSITION

		State.AIM:
			velocity.x = 0
			state_timer -= delta
			_update_laser()
			if state_timer <= 0.0:
				state = State.FIRE

		State.FIRE:
			laser_line.visible = false
			_shoot_bullet()
			state = State.RELOAD
			state_timer = 1.5

		State.RELOAD:
			velocity.x = 0
			state_timer -= delta
			if state_timer <= 0.0:
				state = State.REPOSITION

		State.FLINCH:
			laser_line.visible = false
			velocity.x = move_toward(velocity.x, 0, SPEED * delta)

	move_and_slide()

func _update_laser() -> void:
	if not is_instance_valid(target_player):
		return
	laser_line.clear_points()
	laser_line.add_point(Vector2.ZERO)
	laser_line.add_point(to_local(target_player.global_position))
	laser_line.default_color.a = randf_range(0.4, 0.9)

func _shoot_bullet() -> void:
	if not is_instance_valid(target_player):
		return
	var dir = (target_player.global_position - global_position).normalized()
	var proj_script = load("res://scenes/characters/projectile.gd")
	var proj = Area2D.new()
	proj.set_script(proj_script)
	proj.speed = 350.0
	proj.damage = 10
	proj.direction = dir
	proj.is_player_owned = false
	proj.global_position = global_position
	get_parent().add_child(proj)

func take_damage(amount: int, knockback: Vector2) -> void:
	if state == State.DEAD:
		return
	hp -= amount
	velocity += knockback
	laser_line.visible = false
	
	if hp <= 0:
		die()
	else:
		state = State.FLINCH
		var timer = get_tree().create_timer(0.3)
		timer.timeout.connect(func(): if state == State.FLINCH: state = State.REPOSITION)

func die() -> void:
	state = State.DEAD
	laser_line.visible = false
	velocity = Vector2.ZERO
	GameManager.register_kill()
	enemy_died.emit(self)
	
	if randf() <= 0.15:
		_spawn_pickup()
	queue_free()

func _spawn_pickup() -> void:
	var pickup_script = load("res://scenes/enemies/hp_pickup.gd")
	var pickup = Area2D.new()
	pickup.set_script(pickup_script)
	pickup.global_position = global_position
	get_parent().add_child(pickup)
