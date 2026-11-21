class_name QTEManager
extends Node

## QTE Manager
## Handles Stage 1C Katana Frenzy and Stage 3 Co-Op Finisher QTE trees.

signal katana_frenzy_success()
signal katana_frenzy_failed()
signal coop_finisher_success()
signal coop_finisher_failed()

@export var hud: HUD = null

func trigger_katana_frenzy(enemies_to_clear: Array) -> void:
	ScreenEffects.set_time_scale(0.2)
	ScreenEffects.screen_tint(Color(0.8, 0.0, 0.0), 0.45, 0.0)
	
	if hud:
		hud.show_qte_prompt("⚡ PRESS [X] ⚡")

	var success = await _poll_input("interact", 2.5)
	
	ScreenEffects.set_time_scale(1.0)
	ScreenEffects.screen_tint(Color(0.8, 0.0, 0.0), 0.0, 0.3)
	
	if hud:
		hud.hide_qte_prompt()

	if success:
		AudioManager.play_sfx("qte_success")
		ScreenEffects.hit_stop(80.0)
		for enemy in enemies_to_clear:
			if is_instance_valid(enemy) and enemy.has_method("die"):
				enemy.die()
		katana_frenzy_success.emit()
	else:
		katana_frenzy_failed.emit()

func trigger_coop_finisher(boss_node: Node) -> void:
	ScreenEffects.set_time_scale(0.3)
	if hud:
		hud.show_qte_prompt("⚡ PRESS [X] — CO-OP FINISHER ⚡")

	var success = await _poll_input("interact", 3.0)
	
	ScreenEffects.set_time_scale(1.0)
	if hud:
		hud.hide_qte_prompt()

	if success:
		AudioManager.play_sfx("qte_success")
		ScreenEffects.screen_shake(1.0, 0.8)
		if is_instance_valid(boss_node) and boss_node.has_method("die"):
			boss_node.die()
		coop_finisher_success.emit()
	else:
		if is_instance_valid(boss_node) and boss_node.has_method("heal"):
			boss_node.heal(30)
		coop_finisher_failed.emit()

func _poll_input(action_name: String, timeout_seconds: float) -> bool:
	var start_ms = Time.get_ticks_msec()
	var timeout_ms = int(timeout_seconds * 1000.0)

	while (Time.get_ticks_msec() - start_ms) < timeout_ms:
		if Input.is_action_just_pressed(action_name):
			return true
		await get_tree().process_frame

	return false
