extends Node

## GameManager Singleton
## Manages score, lives, stages, rankings, and persistent save data.

signal stage_cleared(rank: String)
signal game_over()
signal player_died(player_id: int)

const SAVE_PATH: String = "user://save.json"

var current_stage: int = 1
var player_lives: int = 3
var score: int = 0
var hi_score: int = 0

# Stat tracking for stage tally
var enemies_killed: int = 0
var max_combo: int = 0
var stage_start_time: float = 0.0
var par_time_seconds: float = 180.0
var damage_taken: int = 0

func _ready() -> void:
	load_hi_score()

func reset_stage_stats() -> void:
	enemies_killed = 0
	max_combo = 0
	damage_taken = 0
	stage_start_time = Time.get_ticks_msec() / 1000.0

func register_kill() -> void:
	enemies_killed += 1

func register_damage(amount: int) -> void:
	damage_taken += amount

func calculate_score(p_enemies: int, p_max_combo: int, seconds_over_par: float, p_damage_taken: int) -> int:
	var enemy_pts = p_enemies * 500
	var combo_pts = p_max_combo * 500
	var time_bonus = max(0, int(10000.0 - (seconds_over_par * 100.0)))
	var damage_bonus = max(0, int(10000.0 - (float(p_damage_taken) * 285.0)))
	return enemy_pts + combo_pts + time_bonus + damage_bonus

func get_rank(p_score: int) -> String:
	if p_score >= 70000:
		return "S"
	elif p_score >= 50000:
		return "A"
	elif p_score >= 30000:
		return "B"
	else:
		return "C"

func complete_stage() -> void:
	var elapsed = (Time.get_ticks_msec() / 1000.0) - stage_start_time
	var seconds_over_par = max(0.0, elapsed - par_time_seconds)
	var stage_score = calculate_score(enemies_killed, max_combo, seconds_over_par, damage_taken)
	score += stage_score
	
	if score > hi_score:
		hi_score = score
		save_hi_score()
		
	var rank = get_rank(stage_score)
	stage_cleared.emit(rank)

func on_player_died(player_id: int) -> void:
	player_lives -= 1
	player_died.emit(player_id)
	if player_lives <= 0:
		game_over.emit()

func save_hi_score() -> void:
	var file = FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file:
		var data = {"hi_score": hi_score}
		file.store_string(JSON.stringify(data))
		file.close()

func load_hi_score() -> void:
	if not FileAccess.file_exists(SAVE_PATH):
		return
	var file = FileAccess.open(SAVE_PATH, FileAccess.READ)
	if file:
		var text = file.get_as_text()
		file.close()
		var parsed = JSON.parse_string(text)
		if parsed and parsed.has("hi_score"):
			hi_score = int(parsed["hi_score"])
