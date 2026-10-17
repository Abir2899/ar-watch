
let scene, camera, renderer, watchModel, videoElement;
const videoWidth = 640;
const videoHeight = 480;

function init3D() {
    const canvas = document.getElementById('canvas3d');
    scene = new THREE.Scene();
    
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // إضاءة استوديو كاملة وواقعية لإبراز تفاصيل وألوان الساعة
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
    dirLight.position.set(0, 10, 5);
    scene.add(dirLight);

    const loader = new THREE.GLTFLoader();
    loader.load('watch.glb', (gltf) => {
        watchModel = gltf.scene;
        // حجم متناسق وتعديل الدوران لتكون الساعة مستوية على المعصم
        watchModel.scale.set(0.7, 0.7, 0.7); 
        watchModel.rotation.set(Math.PI / 2, 0, 0); 
        watchModel.visible = false;
        scene.add(watchModel);
        document.getElementById('loading').style.display = 'none';
    }, undefined, (error) => {
        console.error("خطأ في تحميل مجسم الساعة:", error);
    });
}

function onResults(results) {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0 && watchModel) {
        // النقطة 0 في ميديا بايب هي نقطة المعصم الدقيقة (Wrist)
        const wrist = results.multiHandLandmarks[0][0]; 
        
        // معادلة تحويل متطورة ومجربة لإحداثيات الشاشة إلى فضاء ثلاثي الأبعاد
        const x = (wrist.x * 2 - 1) * 3.5;
        const y = -(wrist.y * 2 - 1) * 2.5;
        
        watchModel.position.set(x, y, -6);
        watchModel.visible = true;
    } else if (watchModel) {
        watchModel.visible = false; // إخفاء الساعة عند غياب اليد
    }
    renderer.render(scene, camera);
}

async function main() {
    videoElement = document.getElementById('webcam');
    init3D();

    // إعداد حزمة MediaPipe الذكية لقراءة اليد
    const hands = new Hands({
        locateFile: (file) => https://jsdelivr.net{file}
    });
    
    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });
    hands.onResults(onResults);

    // تشغيل الكاميرا الخلفية تلقائياً
    const cameraUtils = new Camera(videoElement, {
        onFrame: async () => {
            await hands.send({ image: videoElement });
        },
        width: videoWidth,
        height: videoHeight,
        facingMode: "environment"
    });
    cameraUtils.start();
}

main();
