class_name DialogueBox
extends CanvasLayer

## Dialogue Box
## Retro RPG/brawler style typewriter dialogue popup.

signal dialogue_finished()

var panel: Panel
var name_label: Label
var dialogue_label: Label
var is_active: bool = false

func _ready() -> void:
	panel = Panel.new()
	panel.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_WIDE)
	panel.custom_minimum_size = Vector2(360, 50)
	panel.position.y -= 8
	panel.visible = false
	add_child(panel)

	var vbox = VBoxContainer.new()
	vbox.position = Vector2(10, 6)
	panel.add_child(vbox)

	name_label = Label.new()
	name_label.text = ""
	vbox.add_child(name_label)

	dialogue_label = Label.new()
	dialogue_label.text = ""
	dialogue_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	dialogue_label.custom_minimum_size = Vector2(340, 25)
	vbox.add_child(dialogue_label)

func show_dialogue(speaker: String, lines: Array[String], auto_advance: float = 3.0) -> void:
	panel.visible = true
	name_label.text = speaker
	is_active = true

	for line in lines:
		dialogue_label.text = ""
		for i in range(line.length()):
			dialogue_label.text += line[i]
			await get_tree().create_timer(0.025).timeout
			
		await get_tree().create_timer(auto_advance).timeout

	panel.visible = false
	is_active = false
	dialogue_finished.emit()
