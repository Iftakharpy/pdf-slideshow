// Setup PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = "./libs/pdf.worker.js";

// DOM elements
const pdfInput = document.querySelector("#pdf-input");
const nextButton = document.querySelector("#next-button");
const previousButton = document.querySelector("#previous-button");
const pageChangeIntervalInput = document.querySelector(
    "#page-change-interval-input"
);
const startPageChangeIntervalButton = document.querySelector(
    "#start-page-change-interval-button"
);
const rendererCanvas = document.querySelector("#pdf-renderer");
const rerenderButton = document.querySelector("#rerender-button");
const currentPageCounter = document.querySelector("#current-page-counter");
const totalPagesCounter = document.querySelector("#total-pages-counter");
const helpButton = document.querySelector("#help-button");
const keyboardShortcutsContainer = document.querySelector(
    "#keyboard-shortcuts-container"
);
const colorSchemePreferenceButton = document.querySelector(
    "#color-scheme-preference-button"
);

const THEME_KEY_NAME = "color-scheme-preference";
// Watch color scheme changes
applyColorSchemePreference();
matchMedia("(prefers-color-scheme: dark)").addEventListener(
    "change",
    toggleColorSchemePreference
);

// Keep canvas sized to window
updateRendererCanvasSize();
addEventListener("resize", (e) => {
    updateRendererCanvasSize();
    reloadCurrentPage();
});

function updateRendererCanvasSize() {
    rendererCanvas.width = innerWidth;
    rendererCanvas.height = innerHeight;
}

// Data related to current PDF document
let pdfFile = null;
let binaryPdfData = null;
let pdfJsDocument = null;
// State data
const pdfInfo = {
    totalPages: 0,
    currentPage: 1,
    pageChangeInterval: null,
    rendererTask: null,
};
pdfInput.addEventListener("change", async (e) => {
    if (e.target.files.length === 0) return;
    pdfFile = e.target.files[0];

    if (pdfFile) {
        binaryPdfData = await pdfFile.arrayBuffer();
        pdfJsDocument = await pdfjsLib.getDocument(binaryPdfData).promise;
    }

    if (pdfJsDocument) {
        pdfInfo.totalPages = pdfJsDocument.numPages;
        totalPagesCounter.textContent = pdfInfo.totalPages;

        if (pdfInfo.totalPages > 0) {
            pdfInfo.currentPage = 1;
            reloadCurrentPage();
        } else {
            pdfInfo.currentPage = 0;
            alert("The PDF document is empty.");
        }
    }
});
previousButton.addEventListener("click", showPreviousPage);
nextButton.addEventListener("click", showNextPage);
rerenderButton.addEventListener("click", reloadCurrentPage);
startPageChangeIntervalButton.addEventListener("click", toggleSlideShow);
pageChangeIntervalInput.addEventListener("input", syncSlideShowInterval);
helpButton.addEventListener(
    "click",
    toggleKeyboardShortcutsContainerVisibility
);
colorSchemePreferenceButton.addEventListener(
    "click",
    toggleColorSchemePreference
);

const handledKeys = {
    ArrowUp: increasePageChangeInterval,
    ArrowDown: decreasePageChangeInterval,
    ArrowLeft: showPreviousPage,
    ArrowRight: showNextPage,
    KeyR: reloadCurrentPage,
    Space: toggleSlideShow,
    KeyF: togglePlayInFullscreen,
    F11: togglePlayInFullscreen,
    KeyO: () => pdfInput.click(), // Open file dialogue to select PDF file
    KeyH: toggleKeyboardShortcutsContainerVisibility,
    KeyT: toggleColorSchemePreference,
};
addEventListener("keydown", (e) => {
    if (e.target !== document.body) return;
    if (e.code in handledKeys) {
        e.preventDefault();
        handledKeys[e.code]();
    }
});

// Helper functions
function toggleSlideShow() {
    if (pdfInfo.pageChangeInterval) stopSlideShow();
    else startSlideShow();
}
function startSlideShow() {
    if (pdfInfo.pageChangeInterval) stopSlideShow();

    // Start slideshow
    pdfInfo.pageChangeInterval = setInterval(() => {
        showNextPage();
    }, parseInt(pageChangeIntervalInput.value) || 3000);
    startPageChangeIntervalButton
        .querySelector("ion-icon")
        .setAttribute("name", "pause");
}
function stopSlideShow() {
    if (pdfInfo.pageChangeInterval) {
        clearInterval(pdfInfo.pageChangeInterval);
        pdfInfo.pageChangeInterval = null;
        startPageChangeIntervalButton
            .querySelector("ion-icon")
            .setAttribute("name", "play");
    }
}
function syncSlideShowInterval() {
    if (pdfInfo.pageChangeInterval) stopSlideShow();
    startSlideShow();
}

