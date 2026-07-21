import { requireAuth } from '../../services/auth.js';
import { getUserProgress, getLessonProgress, saveLessonProgress } from '../../services/progress.js';

// USER ACTION REQUIRED: Replace this with your actual Cloudflare R2 public bucket URL!
const R2_BUCKET_BASE_URL = 'https://pub-32ac0b4bfb23425ca4e042afb7c29c40.r2.dev';

const curriculumContainer = document.getElementById('curriculum');
const player = document.getElementById('main-player');
const videoTitle = document.getElementById('video-title');
const videoModule = document.getElementById('video-module');
const loadingOverlay = document.getElementById('loading-overlay');
const speedSelector = document.getElementById('speed-selector');
const lessonResourcesContainer = document.getElementById('lesson-resources');
const resourcesList = document.getElementById('resources-list');
const prevLessonBtn = document.getElementById('prev-lesson-btn');
const nextLessonBtn = document.getElementById('next-lesson-btn');

let currentActiveLessonItem = null;
let currentUserId = null;
let currentVideoFile = null;
let progressSaveInterval = null;

let flatLessonsList = [];
let currentIndex = -1;
let completedLessonsSet = new Set();

async function loadCourse() {
  // Session check & user ID (Phase 3 & 4)
  try {
    const auth = await requireAuth(['student', 'admin']);
    if (auth && auth.session) {
      currentUserId = auth.session.user.id;
      // Fetch user completed lessons set
      const userRecords = await getUserProgress(currentUserId);
      userRecords.forEach(r => {
        if (r.completed) completedLessonsSet.add(r.lesson_id);
      });
    }
  } catch (err) {
    console.warn('Authentication check notice:', err);
  }

  // Set up playback pitch preservation & saved speed rate (Phase 5 & 7)
  setupPlaybackSpeedControls();

  // Setup Previous & Next navigation button listeners (Phase 3)
  setupStepNavButtons();

  try {
    const response = await fetch('../../config/course.json');
    if (!response.ok) throw new Error('Network response was not ok');

    const courseData = await response.json();
    buildFlatLessonsList(courseData);
    renderCurriculum(courseData);

    // Auto-load first video if exists
    if (flatLessonsList.length > 0) {
      playLessonAtIndex(0);
    }
  } catch (error) {
    console.error('Failed to load course data:', error);
    curriculumContainer.innerHTML = '<div style="padding: 20px; color: red;">Failed to load curriculum. Ensure course.json exists.</div>';
  }
}

function setupPlaybackSpeedControls() {
  if (!player) return;

  // Preserve natural voice pitch across all speeds (Phase 5)
  if ('preservesPitch' in player) player.preservesPitch = true;
  if ('mozPreservesPitch' in player) player.mozPreservesPitch = true;
  if ('webkitPreservesPitch' in player) player.webkitPreservesPitch = true;

  // Restore saved playback speed from localStorage
  const savedSpeed = localStorage.getItem('ck_playback_speed') || '1';
  if (speedSelector) {
    speedSelector.value = savedSpeed;
    player.playbackRate = parseFloat(savedSpeed);

    speedSelector.addEventListener('change', (e) => {
      const newSpeed = parseFloat(e.target.value);
      player.playbackRate = newSpeed;
      localStorage.setItem('ck_playback_speed', newSpeed.toString());
      saveCurrentProgress();
    });
  }
}

function setupStepNavButtons() {
  if (prevLessonBtn) {
    prevLessonBtn.addEventListener('click', () => {
      if (currentIndex > 0) {
        playLessonAtIndex(currentIndex - 1);
      }
    });
  }

  if (nextLessonBtn) {
    nextLessonBtn.addEventListener('click', () => {
      if (currentIndex < flatLessonsList.length - 1) {
        playLessonAtIndex(currentIndex + 1);
      }
    });
  }
}

function buildFlatLessonsList(courseData) {
  flatLessonsList = [];
  courseData.forEach((module, moduleIdx) => {
    module.videos.forEach(video => {
      const videoFilename = typeof video === 'string' ? video : video.file;
      const displayTitle = videoFilename.replace(/\.mp4/g, '');

      flatLessonsList.push({
        moduleIndex: moduleIdx,
        moduleTitle: module.title,
        folder: module.folder,
        filename: videoFilename,
        displayTitle: displayTitle,
        resources: video.resources || null
      });
    });
  });
}

