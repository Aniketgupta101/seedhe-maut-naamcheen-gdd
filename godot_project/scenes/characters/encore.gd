class_name EncorePlayer
extends CharacterBody2D

## ENCORE Player Controller
## Archetype: Ranged Gunslinger
## Dual SMGs (8-directional aim), Incendiary Grenade, Tactical Roll, Minigun upgrade.

signal hp_changed(new_hp: int)
signal special_meter_changed(new_val: float)
signal weapon_changed(weapon_name: String)
signal died()

const MAX_HP: int = 100
const SPEED: float = 160.0
const JUMP_VELOCITY: float = -300.0
const GRAVITY: float = 800.0

enum State { IDLE, WALK, JUMP, SHOOT, GRENADE, ROLL, HURT, DEAD }

var state: State = State.IDLE
var hp: int = MAX_HP
var special_meter: float = 0.0
var has_minigun: bool = false

# Roll variables
var roll_timer: float = 0.0
var roll_cooldown_timer: float = 0.0
var roll_dir: Vector2 = Vector2.RIGHT
const ROLL_DURATION: float = 0.25
const ROLL_SPEED: float = 320.0
const ROLL_COOLDOWN: float = 1.5

# Shooting variables
var shoot_cooldown: float = 0.0
var burst_count: int = 0
var burst_timer: float = 0.0

@onready var hurtbox: Hurtbox = $Hurtbox if has_node("Hurtbox") else null
@onready var sprite: CanvasItem = $Sprite2D if has_node("Sprite2D") else null

func _ready() -> void:
	add_to_group("player")
	if hurtbox:
		hurtbox.hurt.connect(_on_hurt)

func _physics_process(delta: float) -> void:
	if state == State.DEAD:
		return

	if roll_cooldown_timer > 0.0:
		roll_cooldown_timer -= delta

	if shoot_cooldown > 0.0:
		shoot_cooldown -= delta

	# Gravity
	if not is_on_floor() and state != State.ROLL:
		velocity.y += GRAVITY * delta

	match state:
		State.IDLE, State.WALK, State.JUMP:
			_handle_movement(delta)
			_handle_actions()
		State.ROLL:
			roll_timer -= delta
			velocity = roll_dir * ROLL_SPEED
			if roll_timer <= 0.0:
				state = State.IDLE

	move_and_slide()

func _handle_movement(delta: float) -> void:
	var input_x = Input.get_axis("move_left", "move_right")
	if input_x != 0:
		velocity.x = input_x * SPEED
		if sprite:
			sprite.scale.x = 1.0 if input_x > 0 else -1.0
		if is_on_floor():
			state = State.WALK
	else:
		velocity.x = move_toward(velocity.x, 0, SPEED)
		if is_on_floor():
			state = State.IDLE

	if Input.is_action_just_pressed("jump") and is_on_floor():
		velocity.y = JUMP_VELOCITY
		state = State.JUMP

	# Tactical Roll
	if Input.is_action_just_pressed("dodge") and roll_cooldown_timer <= 0.0:
		_execute_roll(input_x)

func _execute_roll(input_x: float) -> void:
	state = State.ROLL
	roll_timer = ROLL_DURATION
	roll_cooldown_timer = ROLL_COOLDOWN
	var facing = input_x if input_x != 0 else (1.0 if (sprite and sprite.scale.x > 0) else -1.0)
	roll_dir = Vector2(facing, 0).normalized()
	
	if hurtbox:
		hurtbox.grant_invincibility(ROLL_DURATION)

func _handle_actions() -> void:
	if has_minigun:
		if Input.is_action_pressed("attack") and shoot_cooldown <= 0.0:
			_fire_minigun()
	else:
		if Input.is_action_just_pressed("attack") and shoot_cooldown <= 0.0:
			_fire_smg_burst()

	if Input.is_action_just_pressed("special") and special_meter >= 25.0:
		_throw_grenade()

func _get_aim_direction() -> Vector2:
	var aim = Vector2.ZERO
	if Input.is_action_pressed("aim_up"): aim.y -= 1
	if Input.is_action_pressed("aim_down"): aim.y += 1
	if Input.is_action_pressed("aim_left"): aim.x -= 1
	if Input.is_action_pressed("aim_right"): aim.x += 1
	
	if aim == Vector2.ZERO:
		var facing = -1.0 if (sprite and sprite.scale.x < 0) else 1.0
		aim = Vector2(facing, 0)
	return aim.normalized()

func _fire_smg_burst() -> void:
	shoot_cooldown = 0.35
	var aim = _get_aim_direction()
	for i in range(3):
		var timer = get_tree().create_timer(i * 0.08)
		timer.timeout.connect(func(): _spawn_bullet(aim, 5, 450.0))
	add_special(3.0)

func _fire_minigun() -> void:
	shoot_cooldown = 0.08
	var aim = _get_aim_direction()
	_spawn_bullet(aim, 15, 600.0, 60.0)
	ScreenEffects.shake_minigun()
	add_special(1.0)

func _spawn_bullet(dir: Vector2, dmg: int, spd: float, knockback: float = 30.0) -> void:
	var proj_script = load("res://scenes/characters/projectile.gd")
	var proj = Area2D.new()
	proj.set_script(proj_script)
	proj.speed = spd
	proj.damage = dmg
	proj.knockback_force = knockback
	proj.direction = dir
	proj.is_player_owned = true
	proj.global_position = global_position + (dir * 15.0)
	get_parent().add_child(proj)

func _throw_grenade() -> void:
	special_meter -= 25.0
	special_meter_changed.emit(special_meter)
	
	var aim = _get_aim_direction()
	# Simple explosion delayed call
	var timer = get_tree().create_timer(1.2)
	var spawn_pos = global_position + (aim * 120.0)
	timer.timeout.connect(func(): _explode_grenade(spawn_pos))

func _explode_grenade(pos: Vector2) -> void:
	ScreenEffects.hit_stop_barrel()
	ScreenEffects.screen_shake(0.6, 0.3)
	
	var space = get_world_2d().direct_space_state
	var query = PhysicsShapeQueryParameters2D.new()
	var circle = CircleShape2D.new()
	circle.radius = 80.0
	query.shape = circle
	query.transform = Transform2D(0, pos)
	query.collision_mask = 4 # enemy
	
	var results = space.intersect_shape(query)
	for res in results:
		var target = res.collider
		if target.has_method("take_damage"):
			var diff = (target.global_position - pos).normalized()
			target.take_damage(35, diff * 120.0)
			ComboManager.hit_registered()

func pickup_minigun() -> void:
	has_minigun = true
	weapon_changed.emit("Minigun")

func add_special(amount: float) -> void:
	special_meter = clamp(special_meter + amount, 0.0, 100.0)
	special_meter_changed.emit(special_meter)

func heal(amount: int) -> void:
	hp = min(MAX_HP, hp + amount)
	hp_changed.emit(hp)

func take_damage(amount: int, knockback: Vector2) -> void:
	if state == State.DEAD or state == State.ROLL:
		return
	hp = max(0, hp - amount)
	GameManager.register_damage(amount)
	hp_changed.emit(hp)
	velocity += knockback
	ScreenEffects.screen_shake(0.3, 0.2)
	
	if hp <= 0:
		die()

func _on_hurt(damage: int, knockback_dir: Vector2) -> void:
	take_damage(damage, knockback_dir * 100.0)

func die() -> void:
	state = State.DEAD
	died.emit()
	GameManager.on_player_died(2)
