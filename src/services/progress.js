import { supabase } from './supabase.js';

/**
 * Fetch all progress records for a student.
 */
export async function getUserProgress(userId) {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('progress')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching progress:', error.message);
    return [];
  }
  return data || [];
}

/**
 * Get progress for a specific lesson.
 */
export async function getLessonProgress(userId, lessonId) {
  if (!userId || !lessonId) return null;
  const { data, error } = await supabase
    .from('progress')
    .select('*')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching lesson progress:', error.message);
  }
  return data || null;
}

/**
 * Save or update video lesson progress.
 */
export async function saveLessonProgress({ userId, lessonId, currentTime = 0, watchedPercentage = 0, playbackSpeed = 1, completed = false }) {
  if (!userId || !lessonId) return null;

  const payload = {
    user_id: userId,
    lesson_id: lessonId,
    current_time: currentTime,
    watched_percentage: watchedPercentage,
    playback_speed: playbackSpeed,
    completed: completed,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('progress')
    .upsert(payload, { onConflict: 'user_id,lesson_id' })
    .select()
    .single();

  if (error) {
    console.error('Error saving progress:', error.message);
  }
  return data;
}
