import { supabase } from './supabase.js';

/**
 * Fetch all announcements ordered by pinned status and creation date.
 */
export async function getAnnouncements() {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching announcements:', error.message);
    return [];
  }
  return data || [];
}

/**
 * Create a new announcement (Admin only).
 */
export async function createAnnouncement({ title, message, pinned = false }) {
  const { data, error } = await supabase
    .from('announcements')
    .insert([{ title, message, pinned }])
    .select()
    .single();

  if (error) {
    console.error('Error creating announcement:', error.message);
    throw error;
  }
  return data;
}

/**
 * Delete an announcement (Admin only).
 */
export async function deleteAnnouncement(id) {
  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting announcement:', error.message);
    throw error;
  }
  return true;
}