// Helper functions
function showNextPage() {
    if (pdfInfo.totalPages <= 0) return;

    if (pdfInfo.currentPage < pdfInfo.totalPages) pdfInfo.currentPage++;
    else pdfInfo.currentPage = 1;
    reloadCurrentPage();
}
function showPreviousPage() {
    if (pdfInfo.totalPages <= 0) return;

    if (pdfInfo.currentPage > 1) pdfInfo.currentPage--;
    else pdfInfo.currentPage = pdfInfo.totalPages;
    reloadCurrentPage();
}
function reloadCurrentPage() {
    let canvasBackgroundColor = getComputedStyle(
        document.documentElement
    ).getPropertyValue("--canvas-bg-color");
    showPage(pdfInfo.currentPage, canvasBackgroundColor);
}
function increasePageChangeInterval() {
    pageChangeIntervalInput.value =
        parseInt(pageChangeIntervalInput.value) + 100;
    syncSlideShowInterval();
}
function decreasePageChangeInterval() {
    pageChangeIntervalInput.value =
        parseInt(pageChangeIntervalInput.value) - 100;
    syncSlideShowInterval();
}
function togglePlayInFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else rendererCanvas.requestFullscreen();
}
function toggleKeyboardShortcutsContainerVisibility() {
    keyboardShortcutsContainer.classList.toggle("hidden");
}
function toggleColorSchemePreference() {
    if (localStorage.getItem(THEME_KEY_NAME) === "dark")
        localStorage.setItem(THEME_KEY_NAME, "light");
    else localStorage.setItem(THEME_KEY_NAME, "dark");
    applyColorSchemePreference();
    reloadCurrentPage();
}

function applyColorSchemePreference() {
    if (localStorage.getItem(THEME_KEY_NAME) === "dark") {
        document.body.classList.add("dark");
        colorSchemePreferenceButton
            .querySelector("ion-icon")
            .setAttribute("name", "moon");
    } else {
        document.body.classList.remove("dark");
        colorSchemePreferenceButton
            .querySelector("ion-icon")
            .setAttribute("name", "sunny");
    }
}

// Page renderer function
async function showPage(pageNumber, backgroundColour = "rgba(0,0,0,0)") {
    if (pdfInfo.totalPages <= 0) return;
    else if (pageNumber < 1 || pageNumber > pdfInfo.totalPages) return;

    let page = await pdfJsDocument.getPage(pageNumber);
    let canvasWidth = rendererCanvas.clientWidth;
    let canvasHeight = rendererCanvas.clientHeight;
    let viewport = null;

    if (canvasHeight < canvasWidth) {
        viewport = getScaledPdfPageViewportForDesiredWidth(
            page,
            getScaledPdfPageWidthForDesiredHeight(page, canvasHeight)
        );
    } else {
        viewport = getScaledPdfPageViewportForDesiredWidth(page, canvasWidth);
    }

    let rendererCanvasContext = rendererCanvas.getContext("2d");
    const rendererContext = {
        viewport,
        canvasContext: rendererCanvasContext,
        background: backgroundColour,
    };
    rendererCanvasContext.clearRect(
        0,
        0,
        rendererCanvas.width,
        rendererCanvas.height
    );
    // Render the page into the canvas
    if (pdfInfo.rendererTask && pdfInfo.rendererTask) {
        // Cancel previous render task
        pdfInfo.rendererTask.cancel();
    }
    pdfInfo.rendererTask = page.render(rendererContext);
    // Throws error when cancelled, so catch it
    pdfInfo.rendererTask.promise.then().catch(() => {});

    pdfInfo.currentPage = pageNumber;
    currentPageCounter.textContent = pdfInfo.currentPage;
}

// Viewport scaling helper functions
function getScaledPdfPageViewportForDesiredWidth(page, desiredWidthPixels) {
    let viewport = page.getViewport({ scale: 1 });
    let scale = desiredWidthPixels / viewport.width;
    viewport = page.getViewport({ scale: scale });
    let scaledViewport = page.getViewport({
        scale: scale,
        offsetX: (rendererCanvas.width - viewport.width) / 2,
        offsetY: (rendererCanvas.height - viewport.height) / 2,
    });
    return scaledViewport;
}
function getScaledPdfPageWidthForDesiredHeight(page, desiredHeightPixels) {
    let viewport = page.getViewport({ scale: 1 });
    let scale = desiredHeightPixels / viewport.height;
    let scaledWidth = viewport.width * scale;
    return scaledWidth;
}
