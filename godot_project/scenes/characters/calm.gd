class_name CalmPlayer
extends CharacterBody2D

## CALM Player Controller
## Archetype: Close-Range Assassin
## Katana 3-hit combo, Crimson Dash-Slash, Bullet Deflect, Double Jump.

signal hp_changed(new_hp: int)
signal special_meter_changed(new_val: float)
signal died()

const MAX_HP: int = 100
const SPEED: float = 180.0
const JUMP_VELOCITY: float = -320.0
const GRAVITY: float = 800.0

enum State { IDLE, WALK, JUMP, ATTACK_1, ATTACK_2, ATTACK_3, DASH_SLASH, HURT, DEAD }

var state: State = State.IDLE
var hp: int = MAX_HP
var special_meter: float = 0.0
var jump_count: int = 0
var max_jumps: int = 2

# Combo tracking
var combo_step: int = 0
var combo_window_timer: float = 0.0
const COMBO_WINDOW: float = 0.5
var attack_timer: float = 0.0

# Dash Slash
var dash_timer: float = 0.0
var dash_dir: float = 1.0
const DASH_DURATION: float = 0.25
const DASH_SPEED: float = 800.0

# Node references
@onready var hurtbox: Hurtbox = $Hurtbox if has_node("Hurtbox") else null
@onready var sprite: CanvasItem = $Sprite2D if has_node("Sprite2D") else null

func _ready() -> void:
	add_to_group("player")
	if hurtbox:
		hurtbox.hurt.connect(_on_hurt)

func _physics_process(delta: float) -> void:
	if state == State.DEAD:
		return

	# Combo input buffer timer
	if combo_window_timer > 0.0:
		combo_window_timer -= delta
		if combo_window_timer <= 0.0 and (state == State.IDLE or state == State.WALK):
			combo_step = 0

	# Gravity
	if not is_on_floor() and state != State.DASH_SLASH:
		velocity.y += GRAVITY * delta
	elif is_on_floor() and state != State.JUMP and state != State.DASH_SLASH:
		jump_count = 0

	match state:
		State.IDLE, State.WALK, State.JUMP:
			_handle_movement_input()
			_handle_combat_input()
		State.ATTACK_1, State.ATTACK_2, State.ATTACK_3:
			velocity.x = move_toward(velocity.x, 0, SPEED * 2.0 * delta)
			attack_timer -= delta
			if attack_timer <= 0.0:
				state = State.IDLE
		State.DASH_SLASH:
			dash_timer -= delta
			velocity = Vector2(dash_dir * DASH_SPEED, 0)
			if dash_timer <= 0.0:
				state = State.IDLE

	move_and_slide()

func _handle_movement_input() -> void:
	var input_dir = Input.get_axis("move_left", "move_right")
	if input_dir != 0:
		velocity.x = input_dir * SPEED
		if sprite:
			sprite.scale.x = 1.0 if input_dir > 0 else -1.0
		if is_on_floor():
			state = State.WALK
	else:
		velocity.x = move_toward(velocity.x, 0, SPEED)
		if is_on_floor():
			state = State.IDLE

	if Input.is_action_just_pressed("jump"):
		if is_on_floor() or jump_count < max_jumps:
			velocity.y = JUMP_VELOCITY
			jump_count += 1
			state = State.JUMP

func _handle_combat_input() -> void:
	if Input.is_action_just_pressed("attack"):
		_execute_combo()
	elif Input.is_action_just_pressed("special"):
		if special_meter >= 30.0:
			_execute_dash_slash()

func _execute_combo() -> void:
	combo_step = (combo_step % 3) + 1
	combo_window_timer = COMBO_WINDOW
	
	match combo_step:
		1:
			state = State.ATTACK_1
			attack_timer = 0.2
			_deal_melee_hit(8, 40.0)
			_check_bullet_deflect()
		2:
			state = State.ATTACK_2
			attack_timer = 0.25
			_deal_melee_hit(10, 50.0)
		3:
			state = State.ATTACK_3
			attack_timer = 0.35
			_deal_melee_hit(15, 70.0)
			ScreenEffects.hit_stop_katana_finisher()
			ComboManager.hit_registered()
			_spawn_crescent_wave()
			combo_step = 0

func _deal_melee_hit(damage: int, knockback: float) -> void:
	var facing = -1.0 if (sprite and sprite.scale.x < 0) else 1.0
	var hit_pos = global_position + Vector2(facing * 30.0, 0)
	
	var space = get_world_2d().direct_space_state
	var query = PhysicsShapeQueryParameters2D.new()
	var circle = CircleShape2D.new()
	circle.radius = 28.0
	query.shape = circle
	query.transform = Transform2D(0, hit_pos)
	query.collision_mask = 4 # enemy layer
	
	var results = space.intersect_shape(query)
	for res in results:
		var target = res.collider
		if target.has_method("take_damage"):
			target.take_damage(damage, Vector2(facing, 0) * knockback)
			add_special(5.0)
			ComboManager.hit_registered()

func _check_bullet_deflect() -> void:
	# Deflect incoming enemy projectiles in parry box
	var space = get_world_2d().direct_space_state
	var query = PhysicsShapeQueryParameters2D.new()
	var circle = CircleShape2D.new()
	circle.radius = 35.0
	query.shape = circle
	query.transform = Transform2D(0, global_position)
	query.collision_mask = 16 # enemy projectile layer
	
	var results = space.intersect_shape(query)
	for res in results:
		var proj = res.collider
		if proj is Projectile and not proj.is_player_owned:
			proj.is_player_owned = true
			proj.direction = -proj.direction
			proj.damage = 30
			ScreenEffects.hit_stop(30.0)

func _spawn_crescent_wave() -> void:
	var facing = -1.0 if (sprite and sprite.scale.x < 0) else 1.0
	var proj_script = load("res://scenes/characters/projectile.gd")
	var proj = Area2D.new()
	proj.set_script(proj_script)
	proj.speed = 350.0
	proj.damage = 15
	proj.direction = Vector2(facing, 0)
	proj.is_player_owned = true
	proj.global_position = global_position + Vector2(facing * 20.0, 0)
	get_parent().add_child(proj)

func _execute_dash_slash() -> void:
	special_meter -= 30.0
	special_meter_changed.emit(special_meter)
	
	dash_dir = -1.0 if (sprite and sprite.scale.x < 0) else 1.0
	state = State.DASH_SLASH
	dash_timer = DASH_DURATION
	
	if hurtbox:
		hurtbox.grant_invincibility(DASH_DURATION)
		
	# Deal 35 damage with bleed/stun
	_deal_melee_hit(35, 100.0)
	ScreenEffects.screen_shake(0.4, 0.2)

func add_special(amount: float) -> void:
	special_meter = clamp(special_meter + amount, 0.0, 100.0)
	special_meter_changed.emit(special_meter)

func heal(amount: int) -> void:
	hp = min(MAX_HP, hp + amount)
	hp_changed.emit(hp)

func take_damage(amount: int, knockback: Vector2) -> void:
	if state == State.DEAD or state == State.DASH_SLASH:
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
	GameManager.on_player_died(1)
