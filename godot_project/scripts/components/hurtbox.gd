class_name Hurtbox
extends Area2D

## Hurtbox Component
## Handles damage reception, directional knockback, invincibility frames, and visual blinking.

signal hurt(damage: int, knockback_dir: Vector2)

@export var invincible: bool = false
@export var invincibility_duration: float = 0.8
@export var blink_sprite: CanvasItem = null

var _inv_timer: Timer
var _blink_tween: Tween

func _ready() -> void:
	add_to_group("hurtbox")
	area_entered.connect(_on_area_entered)
	_build_timer()

func _build_timer() -> void:
	_inv_timer = Timer.new()
	_inv_timer.one_shot = true
	_inv_timer.wait_time = invincibility_duration
	_inv_timer.timeout.connect(_on_invincibility_expired)
	add_child(_inv_timer)

func _on_area_entered(area: Area2D) -> void:
	if not area is Hitbox:
		return
	if invincible:
		return
	
	var hb: Hitbox = area as Hitbox
	# Check friend/foe from Hitbox perspective
	var parent_node = get_parent()
	if hb.is_player_owned and parent_node.is_in_group("player"):
		return
	if not hb.is_player_owned and parent_node.is_in_group("enemy"):
		return

	var knockback_dir := Vector2.RIGHT
	var diff: Vector2 = global_position - hb.global_position
	if diff.length_squared() > 0.0:
		knockback_dir = diff.normalized()

	hurt.emit(hb.damage, knockback_dir)
	_start_invincibility()

func _start_invincibility() -> void:
	invincible = true
	_inv_timer.wait_time = invincibility_duration
	_inv_timer.start()
	_start_blink()

func _start_blink() -> void:
	if blink_sprite == null:
		for child in get_parent().get_children():
			if child is Sprite2D or child is AnimatedSprite2D:
				blink_sprite = child as CanvasItem
				break
	if blink_sprite == null:
		return
		
	if _blink_tween != null and _blink_tween.is_valid():
		_blink_tween.kill()
		
	_blink_tween = create_tween()
	_blink_tween.set_loops()
	_blink_tween.tween_property(blink_sprite, "modulate:a", 0.1, 0.08)
	_blink_tween.tween_property(blink_sprite, "modulate:a", 1.0, 0.08)

func _on_invincibility_expired() -> void:
	invincible = false
	if _blink_tween != null and _blink_tween.is_valid():
		_blink_tween.kill()
	if blink_sprite != null:
		blink_sprite.modulate.a = 1.0

func grant_invincibility(duration: float) -> void:
	invincibility_duration = duration
	_start_invincibility()
