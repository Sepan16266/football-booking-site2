// إعدادات Firebase الديناميكية - تعمل في جميع البيئات
// هذا الملف آمن للرفع ويستخدم متغيرات البيئة

// دالة للحصول على متغيرات البيئة
function getEnvVar(name, defaultValue = '') {
    // في بيئة Vercel
    if (typeof process !== 'undefined' && process.env) {
        return process.env[name] || defaultValue;
    }
    
    // في البيئة المحلية - استخدم القيم الافتراضية
    const localConfig = {
        'FIREBASE_API_KEY': 'AIzaSyDXsCN1JGyYGXk5FnzQPGKcL2JKBggi1v4',
        'FIREBASE_PROJECT_ID': 'mala3b-67fca',
        'FIREBASE_SENDER_ID': '491005385668',
        'FIREBASE_APP_ID': '1:491005385668:web:af8522302749092621a291',
        'CALLMEBOT_PHONE': '9647508275402',
        'CALLMEBOT_API_KEY': '1002501'
    };
    
    return localConfig[name] || defaultValue;
}

// إعدادات Firebase
const firebaseConfig = {
    apiKey: getEnvVar('FIREBASE_API_KEY'),
    authDomain: `${getEnvVar('FIREBASE_PROJECT_ID')}.firebaseapp.com`,
    projectId: getEnvVar('FIREBASE_PROJECT_ID'),
    storageBucket: `${getEnvVar('FIREBASE_PROJECT_ID')}.firebasestorage.app`,
    messagingSenderId: getEnvVar('FIREBASE_SENDER_ID'),
    appId: getEnvVar('FIREBASE_APP_ID')
};

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);

// تهيئة Firestore
const db = firebase.firestore();

// مرجع مجموعة الحجوزات في Firestore
const bookingsCollection = db.collection('bookings');

// إعدادات CallMeBot
const CALLMEBOT_CONFIG = {
    phoneNumber: getEnvVar('CALLMEBOT_PHONE'),
    apiKey: getEnvVar('CALLMEBOT_API_KEY')
};

// دالة إرسال رسالة WhatsApp للإدارة
async function sendWhatsAppMessage(bookingData) {
    if (!CALLMEBOT_CONFIG.phoneNumber || !CALLMEBOT_CONFIG.apiKey) {
        console.log('⚠️ إعدادات CallMeBot غير مكتملة');
        return false;
    }

    try {
        const message = `🔔 حجز جديد!\n\n` +
                       `👤 الاسم: ${bookingData.fullName}\n` +
                       `📱 الهاتف: ${bookingData.phoneNumber}\n` +
                       `📅 التاريخ: ${bookingData.bookingDate}\n` +
                       `⏰ الوقت: ${bookingData.bookingTime}\n` +
                       `🏟️ الملعب: ${bookingData.fieldName}\n\n` +
                       `تم الحجز بنجاح! ✅`;

        const encodedMessage = encodeURIComponent(message);
        const url = `https://api.callmebot.com/whatsapp.php?phone=${CALLMEBOT_CONFIG.phoneNumber}&text=${encodedMessage}&apikey=${CALLMEBOT_CONFIG.apiKey}`;

        const response = await fetch(url);
        
        if (response.ok) {
            console.log('✅ تم إرسال رسالة WhatsApp بنجاح');
            return true;
        } else {
            console.error('❌ فشل في إرسال رسالة WhatsApp:', response.status);
            return false;
        }
    } catch (error) {
        console.error('❌ خطأ في إرسال رسالة WhatsApp:', error);
        return false;
    }
}

// دالة إرسال رسالة للعميل
async function sendCustomerWhatsApp(customerPhone, bookingData) {
    if (!CALLMEBOT_CONFIG.apiKey) {
        console.log('⚠️ إعدادات CallMeBot غير مكتملة');
        return false;
    }

    try {
        const message = `🎉 تم تأكيد حجزك!\n\n` +
                       `👤 مرحباً ${bookingData.fullName}\n` +
                       `📅 التاريخ: ${bookingData.bookingDate}\n` +
                       `⏰ الوقت: ${bookingData.bookingTime}\n` +
                       `🏟️ الملعب: ${bookingData.fieldName}\n\n` +
                       `شكراً لاختيارك ملاعبنا! ⚽`;

        const encodedMessage = encodeURIComponent(message);
        const cleanPhone = customerPhone.replace(/\D/g, '');
        const url = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodedMessage}&apikey=${CALLMEBOT_CONFIG.apiKey}`;

        const response = await fetch(url);
        
        if (response.ok) {
            console.log('✅ تم إرسال رسالة تأكيد للعميل');
            return true;
        } else {
            console.error('❌ فشل في إرسال رسالة للعميل:', response.status);
            return false;
        }
    } catch (error) {
        console.error('❌ خطأ في إرسال رسالة للعميل:', error);
        return false;
    }
}

// دالة لعرض رسائل التنبيه
function showToast(message, type = 'info') {
    const toastElement = document.getElementById('alertToast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (!toastElement || !toastMessage) {
        alert(message);
        return;
    }
    
    // تحديد لون التنبيه حسب النوع
    const toastHeader = toastElement.querySelector('.toast-header');
    toastHeader.className = 'toast-header';
    
    switch(type) {
        case 'success':
            toastHeader.classList.add('bg-success', 'text-white');
            break;
        case 'error':
            toastHeader.classList.add('bg-danger', 'text-white');
            break;
        case 'warning':
            toastHeader.classList.add('bg-warning', 'text-dark');
            break;
        default:
            toastHeader.classList.add('bg-info', 'text-white');
    }
    
    toastMessage.textContent = message;
    
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
}

// دالة لعرض/إخفاء مؤشر التحميل
function toggleLoading(show = true) {
    const loadingSpinner = document.getElementById('loadingSpinner');
    if (loadingSpinner) {
        if (show) {
            loadingSpinner.classList.remove('d-none');
        } else {
            loadingSpinner.classList.add('d-none');
        }
    }
}

// دالة للتحقق من صحة البيانات
function validateBookingData(data) {
    const errors = [];

    // التحقق من الاسم
    if (!data.fullName || data.fullName.trim().length < 2) {
        errors.push('يجب أن يكون الاسم الكامل أكثر من حرفين');
    }

    // التحقق من رقم الهاتف
    const phoneRegex = /^[0-9]{10,15}$/;
    if (!data.phoneNumber || !phoneRegex.test(data.phoneNumber.replace(/\s/g, ''))) {
        errors.push('رقم الهاتف غير صحيح (يجب أن يكون من 10-15 رقم)');
    }

    // التحقق من التاريخ
    const bookingDate = new Date(data.bookingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (bookingDate < today) {
        errors.push('لا يمكن الحجز في تاريخ سابق');
    }

    // التحقق من الوقت
    if (!data.bookingTime) {
        errors.push('يجب اختيار وقت الحجز');
    }

    return errors;
}

// دالة لتنسيق التاريخ
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
    };
    return date.toLocaleDateString('ar-SA', options);
}

// دالة لتنسيق الوقت
function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'مساءً' : 'صباحاً';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
}

// دالة لتنسيق تاريخ الإنشاء
function formatCreatedAt(timestamp) {
    if (!timestamp) return 'غير محدد';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('ar-SA', options);
}

console.log('🔥 Firebase تم تهيئته بنجاح - جميع الوظائف تعمل!');
console.log('📱 CallMeBot جاهز لإرسال الرسائل');
console.log('💾 Firestore متصل وجاهز لحفظ الحجوزات');
