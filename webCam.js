const video = document.querySelector('.player');
const canvas = document.querySelector('.photo');
const ctx = canvas.getContext('2d');
const strip = document.querySelector('.strip');
const snap = document.querySelector('.snap');
const filterSelect = document.getElementById('filter');

function getVideo(){
    navigator.mediaDevices.getUserMedia({video: true, audio: false})
    .then(localMediaStream =>{
        console.log('✅ Got video stream:', localMediaStream);
        video.srcObject = localMediaStream;
        video.play();
    })
    .catch(error =>{
        console.error('❌ Webcam error:', error);
        alert('Please allow webcam access to use this app!');
    })
}

function paintToCanvas(){ 
    const width = video.videoWidth;
    const height = video.videoHeight;
    console.log('📐 Video dimensions:', width, 'x', height);
    
    canvas.width = width;
    canvas.height = height;
    
    return setInterval(()=>{ 
        ctx.drawImage(video, 0, 0, width, height);
        let pixels = ctx.getImageData(0, 0, width, height); 
        
        // Reset alpha for ghost effect 
        ctx.globalAlpha = 1; 
        
        // Get selected filter from dropdown  
        const selectedFilter = filterSelect.value;
        switch(selectedFilter){
            case 'redEffect': 
                pixels = redEffect(pixels);
                ctx.putImageData(pixels, 0, 0);
                break;
            case 'rgbSplit':
                pixels = rgbSplit(pixels);
                ctx.putImageData(pixels, 0, 0);
                break;
            case 'greenScreen':
                pixels = greenScreen(pixels);
                ctx.putImageData(pixels, 0, 0);
                break;
            case 'ghost':
                // ghost effect by drawing semi-transparent previous frames 
                ctx.globalAlpha = 0.1;
                ctx.putImageData(pixels, 0, 0);
                break;
            default: 
                // no filter - just keep the drawn image
                break;
        }
    }, 16);
}

function takePhoto(){
    console.log('📸 Taking photo...');
    
    // Play sound
    if(snap.src) {
        snap.currentTime = 0;
        snap.play().catch(e => console.log('Sound play failed:', e));
    }

    // Get canvas data
    const data = canvas.toDataURL('image/jpeg');
    console.log('🖼️ Photo data length:', data.length);
    
    // Create link element
    const link = document.createElement('a');
    link.href = data;
    link.setAttribute("download", "Smarty");
    link.innerHTML = `<img src="${data}" alt="Smarty BOI" />`;
    
    // Add to strip
    strip.insertBefore(link, strip.firstChild);
    console.log('✅ Photo added to strip. Total photos:', strip.children.length);
    
    // ⭐ NEW: Show the strip when first photo is taken
    document.querySelector('.photobooth').classList.add('has-photos');
    
    // ⭐ NEW: Make body scrollable when photos exist
    document.body.classList.add('scrollable');
    
    console.log('✅ Strip should now be visible and page is scrollable');
}

function redEffect(pixels){
    for(let i = 0; i < pixels.data.length; i += 4){
        pixels.data[i + 0] = pixels.data[i + 0] + 100;   //red
        pixels.data[i + 1] = pixels.data[i + 1] - 50;    //green
        pixels.data[i + 2] = pixels.data[i + 2] * 0.5;   //blue
    }
    return pixels;
}

function rgbSplit(pixels){
    for(let i = 0; i < pixels.data.length; i += 4){
        pixels.data[i - 150] = pixels.data[i + 0];   //red
        pixels.data[i + 250] = pixels.data[i + 1];   //green
        pixels.data[i - 300] = pixels.data[i + 2];   //blue
    }
    return pixels;
}

function greenScreen(pixels){
    const level = {};

    document.querySelectorAll('.rgb input').forEach((input) => {
        level[input.name] = Number(input.value);
    });

    for(let i = 0; i < pixels.data.length; i += 4){
        let red = pixels.data[i + 0];
        let green = pixels.data[i + 1];
        let blue = pixels.data[i + 2];

        if(
            red >= level.rmin && red <= level.rmax &&
            green >= level.gmin && green <= level.gmax &&
            blue >= level.bmin && blue <= level.bmax
        ){
            // Make pixel transparent by setting alpha to 0
            pixels.data[i + 3] = 0;
        }
    }
    return pixels;
}

// Initialize
console.log('🚀 Starting webcam app...');
getVideo();
video.addEventListener('canplay', paintToCanvas);

// ⭐ NEW: Show/hide RGB sliders based on filter selection
filterSelect.addEventListener('change', function() {
    const rgbControls = document.querySelector('.rgb');
    
    // Only show RGB controls when Green Screen filter is selected
    if (this.value === 'greenScreen') {
        rgbControls.classList.add('show');
        console.log('🎨 RGB controls shown');
    } else {
        rgbControls.classList.remove('show');
        console.log('🎨 RGB controls hidden');
    }
});

// Debug info
console.log('Elements found:', {
    video: !!video,
    canvas: !!canvas,
    strip: !!strip,
    snap: !!snap,
    filterSelect: !!filterSelect
});