function renderCurriculum(data) {
  curriculumContainer.innerHTML = '';

  data.forEach((module, moduleIndex) => {
    // Header
    const header = document.createElement('div');
    header.className = 'module-header';
    header.innerHTML = `<span>Module ${module.id}: ${module.title}</span> <span class="toggle-icon">▼</span>`;

    // Body
    const body = document.createElement('div');
    body.className = `module-body ${moduleIndex === 0 ? 'open' : ''}`;

    // Videos
    module.videos.forEach(video => {
      const item = document.createElement('div');
      item.className = 'lesson-item';

      const videoFilename = typeof video === 'string' ? video : video.file;
      const displayTitle = videoFilename.replace(/\.mp4/g, '');
      const isCompleted = completedLessonsSet.has(videoFilename);

      item.dataset.filename = videoFilename;
      item.innerHTML = `
        <span>${escapeHtml(displayTitle)}</span>
        ${isCompleted ? '<span class="checkmark" title="Lesson Completed">✓</span>' : ''}
      `;

      item.addEventListener('click', () => {
        const foundIdx = flatLessonsList.findIndex(l => l.filename === videoFilename);
        if (foundIdx !== -1) {
          playLessonAtIndex(foundIdx);
        }
      });

      body.appendChild(item);
    });

    header.addEventListener('click', () => {
      const isOpen = body.classList.contains('open');
      document.querySelectorAll('.module-body').forEach(b => b.classList.remove('open'));
      if (!isOpen) {
        body.classList.add('open');
      }
    });

    curriculumContainer.appendChild(header);
    curriculumContainer.appendChild(body);
  });
}

function playLessonAtIndex(index) {
  if (index < 0 || index >= flatLessonsList.length) return;
  currentIndex = index;

  const lesson = flatLessonsList[index];

  // Update Sidebar Active Class
  document.querySelectorAll('.lesson-item').forEach(el => {
    if (el.dataset.filename === lesson.filename) {
      el.classList.add('active');
      currentActiveLessonItem = el;

      // Auto expand module accordion
      const parentBody = el.parentElement;
      if (parentBody && !parentBody.classList.contains('open')) {
        document.querySelectorAll('.module-body').forEach(b => b.classList.remove('open'));
        parentBody.classList.add('open');
      }
    } else {
      el.classList.remove('active');
    }
  });

  // Update Nav Buttons State
  if (prevLessonBtn) prevLessonBtn.disabled = (currentIndex === 0);
  if (nextLessonBtn) nextLessonBtn.disabled = (currentIndex === flatLessonsList.length - 1);

  loadVideo(lesson.folder, lesson.filename, lesson.moduleTitle, lesson.displayTitle, lesson.resources);
}

async function loadVideo(folder, filename, moduleName, displayTitle, resources = null) {
  currentVideoFile = filename;

  // Construct Cloudflare R2 URL dynamically (Phase 4)
  const encodedFolder = folder.split('/').map(part => encodeURIComponent(part)).join('/');
  const encodedFile = encodeURIComponent(filename);
  const baseUrl = R2_BUCKET_BASE_URL.endsWith('/') ? R2_BUCKET_BASE_URL : R2_BUCKET_BASE_URL + '/';
  const videoUrl = `${baseUrl}${encodedFolder}/${encodedFile}`;

  loadingOverlay.style.display = 'flex';
  player.src = videoUrl;
  videoTitle.innerText = displayTitle;
  videoModule.innerText = `Module: ${moduleName}`;

  // Apply active playback speed rate (Phase 5)
  const activeSpeed = parseFloat(localStorage.getItem('ck_playback_speed') || '1');
  player.playbackRate = activeSpeed;

  player.load();

  // Handle Lesson Resources / Downloads (Phase 11)
  renderResources(resources, displayTitle);

  // Restore saved position from Supabase (Phase 7)
  if (currentUserId && currentVideoFile) {
    try {
      const record = await getLessonProgress(currentUserId, currentVideoFile);
      if (record && record.current_time > 0 && !record.completed) {
        player.currentTime = record.current_time;
      }
    } catch (e) {
      console.warn('Could not restore saved position:', e);
    }
  }

  player.play().catch(e => {
    console.log('Autoplay handled by browser.', e);
    loadingOverlay.style.display = 'none';
  });

  player.onloadeddata = () => {
    loadingOverlay.style.display = 'none';
  };

  player.onerror = () => {
    loadingOverlay.style.display = 'none';
    console.error('Video failed to load: ', videoUrl);
  };

  // Start 10-second progress auto-save timer (Phase 6)
  startProgressAutoSaveTimer();
}

