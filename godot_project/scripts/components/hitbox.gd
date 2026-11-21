class_name Hitbox
extends Area2D

## Hitbox Component
## Attached to melee swings, bullets, explosions, and boss slams.

@export var damage: int = 10
@export var knockback_force: float = 40.0
@export var hit_stop_ms: float = 40.0
@export var is_player_owned: bool = true

signal hit_landed(target: Node, damage: int, knockback: float)

var _hit_this_swing: Array[Node] = []

func _ready() -> void:
	body_entered.connect(_on_body_entered)
	area_entered.connect(_on_area_entered)

func reset_hit_list() -> void:
	_hit_this_swing.clear()

func _on_body_entered(body: Node) -> void:
	_process_hit(body)

func _on_area_entered(area: Area2D) -> void:
	if area.is_in_group("hurtbox"):
		_process_hit(area.get_parent())

func _process_hit(target: Node) -> void:
	if target in _hit_this_swing or target == get_parent():
		return
	
	# Determine collision eligibility
	if is_player_owned and target.is_in_group("player"):
		return
	if not is_player_owned and target.is_in_group("enemy"):
		return

	_hit_this_swing.append(target)
	
	var knockback_dir := Vector2.RIGHT
	if target is Node2D:
		var diff: Vector2 = (target as Node2D).global_position - global_position
		if diff.length_squared() > 0.0:
			knockback_dir = diff.normalized()

	if target.has_method("take_damage"):
		target.take_damage(damage, knockback_dir * knockback_force)

	hit_landed.emit(target, damage, knockback_force)
	
	if hit_stop_ms > 0.0:
		ScreenEffects.hit_stop(hit_stop_ms)
