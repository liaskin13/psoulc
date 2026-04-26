import { supabase } from './supabase';

// Fetch all active (non-voided) tracks for a given vault
export async function fetchVaultTracks(vault) {
  const { data, error } = await supabase
    .from('tracks')
    .select('*')
    .eq('vault', vault)
    .eq('is_voided', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[PSC] fetchVaultTracks error:', error.message);
    return [];
  }
  return data;
}

// Upload an audio file + insert track record
// metadata: { vault, title, artist?, bpm?, frequency_hz?, uploaded_by }
export async function uploadTrack(file, metadata) {
  const ext = file.name.split('.').pop();
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const path = `${metadata.vault}/${filename}`;

  const { error: storageError } = await supabase.storage
    .from('audio')
    .upload(path, file, { contentType: file.type });

  if (storageError) throw new Error(storageError.message);

  const { data, error } = await supabase
    .from('tracks')
    .insert({
      vault:        metadata.vault,
      title:        metadata.title,
      artist:       metadata.artist || null,
      bpm:          metadata.bpm   || null,
      frequency_hz: metadata.frequency_hz || null,
      audio_path:   path,
      uploaded_by:  metadata.uploaded_by,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// Mark a track as voided (non-destructive — stays in DB)
export async function voidTrack(id) {
  const { error } = await supabase
    .from('tracks')
    .update({ is_voided: true })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

// Get the public URL for a stored audio file (synchronous)
export function getAudioUrl(audio_path) {
  if (!audio_path) return null;
  const { data } = supabase.storage.from('audio').getPublicUrl(audio_path);
  return data.publicUrl;
}
