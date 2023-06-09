// Setup PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = "./libs/pdf.worker.js";

// DOM elements
const pdfInput = document.querySelector("#pdf-input");
const nextButton = document.querySelector("#next-button");
const previousButton = document.querySelector("#previous-button");
const pageChangeIntervalInput = document.querySelector('#page-change-interval-input')
const startPageChangeIntervalButton = document.querySelector('#start-page-change-interval-button')
const rendererCanvas = document.querySelector("#pdf-renderer");
const rerenderButton = document.querySelector("#rerender-button");

// Keep canvas sized to window
rendererCanvas.width = window.innerWidth;
rendererCanvas.height = window.innerHeight;
addEventListener("resize", (e) => {
    rendererCanvas.width = window.innerWidth;
    rendererCanvas.height = window.innerHeight;
    showPage(pdfInfo.currentPage);
});

// Data related to current PDF document
let pdfFile = null;
let binaryPdfData = null;
let pdfJsDocument = null;
// State data
const pdfInfo = {
    totalPages: 0,
    currentPage: 1,
    pageChangeInterval: null,
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

        if (pdfInfo.totalPages > 0) {
            pdfInfo.currentPage = 1;
            showPage(pdfInfo.currentPage);
        } else {
            pdfInfo.currentPage = 0;
            alert("The PDF document is empty.");
        }
    }
});

rerenderButton.addEventListener("click", (e) => {
    showPage(pdfInfo.currentPage);
});
addEventListener('keydown', e => {
    const handledKeys = ['ArrowRight', 'ArrowLeft', 'Space']
    if (e.target !== document.body || !handledKeys.includes(e.code)) return;

    e.preventDefault()
    e.code === 'ArrowRight' && showNextPage()
    e.code === 'ArrowLeft' && showPreviousPage()
    e.code === 'Space' && toggleSlideShow()
})
nextButton.addEventListener("click", showNextPage);
previousButton.addEventListener("click", showPreviousPage);
startPageChangeIntervalButton.addEventListener('click', toggleSlideShow)
pageChangeIntervalInput.addEventListener('input', (e) => {
    if (pdfInfo.pageChangeInterval) stopSlideShow()
    startSlideShow()
})

// Helper functions
function toggleSlideShow() {
    if (pdfInfo.pageChangeInterval) stopSlideShow()
    else startSlideShow()
}
function startSlideShow() {
    if (pdfInfo.pageChangeInterval) stopSlideShow()

    // Start slideshow
    pdfInfo.pageChangeInterval = setInterval(() => {
        showNextPage()
    }, parseInt(pageChangeIntervalInput.value) || 3000)
    startPageChangeIntervalButton.textContent = 'Stop Slideshow'
}
function stopSlideShow() {
    if (pdfInfo.pageChangeInterval) {
        clearInterval(pdfInfo.pageChangeInterval)
        pdfInfo.pageChangeInterval = null;
        startPageChangeIntervalButton.textContent = 'Start Slideshow'
    }
}

// Helper functions
function showNextPage() {
    if (pdfInfo.totalPages <= 0) return;

    if (pdfInfo.currentPage < pdfInfo.totalPages) pdfInfo.currentPage++;
    else pdfInfo.currentPage = 1;
    showPage(pdfInfo.currentPage);
}
function showPreviousPage() {
    if (pdfInfo.totalPages <= 0) return;

    if (pdfInfo.currentPage > 1) pdfInfo.currentPage--;
    else pdfInfo.currentPage = pdfInfo.totalPages;
    showPage(pdfInfo.currentPage);
}

// Page renderer function
async function showPage(pageNumber) {
    if (pdfInfo.totalPages <= 0) return;
    else if (pageNumber < 1 || pageNumber > pdfInfo.totalPages) return;

    let page = await pdfJsDocument.getPage(pageNumber);
    let canvasWidth = rendererCanvas.width;
    let canvasHeight = rendererCanvas.height;
    let viewport = null;

    if (canvasHeight < canvasWidth) {
        viewport = getScaledPdfPageViewportForDesiredWidth(
            page,
            getScaledPdfPageWidthForDesiredHeight(page, canvasHeight)
        );
    } else {
        viewport = getScaledPdfPageViewportForDesiredWidth(page, canvasWidth);
    }
    const renderCtx = {
        viewport,
        canvasContext: rendererCanvas.getContext("2d"),
    };
    // Render the page into the canvas
    page.render(renderCtx);
    pdfInfo.currentPage = pageNumber;
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
