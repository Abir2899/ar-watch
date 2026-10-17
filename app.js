let video, model, scene, camera, renderer, watchModel;
const videoWidth = window.innerWidth;
const videoHeight = window.innerHeight;

async function setupCamera() {
    video = document.getElementById('webcam');
    const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: videoWidth, height: videoHeight },
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

    // إعداد الكاميرا الافتراضية للمجسمات
    camera = new THREE.PerspectiveCamera(45, videoWidth / videoHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setSize(videoWidth, videoHeight);

    // إضافة إضاءة لجعل الساعة تبدو واقعية
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(0, 10, 5);
    scene.add(dirLight);

    // تحميل مجسم الساعة ثلاثي الأبعاد الخاص بك
    const loader = new THREE.GLTFLoader();
    loader.load('watch.glb', (gltf) => {
        watchModel = gltf.scene;
        watchModel.scale.set(0.5, 0.5, 0.5); // تحكم في حجم الساعة من هنا
        watchModel.visible = false; // إخفاء الساعة حتى يتم رصد اليد
        scene.add(watchModel);
        document.getElementById('loading').style.display = 'none';
    });
}

async function trackHand() {
    const predictions = await model.estimateHands(video);

    if (predictions.length > 0 && watchModel) {
        // نقطة المعصم في مكتبة Handpose هي النقطة رقم 0 (Wrist)
        const wrist = predictions[0].landmarks[0];

        // تحويل إحداثيات الكاميرا ثنائية الأبعاد إلى فضاء ثلاثي الأبعاد 3D
        const x = (wrist[0] / videoWidth) * 2 - 1;
        const y = -(wrist[1] / videoHeight) * 2 + 1;

        // ربط موقع الساعة بموقع المعصم
        watchModel.position.set(-x * 5, y * 5, -10); // تعديل العمق والنسبة والاتجاه المعاكس للكاميرا الأمامية
        watchModel.visible = true;

        // حساب دوران المعصم لتدوير الساعة معه (تقريبي)
        const indexFingerBase = predictions[0].landmarks[5];
        const angle = Math.atan2(indexFingerBase[1] - wrist[1], indexFingerBase[0] - wrist[0]);
        watchModel.rotation.z = angle + Math.PI / 2;
    } else if (watchModel) {
        watchModel.visible = false; // إخفاء الساعة إذا اختفت اليد من الكاميرا
    }

    renderer.render(scene, camera);
    requestAnimationFrame(trackHand);
}

async function main() {
    await setupCamera();
    video.play();
    init3D();
    model = await handpose.load(); // تحميل نموذج الذكاء الاصطناعي لقراءة اليد
    trackHand();
}

main();
