extends Node

## ComboManager Singleton
## Tracks combo chains, hit timing, scoring multipliers, and partner passives.

signal combo_updated(count: int)
signal combo_broken(final_count: int)

const DEFAULT_COMBO_TIMEOUT: float = 3.0

var combo_count: int = 0
var max_combo_this_stage: int = 0
var combo_timer: Timer

func _ready() -> void:
	combo_timer = Timer.new()
	combo_timer.one_shot = true
	combo_timer.wait_time = DEFAULT_COMBO_TIMEOUT
	combo_timer.timeout.connect(_on_timeout)
	add_child(combo_timer)

func hit_registered() -> void:
	combo_count += 1
	if combo_count > max_combo_this_stage:
		max_combo_this_stage = combo_count
		GameManager.max_combo = max_combo_this_stage
		
	combo_timer.start(DEFAULT_COMBO_TIMEOUT)
	combo_updated.emit(combo_count)

func get_multiplier() -> float:
	if combo_count >= 30:
		return 3.0
	elif combo_count >= 20:
		return 2.0
	elif combo_count >= 10:
		return 1.5
	else:
		return 1.0

func extend_timer(extra_seconds: float) -> void:
	if not combo_timer.is_stopped():
		var remaining = combo_timer.time_left + extra_seconds
		combo_timer.start(remaining)

func reset_combo() -> void:
	if combo_count > 0:
		var final = combo_count
		combo_count = 0
		combo_timer.stop()
		combo_broken.emit(final)

func _on_timeout() -> void:
	reset_combo()
