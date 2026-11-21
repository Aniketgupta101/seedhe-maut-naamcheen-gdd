extends Node

## AudioManager Singleton
## SFX pooling, dynamic BGM crossfading, and audio triggers.

var sfx_players: Array[AudioStreamPlayer] = []
var max_sfx_voices: int = 8
var current_sfx_index: int = 0

var bgm_player_a: AudioStreamPlayer
var bgm_player_b: AudioStreamPlayer
var active_bgm_player: AudioStreamPlayer

var cached_streams: Dictionary = {}

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	
	for i in range(max_sfx_voices):
		var p = AudioStreamPlayer.new()
		add_child(p)
		sfx_players.append(p)
		
	bgm_player_a = AudioStreamPlayer.new()
	bgm_player_b = AudioStreamPlayer.new()
	add_child(bgm_player_a)
	add_child(bgm_player_b)
	active_bgm_player = bgm_player_a
	
	_preload_audio()

func _preload_audio() -> void:
	var sfx_keys = [
		"katana_light", "katana_finisher", "smg_burst", 
		"minigun_fire", "explosion", "boss_slam", "qte_success"
	]
	for key in sfx_keys:
		var path = "res://assets/audio/%s.ogg" % key
		if ResourceLoader.exists(path):
			cached_streams[key] = load(path)

func play_sfx(sfx_name: String) -> void:
	var stream: AudioStream = null
	if cached_streams.has(sfx_name):
		stream = cached_streams[sfx_name]
	else:
		var path = "res://assets/audio/%s.ogg" % sfx_name
		if ResourceLoader.exists(path):
			stream = load(path)
			cached_streams[sfx_name] = stream
			
	if not stream:
		return
		
	var player = sfx_players[current_sfx_index]
	current_sfx_index = (current_sfx_index + 1) % max_sfx_voices
	player.stream = stream
	player.play()

func play_bgm(track_name: String, fade_in: float = 1.0) -> void:
	var path = "res://assets/audio/%s.ogg" % track_name
	if not ResourceLoader.exists(path):
		return
	var stream = load(path)
	
	var next_player = bgm_player_b if active_bgm_player == bgm_player_a else bgm_player_a
	next_player.stream = stream
	next_player.volume_db = -80.0
	next_player.play()
	
	var tween = create_tween()
	tween.tween_property(active_bgm_player, "volume_db", -80.0, fade_in)
	tween.parallel().tween_property(next_player, "volume_db", 0.0, fade_in)
	tween.tween_callback(active_bgm_player.stop)
	
	active_bgm_player = next_player

func stop_bgm(fade_out: float = 1.0) -> void:
	if active_bgm_player.playing:
		var tween = create_tween()
		tween.tween_property(active_bgm_player, "volume_db", -80.0, fade_out)
		tween.tween_callback(active_bgm_player.stop)
