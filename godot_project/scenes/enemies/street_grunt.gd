class_name StreetGrunt
extends CharacterBody2D

## Street Grunt Enemy
## FSM: WANDER -> CHASE -> ATTACK -> FLINCH -> DEAD
## HP: 20, Speed: 60, Baton swing melee

signal enemy_died(enemy_node: Node)

const MAX_HP: int = 20
const SPEED: float = 60.0
const DETECT_RANGE: float = 300.0
const ATTACK_RANGE: float = 40.0
const GRAVITY: float = 800.0

enum State { WANDER, CHASE, ATTACK, FLINCH, DEAD }

var state: State = State.WANDER
var hp: int = MAX_HP
var wander_dir: float = 1.0
var wander_timer: float = 0.0
var attack_timer: float = 0.0
var target_player: Node2D = null

func _ready() -> void:
	add_to_group("enemy")
	_find_player()

func _physics_process(delta: float) -> void:
	if state == State.DEAD:
		return

	if not is_on_floor():
		velocity.y += GRAVITY * delta

	match state:
		State.WANDER:
			_process_wander(delta)
		State.CHASE:
			_process_chase(delta)
		State.ATTACK:
			velocity.x = 0
			attack_timer -= delta
			if attack_timer <= 0.0:
				state = State.CHASE
		State.FLINCH:
			velocity.x = move_toward(velocity.x, 0, SPEED * 2.0 * delta)

	move_and_slide()

func _find_player() -> void:
	var players = get_tree().get_nodes_in_group("player")
	if players.size() > 0:
		target_player = players[0] as Node2D

func _process_wander(delta: float) -> void:
	wander_timer -= delta
	if wander_timer <= 0.0:
		wander_dir = -wander_dir if randf() > 0.5 else wander_dir
		wander_timer = randf_range(1.5, 3.5)
	
	velocity.x = wander_dir * (SPEED * 0.5)
	
	if is_instance_valid(target_player):
		var dist = global_position.distance_to(target_player.global_position)
		if dist <= DETECT_RANGE:
			state = State.CHASE

func _process_chase(delta: float) -> void:
	if not is_instance_valid(target_player):
		_find_player()
		return
		
	var diff_x = target_player.global_position.x - global_position.x
	var dist = abs(diff_x)
	
	if dist <= ATTACK_RANGE:
		_execute_attack()
	else:
		velocity.x = sign(diff_x) * SPEED

func _execute_attack() -> void:
	state = State.ATTACK
	attack_timer = 0.8
	
	# Swing baton after windup
	var timer = get_tree().create_timer(0.25)
	timer.timeout.connect(func():
		if state == State.ATTACK and is_instance_valid(target_player):
			var dist = global_position.distance_to(target_player.global_position)
			if dist <= ATTACK_RANGE + 15.0 and target_player.has_method("take_damage"):
				var dir = (target_player.global_position - global_position).normalized()
				target_player.take_damage(8, dir * 40.0)
	)

func take_damage(amount: int, knockback: Vector2) -> void:
	if state == State.DEAD:
		return
	hp -= amount
	velocity += knockback
	
	if hp <= 0:
		die()
	else:
		state = State.FLINCH
		var timer = get_tree().create_timer(0.3)
		timer.timeout.connect(func(): if state == State.FLINCH: state = State.CHASE)

func die() -> void:
	state = State.DEAD
	velocity = Vector2.ZERO
	GameManager.register_kill()
	enemy_died.emit(self)
	
	# 10% chance for +5 HP drop
	if randf() <= 0.10:
		_spawn_pickup()
		
	queue_free()

func _spawn_pickup() -> void:
	var pickup_script = load("res://scenes/enemies/hp_pickup.gd")
	var pickup = Area2D.new()
	pickup.set_script(pickup_script)
	pickup.global_position = global_position
	get_parent().add_child(pickup)
