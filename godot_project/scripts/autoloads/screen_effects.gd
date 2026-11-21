extends Node

## ScreenEffects Singleton
## Controls camera trauma screen shake, hit-stop time scale manipulation, and screen tint overlays.

var camera: Camera2D = null
var trauma: float = 0.0
var trauma_decay: float = 1.0
var max_offset: Vector2 = Vector2(8.0, 8.0)
var max_roll: float = 0.05

var tint_canvas: CanvasLayer
var tint_rect: ColorRect

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	
	# Setup screen tint overlay
	tint_canvas = CanvasLayer.new()
	tint_canvas.layer = 100
	add_child(tint_canvas)
	
	tint_rect = ColorRect.new()
	tint_rect.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	tint_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	tint_rect.color = Color(1, 1, 1, 0)
	tint_canvas.add_child(tint_rect)

func register_camera(p_cam: Camera2D) -> void:
	camera = p_cam

func _process(delta: float) -> void:
	if trauma > 0.0:
		trauma = max(0.0, trauma - (trauma_decay * delta))
		_apply_shake()

func screen_shake(amount: float, duration: float = 0.3) -> void:
	trauma = clamp(trauma + amount, 0.0, 1.0)
	trauma_decay = 1.0 / max(0.01, duration)

func _apply_shake() -> void:
	if not camera:
		return
	var shake_amount = trauma * trauma
	camera.offset = Vector2(
		max_offset.x * shake_amount * randf_range(-1.0, 1.0),
		max_offset.y * shake_amount * randf_range(-1.0, 1.0)
	)
	camera.rotation = max_roll * shake_amount * randf_range(-1.0, 1.0)

func hit_stop(duration_ms: float) -> void:
	if duration_ms <= 0:
		return
	Engine.time_scale = 0.0
	var timer = get_tree().create_timer(duration_ms / 1000.0, true, false, true)
	timer.timeout.connect(func(): Engine.time_scale = 1.0)

func set_time_scale(scale: float, duration: float = -1.0) -> void:
	Engine.time_scale = scale
	if duration > 0.0:
		var timer = get_tree().create_timer(duration, true, false, true)
		timer.timeout.connect(func(): Engine.time_scale = 1.0)

func screen_tint(color: Color, alpha: float, fade_out: float = 0.5) -> void:
	var target_color = Color(color.r, color.g, color.b, alpha)
	var tween = create_tween().set_pause_mode(Tween.TWEEN_PAUSE_PROCESS)
	tween.tween_property(tint_rect, "color", target_color, 0.05)
	if fade_out > 0.0:
		tween.tween_property(tint_rect, "color", Color(color.r, color.g, color.b, 0.0), fade_out)

# Specific GDD feel triggers
func hit_stop_katana_finisher() -> void:
	hit_stop(40.0)

func hit_stop_barrel() -> void:
	hit_stop(70.0)

func shake_minigun() -> void:
	screen_shake(0.35, 0.15)

func shake_missile() -> void:
	screen_shake(0.75, 0.35)

func shake_boss_slam() -> void:
	screen_shake(1.0, 0.5)
