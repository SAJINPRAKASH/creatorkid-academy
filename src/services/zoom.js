import { supabase } from './supabase.js';

/**
 * Fetch all live Zoom sessions and replays.
 */
export async function getZoomSessions() {
  const { data, error } = await supabase
    .from('zoom_sessions')
    .select('*')
    .order('meeting_date', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching Zoom sessions:', error.message);
    return [];
  }
  return data || [];
}

/**
 * Create a new Zoom meeting session (Admin only).
 */
export async function createZoomSession({ title, meeting_url, meeting_date, meeting_time, replay_url }) {
  const { data, error } = await supabase
    .from('zoom_sessions')
    .insert([{ title, meeting_url, meeting_date, meeting_time, replay_url }])
    .select()
    .single();

  if (error) {
    console.error('Error creating Zoom session:', error.message);
    throw error;
  }
  return data;
}

/**
 * Delete a Zoom session (Admin only).
 */
export async function deleteZoomSession(id) {
  const { error } = await supabase
    .from('zoom_sessions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting Zoom session:', error.message);
    throw error;
  }
  return true;
}
