class_name ShieldBruiser
extends CharacterBody2D

## Shield Bruiser Enemy
## FSM: ADVANCE -> BLOCK -> BASH -> STUNNED -> BERSERK -> DEAD
## HP: 60, Frontal ballistic block, Berserk below 30% HP

signal enemy_died(enemy_node: Node)

const MAX_HP: int = 60
const SPEED: float = 40.0
const BASH_RANGE: float = 45.0
const GRAVITY: float = 800.0

enum State { ADVANCE, BLOCK, BASH, STUNNED, BERSERK, DEAD }

var state: State = State.ADVANCE
var hp: int = MAX_HP
var shield_up: bool = true
var is_berserk: bool = false
var bash_timer: float = 0.0
var target_player: Node2D = null

func _ready() -> void:
	add_to_group("enemy")
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

	var diff_x = target_player.global_position.x - global_position.x
	var dist = abs(diff_x)
	var move_speed = SPEED * 1.5 if is_berserk else SPEED

	match state:
		State.ADVANCE, State.BERSERK:
			velocity.x = sign(diff_x) * move_speed
			if dist <= BASH_RANGE:
				_execute_bash()

		State.BASH:
			velocity.x = 0
			bash_timer -= delta
			if bash_timer <= 0.0:
				state = State.BERSERK if is_berserk else State.ADVANCE

		State.STUNNED:
			velocity.x = 0

	move_and_slide()

func _execute_bash() -> void:
	state = State.BASH
	bash_timer = 1.0
	
	var timer = get_tree().create_timer(0.3)
	timer.timeout.connect(func():
		if state == State.BASH and is_instance_valid(target_player):
			var dist = global_position.distance_to(target_player.global_position)
			if dist <= BASH_RANGE + 20.0 and target_player.has_method("take_damage"):
				var dir = (target_player.global_position - global_position).normalized()
				target_player.take_damage(15, dir * 60.0)
	)

func take_damage(amount: int, knockback: Vector2) -> void:
	if state == State.DEAD:
		return

	# Check frontal block
	if shield_up and not is_berserk:
		var hit_from_behind = (knockback.x > 0 and velocity.x > 0) or (knockback.x < 0 and velocity.x < 0)
		if not hit_from_behind and knockback != Vector2.ZERO:
			# Blocked!
			ScreenEffects.screen_shake(0.1, 0.1)
			return
		else:
			# Flanked from behind -> Stunned
			state = State.STUNNED
			shield_up = false
			var timer = get_tree().create_timer(0.6)
			timer.timeout.connect(func():
				shield_up = true
				if state == State.STUNNED: state = State.ADVANCE
			)

	hp -= amount
	velocity += knockback * 0.5
	
	if hp <= (MAX_HP * 0.3) and not is_berserk:
		is_berserk = true
		shield_up = false
		state = State.BERSERK

	if hp <= 0:
		die()

func die() -> void:
	state = State.DEAD
	velocity = Vector2.ZERO
	GameManager.register_kill()
	enemy_died.emit(self)
	
	# Guaranteed +15 HP drop
	var pickup_script = load("res://scenes/enemies/hp_pickup.gd")
	var pickup = Area2D.new()
	pickup.set_script(pickup_script)
	pickup.heal_amount = 15
	pickup.global_position = global_position
	get_parent().add_child(pickup)
	
	queue_free()
