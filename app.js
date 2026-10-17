let video, model, scene, camera, renderer, watchModel;
const videoWidth = 640;
const videoHeight = 480;

async function setupCamera() {
    video = document.getElementById('webcam');
    const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode:{ exact: "environment"}, width: videoWidth, height: videoHeight },
        audio: false
    });
    video.srcObject = stream;
    return new Promise((resolve) => {
        video.onloadedmetadata = () => { resolve(video); };
    });
}

function init3D() {
    const canvas = document.getElementById('canvas3d');
    scene = new THREE.Scene();
    
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(0, 10, 5);
    scene.add(dirLight);

    const loader = new THREE.GLTFLoader();
    loader.load('watch.glb', (gltf) => {
        watchModel = gltf.scene;
        watchModel.scale.set(0.1, 0.1, 0.1); // تصغير الحجم الافتراضي لتجنب اختفائها
        watchModel.visible = false;
        scene.add(watchModel);
        document.getElementById('loading').style.display = 'none';
    }, undefined, (error) => {
        console.error("خطأ في تحميل ملف الساعة:", error);
    });
}

async function trackHand() {
    if (model) {
        const predictions = await model.estimateHands(video);
        if (predictions.length > 0 && watchModel) {
            const wrist = predictions[0].landmarks[0]; // النقطة صفر هي المعصم
            
            // تحويل إحداثيات الكاميرا إلى فضاء ثلاثي الأبعاد بشكل صحيح
            const x = (wrist[0] / videoWidth) * 2 - 1;
            const y = -(wrist[1] / videoHeight) * 2 + 1;
            
            watchModel.position.set(x * 5, y * 5, -10);
            watchModel.visible = true;
        } else if (watchModel) {
            watchModel.visible = false;
        }
    }
    renderer.render(scene, camera);
    requestAnimationFrame(trackHand);
}

async function main() {
    try {
        await setupCamera();
        video.play();
        init3D();
        model = await handpose.load();
        trackHand();
    } catch (e) {
        document.getElementById('loading').innerText = "حدث خطأ: تأكد من تفعيل الكاميرا واسم ملف الساعة";
        console.error(e);
    }
}

main();
