class_name Stage1
extends Node2D

## Stage 1: Dusk Rooftops & Construction Cranes
## Directs progression through Section 1A -> 1B -> 1C -> Clear

enum Section { ENTRY_1A, CRANE_1B, QTE_1C, STAGE_CLEAR }

var current_section: Section = Section.ENTRY_1A

@onready var wave_spawner: WaveSpawner = $WaveSpawner if has_node("WaveSpawner") else null
@onready var qte_manager: QTEManager = $QTEManager if has_node("QTEManager") else null
@onready var hud: HUD = $HUD if has_node("HUD") else null
@onready var dialogue_box: DialogueBox = $DialogueBox if has_node("DialogueBox") else null

var spawned_enemies: Array = []

func _ready() -> void:
	GameManager.reset_stage_stats()
	AudioManager.play_bgm("stage_1_dusk")
	
	if wave_spawner:
		wave_spawner.all_waves_cleared.connect(_on_section_1a_cleared)
		wave_spawner.enemy_spawned.connect(func(e): spawned_enemies.append(e))

	_start_section_1a()

func _process(delta: float) -> void:
	if hud:
		var elapsed = (Time.get_ticks_msec() / 1000.0) - GameManager.stage_start_time
		hud.update_timer(elapsed)

func _start_section_1a() -> void:
	current_section = Section.ENTRY_1A
	
	var grunt_scene = load("res://scenes/enemies/street_grunt.gd")
	var pistol_scene = load("res://scenes/enemies/pistol_thug.gd")

	# Section 1A Wave progression
	var w1 = {"enemy_scene": _wrap_script(grunt_scene), "count": 3, "spawn_positions": [Vector2(320, 150)], "delay_between": 0.8}
	var w2 = {"enemy_scene": _wrap_script(pistol_scene), "count": 2, "spawn_positions": [Vector2(350, 150)], "delay_between": 1.0}
	var w3 = {"enemy_scene": _wrap_script(grunt_scene), "count": 4, "spawn_positions": [Vector2(20, 150), Vector2(360, 150)], "delay_between": 0.5}

	if wave_spawner:
		wave_spawner.waves = [w1, w2, w3]
		wave_spawner.start_waves()

func _wrap_script(script_ref: Script) -> PackedScene:
	# Utility to package GDScript classes dynamically if PackedScenes aren't pre-saved
	var node = CharacterBody2D.new()
	node.set_script(script_ref)
	var scene = PackedScene.new()
	scene.pack(node)
	return scene

func _on_section_1a_cleared() -> void:
	_start_section_1b()

func _start_section_1b() -> void:
	current_section = Section.CRANE_1B
	# Transition camera and platforming section
	var timer = get_tree().create_timer(3.0)
	timer.timeout.connect(_start_section_1c)

func _start_section_1c() -> void:
	current_section = Section.QTE_1C
	
	if dialogue_box:
		var lines: Array[String] = [
			"So you actually made it. Impressive for two amateurs.",
			"Let's see how you handle THIS..."
		]
		dialogue_box.show_dialogue("NOOBDA", lines, 2.5)
		await dialogue_box.dialogue_finished

	# Mob ambush
	var grunt_script = load("res://scenes/enemies/street_grunt.gd")
	var mob: Array = []
	for i in range(15):
		var grunt = CharacterBody2D.new()
		grunt.set_script(grunt_script)
		grunt.global_position = Vector2(randf_range(40, 340), 150)
		add_child(grunt)
		mob.append(grunt)

	if qte_manager:
		qte_manager.katana_frenzy_success.connect(_on_qte_success)
		qte_manager.trigger_katana_frenzy(mob)

func _on_qte_success() -> void:
	current_section = Section.STAGE_CLEAR
	GameManager.complete_stage()
	
	if hud:
		var rank = GameManager.get_rank(GameManager.score)
		hud.show_stage_clear_banner(rank)
