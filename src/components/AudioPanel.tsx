import { useEffect, useMemo, useRef, useState } from 'react'
import { Box, Divider, Drawer, FormControl, IconButton, InputLabel, List, ListItemButton, ListItemIcon, ListItemText, MenuItem, Select, Slider, Stack, Tooltip, Typography, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CloseIcon from '@mui/icons-material/Close'
import PauseIcon from '@mui/icons-material/Pause'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import type { AudioTrack } from '../models/audio'
import { getAudioTracks } from '../services/audioService'

type Props = { bookTitle: string; onClose: () => void }

const formatTime = (seconds: number) => Number.isFinite(seconds) ? `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}` : '0:00'

export default function AudioPanel({ bookTitle, onClose }: Props) {
  const theme = useTheme()
  const compact = useMediaQuery(theme.breakpoints.down('sm'))
  const tracks = useMemo(() => getAudioTracks(bookTitle), [bookTitle])
  const units = useMemo(() => [...new Set(tracks.map((track) => track.unit))], [tracks])
  const [unit, setUnit] = useState(units[0] ?? '')
  const [selectedTrack, setSelectedTrack] = useState<AudioTrack | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [rate, setRate] = useState(1)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const unitTracks = tracks.filter((track) => track.unit === unit)

  useEffect(() => { setUnit(units[0] ?? ''); setSelectedTrack(null) }, [bookTitle, units])
  useEffect(() => { const audio = audioRef.current; if (audio) { audio.volume = volume; audio.playbackRate = rate } }, [volume, rate, selectedTrack])

  const selectTrack = (track: AudioTrack) => { setSelectedTrack(track); setCurrentTime(0); setDuration(0); setIsPlaying(true) }
  const togglePlayback = async () => { const audio = audioRef.current; if (!audio || !selectedTrack) return; if (audio.paused) await audio.play(); else audio.pause() }

  return (
    <Drawer variant="persistent" open anchor={compact ? 'bottom' : 'right'} onClose={onClose} slotProps={{ paper: { sx: { width: compact ? '100%' : 360, height: compact ? '62dvh' : '100%', display: 'flex', borderTopLeftRadius: compact ? 16 : 0, borderTopRightRadius: compact ? 16 : 0 } } }}>
      <Stack sx={{ height: '100%' }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box><Typography variant="h6">Audio</Typography><Typography variant="caption" color="text.secondary">{bookTitle}</Typography></Box>
          <IconButton onClick={onClose} aria-label="Close audio menu"><CloseIcon /></IconButton>
        </Box>
        <Divider />
        {units.length ? <>
          <FormControl size="small" sx={{ m: 2 }}><InputLabel id="audio-unit-label">Unit</InputLabel><Select labelId="audio-unit-label" label="Unit" value={unit} onChange={(event) => setUnit(event.target.value)} MenuProps={{ disablePortal: true }}>{units.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</Select></FormControl>
          <List dense disablePadding sx={{ flex: 1, overflowY: 'auto', px: 1 }}>
            {unitTracks.map((track) => <ListItemButton key={track.id} selected={selectedTrack?.id === track.id} onClick={() => selectTrack(track)} sx={{ borderRadius: 1 }}><ListItemIcon sx={{ minWidth: 32 }}><PlayArrowIcon fontSize="small" /></ListItemIcon><ListItemText primary={<Typography variant="body2" noWrap>{track.title}</Typography>} /></ListItemButton>)}
          </List>
        </> : <Typography color="text.secondary" sx={{ p: 2 }}>No audio files found for this book.</Typography>}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', mb: 1 }}>{selectedTrack?.title ?? 'Select an audio track'}</Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><Typography variant="caption">{formatTime(currentTime)}</Typography><Slider size="small" min={0} max={duration || 0} step={0.1} value={currentTime} disabled={!selectedTrack} onChange={(_, value) => { const time = value as number; if (audioRef.current) audioRef.current.currentTime = time; setCurrentTime(time) }} /><Typography variant="caption">{formatTime(duration)}</Typography></Stack>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mt: 1 }}><Tooltip title={isPlaying ? 'Pause' : 'Play'}><span><IconButton color="primary" onClick={togglePlayback} disabled={!selectedTrack}>{isPlaying ? <PauseIcon /> : <PlayArrowIcon />}</IconButton></span></Tooltip><FormControl size="small" sx={{ minWidth: 80 }}><Select value={rate} onChange={(event) => setRate(Number(event.target.value))} MenuProps={{ disablePortal: true }}>{[0.5, 0.75, 1, 1.25, 1.5, 2].map((value) => <MenuItem key={value} value={value}>{value}x</MenuItem>)}</Select></FormControl><VolumeUpIcon fontSize="small" /><Slider size="small" min={0} max={1} step={0.05} value={volume} onChange={(_, value) => setVolume(value as number)} sx={{ flex: 1 }} /></Stack>
          <audio ref={audioRef} src={selectedTrack?.url} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)} onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)} onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)} autoPlay={isPlaying} />
        </Box>
      </Stack>
    </Drawer>
  )
}
