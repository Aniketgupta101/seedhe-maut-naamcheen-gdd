class_name ParallaxManager
extends Node2D

## Parallax Manager
## 5-layer parallax setup with GDD-specified scroll speeds.

@export var camera_node: Camera2D = null
@export var is_auto_scrolling: bool = false
@export var auto_scroll_speed: float = 240.0

var layers: Array[ParallaxLayer] = []
var speeds: Array[float] = [0.1, 0.3, 0.6, 1.0, 1.2]

func _ready() -> void:
	var p_bg = ParallaxBackground.new()
	add_child(p_bg)

	for i in range(speeds.size()):
		var layer = ParallaxLayer.new()
		layer.motion_scale = Vector2(speeds[i], 1.0)
		layer.motion_mirroring = Vector2(768.0, 0.0)
		p_bg.add_child(layer)
		layers.append(layer)

func _process(delta: float) -> void:
	if is_auto_scrolling:
		for i in range(layers.size()):
			layers[i].motion_offset.x -= auto_scroll_speed * speeds[i] * delta

func set_auto_scroll(speed: float) -> void:
	is_auto_scrolling = true
	auto_scroll_speed = speed
