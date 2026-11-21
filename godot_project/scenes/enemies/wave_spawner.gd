class_name WaveSpawner
extends Node2D

## Wave Spawner
## Sequences enemy encounters, tracks alive count, triggers progression.

signal all_waves_cleared()
signal wave_started(wave_index: int)
signal enemy_spawned(enemy_node: Node)

@export var waves: Array = []

var current_wave_idx: int = 0
var alive_count: int = 0
var is_spawning: bool = false

func start_waves() -> void:
	current_wave_idx = 0
	_spawn_current_wave()

func _spawn_current_wave() -> void:
	if current_wave_idx >= waves.size():
		all_waves_cleared.emit()
		return

	is_spawning = true
	wave_started.emit(current_wave_idx)
	
	var wave_data = waves[current_wave_idx]
	var enemy_scene: PackedScene = wave_data.get("enemy_scene")
	var count: int = wave_data.get("count", 1)
	var spawn_positions: Array = wave_data.get("spawn_positions", [global_position])
	var delay_between: float = wave_data.get("delay_between", 0.5)

	alive_count = count

	for i in range(count):
		if i > 0 and delay_between > 0.0:
			await get_tree().create_timer(delay_between).timeout

		if not enemy_scene:
			alive_count -= 1
			continue

		var enemy = enemy_scene.instantiate()
		var pos_idx = i % spawn_positions.size()
		enemy.global_position = spawn_positions[pos_idx]
		
		if enemy.has_signal("enemy_died"):
			enemy.enemy_died.connect(_on_enemy_died)
			
		get_parent().add_child(enemy)
		enemy_spawned.emit(enemy)

	is_spawning = false

func _on_enemy_died(_enemy_node: Node) -> void:
	alive_count -= 1
	if alive_count <= 0 and not is_spawning:
		current_wave_idx += 1
		var timer = get_tree().create_timer(1.2)
		timer.timeout.connect(_spawn_current_wave)
