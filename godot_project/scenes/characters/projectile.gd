class_name Projectile
extends Area2D

## Projectile
## Bullet, missile, or crescent wave. Supports directional travel and homing.

@export var speed: float = 400.0
@export var damage: int = 15
@export var knockback_force: float = 40.0
@export var direction: Vector2 = Vector2.RIGHT
@export var homing: bool = false
@export var homing_target: Node2D = null
@export var turn_speed: float = 1.57 # 90 deg/s in radians
@export var is_player_owned: bool = true
@export var lifespan: float = 3.0

var _timer: float = 0.0

func _ready() -> void:
	add_to_group("bullet")
	body_entered.connect(_on_body_entered)
	area_entered.connect(_on_area_entered)
	rotation = direction.angle()

func _physics_process(delta: float) -> void:
	_timer += delta
	if _timer >= lifespan:
		queue_free()
		return
		
	if homing and is_instance_valid(homing_target):
		var target_dir = (homing_target.global_position - global_position).normalized()
		direction = direction.slerp(target_dir, turn_speed * delta).normalized()
		rotation = direction.angle()
		
	global_position += direction * speed * delta

func _on_body_entered(body: Node) -> void:
	if is_player_owned and body.is_in_group("player"):
		return
	if not is_player_owned and body.is_in_group("enemy"):
		return
	if body.has_method("take_damage"):
		body.take_damage(damage, direction * knockback_force)
	queue_free()

func _on_area_entered(area: Area2D) -> void:
	if area is Hurtbox:
		var parent = area.get_parent()
		if is_player_owned and parent.is_in_group("player"):
			return
		if not is_player_owned and parent.is_in_group("enemy"):
			return
		# Hurtbox handles take_damage
		queue_free()