function renderResources(resources, lessonName) {
  if (!lessonResourcesContainer || !resourcesList) return;

  if (resources && resources.length > 0) {
    resourcesList.innerHTML = resources.map(res => `
      <a href="${res.url}" target="_blank" download class="resource-btn">
        📄 ${escapeHtml(res.name || res.type || 'Attachment')}
      </a>
    `).join('');
    lessonResourcesContainer.style.display = 'block';
  } else {
    // Hide empty downloads section (Phase 11)
    lessonResourcesContainer.style.display = 'none';
    resourcesList.innerHTML = '';
  }
}

function startProgressAutoSaveTimer() {
  if (progressSaveInterval) clearInterval(progressSaveInterval);

  // Save progress every 10 seconds (Phase 6)
  progressSaveInterval = setInterval(() => {
    if (!player.paused && !player.ended) {
      saveCurrentProgress();
    }
  }, 10000);
}

function saveCurrentProgress() {
  if (!currentUserId || !currentVideoFile || !player.duration) return;

  const currentTime = player.currentTime;
  const duration = player.duration;
  const watchedPercentage = Math.round((currentTime / duration) * 100);
  
  // Phase 8: Automatically mark completed when watchedPercentage >= 95%
  const completed = watchedPercentage >= 95;

  if (completed) {
    markLessonCompletedInUI(currentVideoFile);
  }

  saveLessonProgress({
    userId: currentUserId,
    lessonId: currentVideoFile,
    currentTime,
    watchedPercentage,
    playbackSpeed: player.playbackRate || 1,
    completed
  });
}

function markLessonCompletedInUI(filename) {
  completedLessonsSet.add(filename);

  const itemElem = document.querySelector(`.lesson-item[data-filename="${filename}"]`);
  if (itemElem && !itemElem.querySelector('.checkmark')) {
    const checkSpan = document.createElement('span');
    checkSpan.className = 'checkmark';
    checkSpan.title = 'Lesson Completed';
    checkSpan.textContent = '✓';
    itemElem.appendChild(checkSpan);
  }
}

// Auto-advance to next lesson when video reaches end
player.addEventListener('ended', () => {
  if (currentUserId && currentVideoFile) {
    markLessonCompletedInUI(currentVideoFile);
    saveLessonProgress({
      userId: currentUserId,
      lessonId: currentVideoFile,
      currentTime: player.duration || 0,
      watchedPercentage: 100,
      playbackSpeed: player.playbackRate || 1,
      completed: true
    });
  }

  // Auto-play Next Lesson sequentially if available
  if (currentIndex < flatLessonsList.length - 1) {
    setTimeout(() => playLessonAtIndex(currentIndex + 1), 1500);
  }
});

// Prevent native controls interference
player.addEventListener('keydown', (e) => {
  if (['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
    e.preventDefault();
  }
});

// Keyboard Controls (Space, Left/Right Seek, Up/Down Volume)
document.addEventListener('keydown', (e) => {
  if (!player) return;
  if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT' || document.activeElement.tagName === 'TEXTAREA')) return;

  switch(e.code) {
    case 'Space':
      e.preventDefault();
      player.paused ? player.play() : player.pause();
      break;
    case 'ArrowLeft':
      e.preventDefault();
      player.currentTime = Math.max(0, player.currentTime - 10);
      break;
    case 'ArrowRight':
      e.preventDefault();
      player.currentTime = Math.min(player.duration || 0, player.currentTime + 10);
      break;
    case 'ArrowUp':
      e.preventDefault();
      player.volume = Math.min(1, player.volume + 0.1);
      break;
    case 'ArrowDown':
      e.preventDefault();
      player.volume = Math.max(0, player.volume - 0.1);
      break;
  }
});

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

document.addEventListener('DOMContentLoaded', loadCourse);
