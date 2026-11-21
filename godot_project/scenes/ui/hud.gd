class_name HUD
extends CanvasLayer

## HUD Controller
## Displays portraits, angled HP bars, special meters, combo counter, stage timer, and boss bars.

var p1_hp_bar: ProgressBar
var p1_special_bar: ProgressBar
var p1_weapon_label: Label
var combo_label: Label
var timer_label: Label
var boss_hp_bar: ProgressBar
var boss_name_label: Label
var qte_prompt_label: Label

var combo_fade_tween: Tween

func _ready() -> void:
	_build_ui()
	
	if has_node("/root/ComboManager"):
		ComboManager.combo_updated.connect(update_combo)
		ComboManager.combo_broken.connect(_on_combo_broken)

func _build_ui() -> void:
	# P1 Panel (Top Left)
	var p1_container = VBoxContainer.new()
	p1_container.position = Vector2(8, 8)
	add_child(p1_container)

	p1_weapon_label = Label.new()
	p1_weapon_label.text = "CALM [Katana]"
	p1_container.add_child(p1_weapon_label)

	p1_hp_bar = ProgressBar.new()
	p1_hp_bar.custom_minimum_size = Vector2(80, 8)
	p1_hp_bar.max_value = 100
	p1_hp_bar.value = 100
	p1_hp_bar.show_percentage = false
	p1_container.add_child(p1_hp_bar)

	p1_special_bar = ProgressBar.new()
	p1_special_bar.custom_minimum_size = Vector2(80, 4)
	p1_special_bar.max_value = 100
	p1_special_bar.value = 0
	p1_special_bar.show_percentage = false
	p1_container.add_child(p1_special_bar)

	# Combo & Timer (Top Center)
	var center_box = VBoxContainer.new()
	center_box.set_anchors_and_offsets_preset(Control.PRESET_CENTER_TOP)
	center_box.position.y = 8
	add_child(center_box)

	timer_label = Label.new()
	timer_label.text = "00:00"
	timer_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	center_box.add_child(timer_label)

	combo_label = Label.new()
	combo_label.text = ""
	combo_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	center_box.add_child(combo_label)

	# Boss Bar (Top Center, below timer)
	boss_name_label = Label.new()
	boss_name_label.text = "☠ MUTANT NOOBDA"
	boss_name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	boss_name_label.visible = false
	center_box.add_child(boss_name_label)

	boss_hp_bar = ProgressBar.new()
	boss_hp_bar.custom_minimum_size = Vector2(160, 6)
	boss_hp_bar.show_percentage = false
	boss_hp_bar.visible = false
	center_box.add_child(boss_hp_bar)

	# QTE Center Prompt
	qte_prompt_label = Label.new()
	qte_prompt_label.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	qte_prompt_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	qte_prompt_label.visible = false
	add_child(qte_prompt_label)

func update_p1_hp(val: int) -> void:
	if p1_hp_bar:
		create_tween().tween_property(p1_hp_bar, "value", val, 0.1)

func update_p1_special(val: float) -> void:
	if p1_special_bar:
		p1_special_bar.value = val

func update_p1_weapon(weapon_name: String) -> void:
	if p1_weapon_label:
		p1_weapon_label.text = weapon_name

func update_combo(count: int) -> void:
	if not combo_label:
		return
	if combo_fade_tween and combo_fade_tween.is_valid():
		combo_fade_tween.kill()
		
	combo_label.modulate.a = 1.0
	combo_label.text = "%dx HIT!" % count
	
	# Pop scale effect
	var tween = create_tween()
	tween.tween_property(combo_label, "scale", Vector2(1.25, 1.25), 0.08)
	tween.tween_property(combo_label, "scale", Vector2(1.0, 1.0), 0.08)

func _on_combo_broken(_final_count: int) -> void:
	if not combo_label:
		return
	combo_fade_tween = create_tween()
	combo_fade_tween.tween_property(combo_label, "modulate:a", 0.0, 0.4)
	combo_fade_tween.tween_callback(func(): combo_label.text = "")

func update_timer(seconds: float) -> void:
	if timer_label:
		var mins = int(seconds) / 60
		var secs = int(seconds) % 60
		timer_label.text = "%02d:%02d" % [mins, secs]

func show_boss_bar(boss_name: String, max_hp: int) -> void:
	boss_name_label.text = boss_name
	boss_name_label.visible = true
	boss_hp_bar.max_value = max_hp
	boss_hp_bar.value = max_hp
	boss_hp_bar.visible = true

func update_boss_hp(val: int) -> void:
	if boss_hp_bar:
		create_tween().tween_property(boss_hp_bar, "value", val, 0.1)

func show_qte_prompt(text: String) -> void:
	qte_prompt_label.text = text
	qte_prompt_label.visible = true

func hide_qte_prompt() -> void:
	qte_prompt_label.visible = false

func show_stage_clear_banner(rank: String) -> void:
	var banner = Label.new()
	banner.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	banner.text = "★ STAGE CLEAR ★\nRANK: %s" % rank
	banner.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(banner)
