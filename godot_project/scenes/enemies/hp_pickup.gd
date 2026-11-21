class_name HPPickup
extends Area2D

## HP Pickup (+5 or +15)
## Heals player on touch, bobs with sine wave, despawns after 10s.

@export var heal_amount: int = 5

var _time_acc: float = 0.0
var _base_y: float = 0.0
const BOB_AMPLITUDE: float = 3.0
const BOB_SPEED: float = 2.0

func _ready() -> void:
	add_to_group("pickup")
	_base_y = position.y
	body_entered.connect(_on_body_entered)
	
	var despawn_timer = get_tree().create_timer(10.0)
	despawn_timer.timeout.connect(queue_free)

func _process(delta: float) -> void:
	_time_acc += delta
	position.y = _base_y + (sin(_time_acc * BOB_SPEED * TAU) * BOB_AMPLITUDE)

func _on_body_entered(body: Node) -> void:
	if body.is_in_group("player") and body.has_method("heal"):
		body.heal(heal_amount)
		queue_free()
