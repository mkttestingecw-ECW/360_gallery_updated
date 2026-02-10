const images = [
    { src: "images/img1.jpg" }, { src: "images/img2.jpg" },
    { src: "images/img3.jpg" }, { src: "images/img4.jpg" },
    { src: "images/img5.jpg" }, { src: "images/img6.jpg" },
    { src: "images/img7.jpg" }, { src: "images/img8.jpg" },
    { src: "images/img9.jpg" }, { src: "images/img10.jpg" }
];

let currentIndex = 0;
let viewer = null;

// TIMERS
let idleTimer = null;
let slideTimer = null;
const IDLE_DELAY = 3000;       // 3 seconds before showing hand/zooming out
const AUTO_PLAY_DELAY = 10000; // 10 seconds idle before moving to next slide

// --- MAIN VIEWER LOGIC ---

function loadViewer(index) {
    // 1. Destroy existing viewer to free memory
    if (viewer) {
        viewer.destroy();
    }

    // 2. Create new Viewer
    // FEATURE 5: We define 'maxHfov' (max zoom out) as 120
    viewer = pannellum.viewer('viewer', {
        type: "equirectangular",
        panorama: images[index].src,
        autoLoad: true,
        showControls: false, // We use our own controls
        hfov: 100,           // Starting Zoom
        minHfov: 50,         // Max Zoom In
        maxHfov: 120,        // Max Zoom Out (Feature 5 target)
        yaw: 0,
        pitch: 0,
        autoRotate: 0        // Start with 0, we handle rotation in idle logic
    });

    // 3. Attach Events for Idle Detection
    const viewerContainer = document.getElementById('viewer');
    
    // Stop idle timer on interaction
    viewerContainer.onmousedown = resetIdleTimer;
    viewerContainer.ontouchstart = resetIdleTimer;
    
    // Restart idle timer when interaction ends
    viewerContainer.onmouseup = startIdleCountdown;
    viewerContainer.ontouchend = startIdleCountdown;

    // Also update UI
    updateThumbs();
    
    // Start the loop logic immediately (assume idle on load)
    startIdleCountdown();
}

// --- FEATURE 2: TRANSITION EFFECT ---
function transitionToImage(index) {
    const overlay = document.getElementById('fadeOverlay');
    
    // 1. Fade Out (Turn screen black)
    overlay.classList.add('active');

    // 2. Wait 500ms for fade, then load new image
    setTimeout(() => {
        currentIndex = index;
        loadViewer(currentIndex);

        // 3. Slight delay to let image render, then Fade In
        setTimeout(() => {
            overlay.classList.remove('active');
        }, 300);
    }, 500);
}

// --- THUMBNAIL LOGIC ---
function buildThumbnails() {
    const panel = document.getElementById("thumbPanel");
    panel.innerHTML = "";

    images.forEach((img, i) => {
        const thumb = document.createElement("img");
        thumb.src = img.src;
        thumb.className = "thumb";
        thumb.onclick = () => {
            // Clicking a thumb counts as interaction
            resetIdleTimer();
            transitionToImage(i);
        };
        panel.appendChild(thumb);
    });
}

function updateThumbs() {
    document.querySelectorAll(".thumb").forEach((t, i) => {
        t.classList.toggle("active", i === currentIndex);
        // Ensure active thumb is scrolled into view
        if(i === currentIndex) {
            t.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    });
}

// --- IDLE & AUTO-PLAY SYSTEM (Features 1, 3, 5) ---

function startIdleCountdown() {
    // Clear existing to prevent duplicates
    clearTimeout(idleTimer);
    clearTimeout(slideTimer);

    // Timer 1: Small delay (e.g. 3s) -> Show Hand, Zoom Out, Rotate
    idleTimer = setTimeout(onIdleStart, IDLE_DELAY);

    // Timer 2: Long delay (e.g. 10s) -> Go to Next Slide
    slideTimer = setTimeout(onAutoPlayNext, AUTO_PLAY_DELAY);
}

function resetIdleTimer() {
    // User is interacting!
    clearTimeout(idleTimer);
    clearTimeout(slideTimer);

    // Hide Hand
    document.getElementById('idleIndicator').classList.remove('visible');

    // Stop Auto Rotation immediately
    if (viewer) {
        viewer.stopAutoRotate();
    }
}

function onIdleStart() {
    // FEATURE 3: Show Hand Icon
    document.getElementById('idleIndicator').classList.add('visible');

    if (viewer) {
        // FEATURE 5: Zoom to Max Out (120)
        viewer.setHfov(120, 1000); // 1000ms animation
        
        // Start Auto Rotate
        viewer.startAutoRotate(-5); // Negative for left, Positive for right
    }
}

function onAutoPlayNext() {
    // FEATURE 1: Move to next image
    let nextIndex = (currentIndex + 1) % images.length;
    transitionToImage(nextIndex);
}

// --- CONTROLS ---

document.getElementById("prevBtn").onclick = () => {
    resetIdleTimer();
    let newIndex = (currentIndex - 1 + images.length) % images.length;
    transitionToImage(newIndex);
};

document.getElementById("nextBtn").onclick = () => {
    resetIdleTimer();
    let newIndex = (currentIndex + 1) % images.length;
    transitionToImage(newIndex);
};

// FEATURE 4: Custom Fullscreen Logic
// We request fullscreen on the #app div, NOT the internal viewer.
// This keeps the sidebar visible.
const fsBtn = document.getElementById("fsBtn");
const appContainer = document.getElementById("app");

fsBtn.onclick = () => {
    resetIdleTimer();
    if (!document.fullscreenElement) {
        appContainer.requestFullscreen().catch(err => {
            alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else {
        document.exitFullscreen();
    }
};

// --- INITIALIZATION ---
buildThumbnails();
loadViewer(currentIndex);
