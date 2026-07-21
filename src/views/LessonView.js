import { requireAuth } from '../services/auth.js';
import { getUserProgress, getLessonProgress, saveLessonProgress } from '../services/progress.js';
import courseDataJson from '../config/course.json';
import '../styles/lesson.css';

const R2_BUCKET_BASE_URL = 'https://pub-32ac0b4bfb23425ca4e042afb7c29c40.r2.dev';

export async function render(container, { params, router }) {
  let currentUserId = null;
  let currentVideoFile = null;
  let progressSaveInterval = null;
  let flatLessonsList = [];
  let currentIndex = -1;
  let completedLessonsSet = new Set();
  let keydownHandler = null;

  container.innerHTML = `
    <!-- Minimal Navbar for App Feel -->
    <nav class="navbar" style="height: 60px; padding: 0;">
      <div class="container" style="display: flex; justify-content: space-between; align-items: center; height: 100%;">
        <a href="/dashboard" class="logo" style="display: flex; align-items: center; gap: 10px; color: var(--color-text-muted); transition: color 0.2s;">
          <span style="font-size: 1.2rem;">←</span>
          <span style="font-weight: 500;">Back to Dashboard</span>
        </a>
        <div style="font-weight: 600; color: var(--color-text); letter-spacing: 0.5px;">Photoshop Masterclass</div>
      </div>
    </nav>

    <main class="lesson-container">
      <div class="video-section">
        <div class="player-wrapper">
          <video id="main-player" controls>
            <source src="" type="video/mp4" id="video-source">
            Your browser does not support HTML5 video.
          </video>
          <div id="loading-overlay" class="loading-overlay" style="display: none;">
            <div class="spinner"></div>
          </div>
        </div>

        <div class="video-info">
          <div class="video-info-header">
            <div>
              <h1 id="video-title">Welcome to CreatorKid Photoshop</h1>
              <p id="video-module" style="color: var(--color-text-muted);">Select a lesson from the curriculum sidebar to begin learning.</p>
            </div>
            <div class="player-header-controls">
              <div class="speed-control-wrapper">
                <label for="speed-selector" class="speed-label">Speed:</label>
                <select id="speed-selector" class="speed-select">
                  <option value="0.25">0.25x</option>
                  <option value="0.5">0.5x</option>
                  <option value="0.75">0.75x</option>
                  <option value="1" selected>1.0x (Normal)</option>
                  <option value="1.25">1.25x</option>
                  <option value="1.5">1.5x</option>
                  <option value="1.75">1.75x</option>
                  <option value="2">2.0x</option>
                </select>
              </div>

              <!-- Previous & Next Lesson Navigation Buttons -->
              <div class="lesson-nav-buttons">
                <button id="prev-lesson-btn" class="nav-step-btn" disabled>← Prev</button>
                <button id="next-lesson-btn" class="nav-step-btn primary">Next →</button>
              </div>
            </div>
          </div>

          <!-- Downloadable Lesson Resources -->
          <div id="lesson-resources" class="lesson-resources" style="display: none;">
            <h4>📁 Lesson Downloads & Attachments</h4>
            <div id="resources-list" class="resources-list">
              <!-- JS populated if attachments exist -->
            </div>
          </div>
        </div>
      </div>

      <aside class="sidebar-section">
        <div class="sidebar-header">
          <h3>Course Curriculum</h3>
        </div>
        <div class="accordion-container" id="curriculum">
          <!-- JS populates this -->
        </div>
      </aside>
    </main>
  `;

  const curriculumContainer = container.querySelector('#curriculum');
  const player = container.querySelector('#main-player');
  const videoTitle = container.querySelector('#video-title');
  const videoModule = container.querySelector('#video-module');
  const loadingOverlay = container.querySelector('#loading-overlay');
  const speedSelector = container.querySelector('#speed-selector');
  const lessonResourcesContainer = container.querySelector('#lesson-resources');
  const resourcesList = container.querySelector('#resources-list');
  const prevLessonBtn = container.querySelector('#prev-lesson-btn');
  const nextLessonBtn = container.querySelector('#next-lesson-btn');

  // Require Auth
  try {
    const auth = await requireAuth(['student', 'admin']);
    if (auth && auth.session) {
      currentUserId = auth.session.user.id;
      const userRecords = await getUserProgress(currentUserId);
      userRecords.forEach(r => {
        if (r.completed) completedLessonsSet.add(r.lesson_id);
      });
    }
  } catch (err) {
    console.warn('Auth check notice:', err);
  }

  setupPlaybackSpeedControls();
  setupStepNavButtons();

  const courseData = courseDataJson;
  buildFlatLessonsList(courseData);
  renderCurriculum(courseData);

  // Auto load lesson index based on route params or default to 0
  let targetIndex = 0;
  if (params && params.module !== undefined && params.lesson !== undefined) {
    const modIdx = parseInt(params.module, 10);
    const lesIdx = parseInt(params.lesson, 10);
    const foundIdx = flatLessonsList.findIndex(l => l.moduleIndex === modIdx && l.lessonIndex === lesIdx);
    if (foundIdx !== -1) targetIndex = foundIdx;
  }

  if (flatLessonsList.length > 0) {
    playLessonAtIndex(targetIndex);
  }

  // Keyboard Shortcuts Setup
  keydownHandler = (e) => {
    if (!player) return;
    if (document.activeElement && ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

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
  };
  document.addEventListener('keydown', keydownHandler);

  // Player Ended Event
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

    if (currentIndex < flatLessonsList.length - 1) {
      setTimeout(() => playLessonAtIndex(currentIndex + 1), 1500);
    }
  });

  function setupPlaybackSpeedControls() {
    if (!player) return;

    if ('preservesPitch' in player) player.preservesPitch = true;
    if ('mozPreservesPitch' in player) player.mozPreservesPitch = true;
    if ('webkitPreservesPitch' in player) player.webkitPreservesPitch = true;

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

  function buildFlatLessonsList(data) {
    flatLessonsList = [];
    data.forEach((module, moduleIdx) => {
      module.videos.forEach((video, lessonIdx) => {
        const videoFilename = typeof video === 'string' ? video : video.file;
        const displayTitle = videoFilename.replace(/\.mp4/g, '');

        flatLessonsList.push({
          moduleIndex: moduleIdx,
          lessonIndex: lessonIdx,
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
      const header = document.createElement('div');
      header.className = 'module-header';
      header.innerHTML = `<span>Module ${module.id}: ${module.title}</span> <span class="toggle-icon">▼</span>`;

      const body = document.createElement('div');
      body.className = `module-body ${moduleIndex === 0 ? 'open' : ''}`;

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
        container.querySelectorAll('.module-body').forEach(b => b.classList.remove('open'));
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

    // Highlight Sidebar Item
    container.querySelectorAll('.lesson-item').forEach(el => {
      if (el.dataset.filename === lesson.filename) {
        el.classList.add('active');

        const parentBody = el.parentElement;
        if (parentBody && !parentBody.classList.contains('open')) {
          container.querySelectorAll('.module-body').forEach(b => b.classList.remove('open'));
          parentBody.classList.add('open');
        }
      } else {
        el.classList.remove('active');
      }
    });

    if (prevLessonBtn) prevLessonBtn.disabled = (currentIndex === 0);
    if (nextLessonBtn) nextLessonBtn.disabled = (currentIndex === flatLessonsList.length - 1);

    loadVideo(lesson.folder, lesson.filename, lesson.moduleTitle, lesson.displayTitle, lesson.resources);
  }

  async function loadVideo(folder, filename, moduleName, displayTitle, resources = null) {
    currentVideoFile = filename;

    const encodedFolder = folder.split('/').map(part => encodeURIComponent(part)).join('/');
    const encodedFile = encodeURIComponent(filename);
    const baseUrl = R2_BUCKET_BASE_URL.endsWith('/') ? R2_BUCKET_BASE_URL : R2_BUCKET_BASE_URL + '/';
    const videoUrl = `${baseUrl}${encodedFolder}/${encodedFile}`;

    loadingOverlay.style.display = 'flex';
    player.src = videoUrl;
    videoTitle.innerText = displayTitle;
    videoModule.innerText = `Module: ${moduleName}`;

    const activeSpeed = parseFloat(localStorage.getItem('ck_playback_speed') || '1');
    player.playbackRate = activeSpeed;

    player.load();
    renderResources(resources);

    if (currentUserId && currentVideoFile) {
      try {
        const record = await getLessonProgress(currentUserId, currentVideoFile);
        if (record && record.current_time > 0 && !record.completed) {
          player.currentTime = record.current_time;
        }
      } catch (e) {
        console.warn('Could not restore position:', e);
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

    startProgressAutoSaveTimer();
  }

  function renderResources(resources) {
    if (!lessonResourcesContainer || !resourcesList) return;

    if (resources && resources.length > 0) {
      resourcesList.innerHTML = resources.map(res => `
        <a href="${res.url}" target="_blank" download class="resource-btn">
          📄 ${escapeHtml(res.name || res.type || 'Attachment')}
        </a>
      `).join('');
      lessonResourcesContainer.style.display = 'block';
    } else {
      lessonResourcesContainer.style.display = 'none';
      resourcesList.innerHTML = '';
    }
  }

  function startProgressAutoSaveTimer() {
    if (progressSaveInterval) clearInterval(progressSaveInterval);

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

    const itemElem = container.querySelector(`.lesson-item[data-filename="${filename}"]`);
    if (itemElem && !itemElem.querySelector('.checkmark')) {
      const checkSpan = document.createElement('span');
      checkSpan.className = 'checkmark';
      checkSpan.title = 'Lesson Completed';
      checkSpan.textContent = '✓';
      itemElem.appendChild(checkSpan);
    }
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Cleanup on View Unmount
  return () => {
    if (progressSaveInterval) clearInterval(progressSaveInterval);
    if (keydownHandler) document.removeEventListener('keydown', keydownHandler);
    if (player) {
      player.pause();
      player.src = '';
    }
  };
}
