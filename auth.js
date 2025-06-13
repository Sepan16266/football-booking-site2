// ملف المصادقة والتحكم في المستخدمين (بدون Firebase Auth)

// مرجع مجموعة المستخدمين
const usersCollection = db.collection('users');

// متغيرات عامة
let currentUser = null;

// مفتاح تخزين المستخدم في localStorage
const USER_STORAGE_KEY = 'ma3ab_current_user';

// تهيئة الصفحة
document.addEventListener('DOMContentLoaded', function() {
    console.log('تم تحميل الصفحة، بدء تهيئة النظام');
    setupAuthListeners();
    loadCurrentUser();

    // تأخير صغير للتأكد من تحميل كل شيء
    setTimeout(() => {
        checkAuthState();

        // تحديث شريط التنقل مرة أخرى للتأكد
        const savedUser = localStorage.getItem(USER_STORAGE_KEY);
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                updateUIBasedOnAuth(user);
            } catch (error) {
                console.error('خطأ في تحديث واجهة المستخدم:', error);
            }
        } else {
            updateUIBasedOnAuth(null);
        }
    }, 500);
});

// تحميل المستخدم الحالي من localStorage مع فك التشفير
function loadCurrentUser() {
    currentUser = getCurrentUserData();

    if (currentUser) {
        console.log('تم تحميل المستخدم:', currentUser.username);

        // 🕒 فحص انتهاء صلاحية الجلسة
        if (typeof securityManager !== 'undefined' && currentUser.loginTime) {
            const sessionAge = Date.now() - currentUser.loginTime;
            const sessionHours = sessionAge / (60 * 60 * 1000);

            console.log(`🕒 عمر الجلسة: ${sessionHours.toFixed(2)} ساعة`);
            console.log(`🕒 الحد الأقصى: ${securityManager.sessionTimeout / (60 * 60 * 1000)} ساعة`);

            if (sessionAge > securityManager.sessionTimeout) {
                console.log('🕒 انتهت صلاحية الجلسة - تسجيل خروج تلقائي');
                clearCurrentUser();
                return;
            }

            // 🔄 تجديد مؤقت الجلسة
            console.log('🔄 تجديد مؤقت الجلسة');
            securityManager.startSessionTimer();
        }

        updateUIBasedOnAuth(currentUser);
    } else {
        console.log('لا يوجد مستخدم محفوظ');
    }
}

// حفظ المستخدم في localStorage
function saveCurrentUser(user) {
    currentUser = user;

    // إضافة وقت تسجيل الدخول
    user.loginTime = Date.now();

    // حفظ بـ JSON عادي (لتجنب مشاكل التشفير)
    console.log('💾 حفظ بيانات المستخدم:', user.username);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

    // بدء مؤقت الجلسة إذا كان متاح
    if (typeof securityManager !== 'undefined') {
        securityManager.startSessionTimer();
    }

    updateUIBasedOnAuth(user);
}

// إزالة المستخدم من localStorage
function clearCurrentUser() {
    currentUser = null;
    localStorage.removeItem(USER_STORAGE_KEY);
    updateUIBasedOnAuth(null);
}

// دالة مساعدة لقراءة بيانات المستخدم بشكل آمن
function getCurrentUserData() {
    const savedUser = localStorage.getItem(USER_STORAGE_KEY);
    console.log('🔍 قراءة بيانات المستخدم من localStorage...');

    if (!savedUser) {
        console.log('❌ لا توجد بيانات محفوظة في localStorage');
        return null;
    }

    console.log('📦 تم العثور على بيانات محفوظة');

    try {
        // محاولة JSON العادي أولاً (للحسابات الجديدة)
        try {
            const parsedUser = JSON.parse(savedUser);
            if (parsedUser && parsedUser.username) {
                console.log('✅ تم قراءة البيانات بـ JSON عادي:', parsedUser.username);
                return parsedUser;
            }
        } catch (jsonError) {
            console.log('⚠️ فشل JSON عادي، محاولة فك التشفير...');
        }

        // محاولة فك التشفير للحسابات القديمة
        if (typeof securityManager !== 'undefined' && securityManager.decryptData) {
            console.log('🔐 محاولة فك التشفير...');
            const decryptedUser = securityManager.decryptData(savedUser);
            if (decryptedUser && decryptedUser.username) {
                console.log('✅ تم فك التشفير بنجاح:', decryptedUser.username);
                return decryptedUser;
            }
            console.log('⚠️ فشل فك التشفير');
        }

        console.error('❌ فشل في قراءة البيانات بجميع الطرق');
        return null;

    } catch (error) {
        console.error('❌ خطأ عام في قراءة بيانات المستخدم:', error);
        console.log('🗑️ سيتم مسح البيانات التالفة');
        localStorage.removeItem(USER_STORAGE_KEY);
        return null;
    }
}

// إعداد مستمعي الأحداث
function setupAuthListeners() {
    // تسجيل الدخول
    const loginForm = document.getElementById('loginFormElement');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // إنشاء حساب
    const registerForm = document.getElementById('registerFormElement');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
}

// معالجة تسجيل الدخول مع الحماية المتقدمة
async function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
        showAuthToast('يرجى إدخال اسم المستخدم وكلمة المرور', 'error');
        return;
    }

    // 🔒 فحص قفل الحساب (إذا كان securityManager متاح)
    if (typeof securityManager !== 'undefined') {
        const lockStatus = securityManager.isAccountLocked(username);
        if (lockStatus.locked) {
            showAuthToast(`الحساب مقفل لمدة ${lockStatus.remainingMinutes} دقيقة بسبب محاولات دخول مشبوهة`, 'error');
            return;
        }
    }

    try {
        showLoadingState('login', true);

        // البحث عن المستخدم في Firestore
        const userQuery = await usersCollection
            .where('username', '==', username)
            .where('isActive', '==', true)
            .get();

        if (userQuery.empty) {
            // 🚨 تسجيل محاولة دخول فاشلة
            securityManager.trackLoginAttempt(username, false);
            showAuthToast('اسم المستخدم غير موجود', 'error');
            return;
        }

        const userDoc = userQuery.docs[0];
        const userData = userDoc.data();

        // 🔐 التحقق من كلمة المرور
        let passwordValid = false;

        if (typeof securityManager !== 'undefined' && userData.passwordHash && userData.passwordSalt) {
            // كلمة مرور مشفرة (النظام الجديد)
            passwordValid = securityManager.verifyPassword(password, userData.passwordHash, userData.passwordSalt);
        } else {
            // كلمة مرور غير مشفرة (النظام القديم)
            passwordValid = userData.password === password;

            if (passwordValid && typeof securityManager !== 'undefined') {
                // تشفير كلمة المرور وتحديثها
                try {
                    const hashedPassword = securityManager.hashPassword(password);
                    await usersCollection.doc(userDoc.id).update({
                        passwordHash: hashedPassword.hash,
                        passwordSalt: hashedPassword.salt,
                        password: firebase.firestore.FieldValue.delete()
                    });
                    console.log('🔐 تم تشفير كلمة المرور للمستخدم:', username);
                } catch (updateError) {
                    console.error('خطأ في تحديث كلمة المرور:', updateError);
                }
            }
        }

        if (!passwordValid) {
            // 🚨 تسجيل محاولة دخول فاشلة
            if (typeof securityManager !== 'undefined') {
                securityManager.trackLoginAttempt(username, false);
            }
            showAuthToast('كلمة المرور غير صحيحة', 'error');
            return;
        }

        // ✅ تسجيل دخول ناجح
        if (typeof securityManager !== 'undefined') {
            securityManager.trackLoginAttempt(username, true);
        }

        // حفظ بيانات المستخدم مع التشفير
        const user = {
            id: userDoc.id,
            username: userData.username,
            fullName: userData.fullName,
            phone: userData.phone,
            role: userData.role,
            createdAt: userData.createdAt,
            loginTime: Date.now()
        };

        // 🔐 حفظ البيانات بـ JSON عادي (لتجنب مشاكل التشفير)
        console.log('💾 حفظ بيانات تسجيل الدخول...');
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

        // 🕒 بدء مؤقت الجلسة إذا كان متاح
        if (typeof securityManager !== 'undefined') {
            securityManager.startSessionTimer();
        }

        currentUser = user;

        showAuthToast('تم تسجيل الدخول بنجاح!', 'success');

        // إعادة التوجيه حسب نوع المستخدم
        if (user.role === 'admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'index.html';
        }

    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        if (typeof securityManager !== 'undefined') {
            securityManager.trackLoginAttempt(username, false);
        }
        showAuthToast('حدث خطأ أثناء تسجيل الدخول', 'error');
    } finally {
        showLoadingState('login', false);
    }
}

// معالجة إنشاء حساب مع الحماية المتقدمة
async function handleRegister(event) {
    event.preventDefault();

    const name = document.getElementById('registerName').value.trim();
    const username = document.getElementById('registerUsername').value.trim();
    const phone = document.getElementById('registerPhone').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // التحقق من البيانات
    if (!name || !username || !phone || !password || !confirmPassword) {
        showAuthToast('يرجى ملء جميع الحقول', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showAuthToast('كلمة المرور وتأكيدها غير متطابقتين', 'error');
        return;
    }

    if (password.length < 4) {
        showAuthToast('كلمة المرور يجب أن تكون 4 أحرف على الأقل', 'error');
        return;
    }

    // التحقق من صحة اسم المستخدم
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        showAuthToast('اسم المستخدم يجب أن يحتوي على أحرف إنجليزية وأرقام فقط', 'error');
        return;
    }

    try {
        showLoadingState('register', true);

        // التحقق من عدم وجود اسم المستخدم مسبقاً
        const existingUser = await usersCollection
            .where('username', '==', username)
            .get();

        if (!existingUser.empty) {
            showAuthToast('اسم المستخدم موجود بالفعل', 'error');
            return;
        }

        // إنشاء حساب جديد مع تشفير كلمة المرور
        let newUser;

        if (typeof securityManager !== 'undefined') {
            // تشفير كلمة المرور
            const hashedPassword = securityManager.hashPassword(password);
            newUser = {
                fullName: name,
                username: username,
                phone: phone,
                passwordHash: hashedPassword.hash,
                passwordSalt: hashedPassword.salt,
                role: 'customer',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                isActive: true
            };
        } else {
            // حفظ بدون تشفير إذا لم يكن securityManager متاح
            newUser = {
                fullName: name,
                username: username,
                phone: phone,
                password: password,
                role: 'customer',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                isActive: true
            };
        }

        const docRef = await usersCollection.add(newUser);

        // حفظ بيانات المستخدم في الجلسة
        const user = {
            id: docRef.id,
            username: username,
            fullName: name,
            phone: phone,
            role: 'customer',
            loginTime: Date.now()
        };

        // حفظ البيانات بـ JSON عادي للحسابات الجديدة (لتجنب مشاكل التشفير)
        console.log('💾 حفظ بيانات المستخدم الجديد...');
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

        // تعطيل انتهاء الجلسة للحسابات الجديدة
        localStorage.setItem('session_timeout_enabled', 'true');

        // بدء مؤقت الجلسة إذا كان متاح
        if (typeof securityManager !== 'undefined') {
            securityManager.startSessionTimer();
        }

        currentUser = user;
        showAuthToast('تم إنشاء الحساب بنجاح!', 'success');

        // إعادة التوجيه للصفحة الرئيسية
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);

    } catch (error) {
        console.error('خطأ في إنشاء الحساب:', error);
        showAuthToast('حدث خطأ أثناء إنشاء الحساب', 'error');
    } finally {
        showLoadingState('register', false);
    }
}

// التحقق من حالة المصادقة
function checkAuthState() {
    const currentPage = window.location.pathname.split('/').pop();

    // تحميل المستخدم من localStorage باستخدام الدالة الآمنة
    console.log('🔍 بدء فحص حالة المصادقة...');
    currentUser = getCurrentUserData();

    if (!currentUser) {
        console.log('❌ لا يوجد مستخدم محفوظ أو فشل في قراءة البيانات');
        console.log('🔍 فحص localStorage مباشرة...');
        const rawData = localStorage.getItem(USER_STORAGE_KEY);
        if (rawData) {
            console.log('📦 يوجد بيانات خام في localStorage:', rawData.substring(0, 50) + '...');
        } else {
            console.log('❌ لا توجد بيانات في localStorage');
        }
    } else {
        console.log('✅ تم تحميل المستخدم بنجاح:', currentUser.username, 'النوع:', currentUser.role);
    }

    // قائمة الصفحات المحمية (جميع الصفحات عدا تسجيل الدخول)
    const protectedPages = ['index.html', 'times.html', 'booking.html', 'admin.html', ''];
    const currentPageName = currentPage || 'index.html';

    console.log('فحص الصفحة:', currentPageName, 'المستخدم:', currentUser);

    // إذا كان المستخدم في صفحة محمية وغير مسجل دخول
    if (protectedPages.includes(currentPageName) && !currentUser) {
        console.log('❌ الصفحة محمية والمستخدم غير مسجل دخول');
        console.log('📄 الصفحة:', currentPageName);
        console.log('👤 المستخدم:', currentUser);
        console.log('🔄 إعادة توجيه لتسجيل الدخول...');

        showAuthToast('يجب تسجيل الدخول للوصول للموقع', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return;
    } else if (currentUser) {
        console.log('✅ المستخدم مسجل دخول بنجاح');
        console.log('👤 الاسم:', currentUser.fullName);
        console.log('🔑 النوع:', currentUser.role);
        console.log('📄 الصفحة:', currentPageName);
    }

    // إذا كان المستخدم في صفحة الإدارة
    if (currentPageName === 'admin.html') {
        if (!currentUser) {
            console.log('صفحة الإدارة: المستخدم غير مسجل دخول');
            window.location.href = 'login.html';
            return;
        } else if (!isAdmin(currentUser)) {
            console.log('صفحة الإدارة: المستخدم ليس مشرف');
            showAuthToast('ليس لديك صلاحية للوصول لهذه الصفحة', 'error');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            return;
        }
        console.log('صفحة الإدارة: المستخدم مشرف، السماح بالوصول');
    }

    // إذا كان المستخدم في صفحة تسجيل الدخول وهو مسجل دخول بالفعل
    if (currentPageName === 'login.html' && currentUser) {
        console.log('المستخدم مسجل دخول بالفعل، إعادة توجيه');
        if (currentUser.role === 'admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'index.html';
        }
    }
}

// التحقق من كون المستخدم مشرف
function isAdmin(user) {
    return user && user.role === 'admin';
}

// تحديث واجهة المستخدم حسب حالة المصادقة
function updateUIBasedOnAuth(user) {
    const currentPage = window.location.pathname.split('/').pop();

    console.log('تحديث واجهة المستخدم للصفحة:', currentPage, 'المستخدم:', user);

    // تحديث شريط التنقل في جميع الصفحات عدا تسجيل الدخول
    if (currentPage !== 'login.html') {
        updateNavbar(user);
    }
}

// تحديث شريط التنقل
function updateNavbar(user) {
    console.log('تحديث شريط التنقل، المستخدم:', user);

    // البحث عن عنصر التنقل - دعم الهيكل الجديد والقديم
    let navbar = document.querySelector('#navbarNav .navbar-nav');
    if (!navbar) {
        navbar = document.querySelector('.navbar-nav');
    }

    if (!navbar) {
        console.log('لم يتم العثور على شريط التنقل');
        return;
    }

    console.log('تم العثور على شريط التنقل');

    // إزالة عناصر المصادقة الموجودة
    const existingAuthItems = navbar.querySelectorAll('.auth-item');
    existingAuthItems.forEach(item => item.remove());
    console.log('تم إزالة العناصر القديمة:', existingAuthItems.length);

    if (user) {
        console.log('إضافة عناصر المستخدم المسجل');

        // المستخدم مسجل دخول
        const userInfo = document.createElement('li');
        userInfo.className = 'nav-item auth-item';
        userInfo.innerHTML = `
            <span class="nav-link text-white">
                <i class="fas fa-user me-1"></i>
                ${user.fullName}
            </span>
        `;

        const logoutItem = document.createElement('li');
        logoutItem.className = 'nav-item auth-item';
        logoutItem.innerHTML = `
            <a class="nav-link" href="#" onclick="handleLogout()">
                <i class="fas fa-sign-out-alt me-1"></i>
                تسجيل الخروج
            </a>
        `;

        navbar.appendChild(userInfo);
        navbar.appendChild(logoutItem);

        // إضافة رابط الإدارة للمشرفين
        if (isAdmin(user)) {
            console.log('إضافة رابط الإدارة للمشرف');
            const adminItem = document.createElement('li');
            adminItem.className = 'nav-item auth-item';
            adminItem.innerHTML = `
                <a class="nav-link" href="admin.html">
                    <i class="fas fa-cog me-1"></i>
                    لوحة التحكم
                </a>
            `;
            navbar.insertBefore(adminItem, logoutItem);
        }
    } else {
        console.log('إضافة رابط تسجيل الدخول');

        // المستخدم غير مسجل دخول
        const loginItem = document.createElement('li');
        loginItem.className = 'nav-item auth-item';
        loginItem.innerHTML = `
            <a class="nav-link" href="login.html">
                <i class="fas fa-sign-in-alt me-1"></i>
                تسجيل الدخول
            </a>
        `;

        navbar.appendChild(loginItem);
    }

    console.log('تم الانتهاء من تحديث شريط التنقل');
}

// تسجيل الخروج
function handleLogout() {
    clearCurrentUser();
    showAuthToast('تم تسجيل الخروج بنجاح', 'success');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
}

// عرض حالة التحميل
function showLoadingState(formType, isLoading) {
    const textElement = document.querySelector(`.${formType}-text`);
    const spinnerElement = document.querySelector('.loading-spinner');
    const submitButton = document.querySelector(`#${formType}FormElement button[type="submit"]`);

    if (textElement && spinnerElement && submitButton) {
        if (isLoading) {
            textElement.style.display = 'none';
            spinnerElement.style.display = 'inline';
            submitButton.disabled = true;
        } else {
            textElement.style.display = 'inline';
            spinnerElement.style.display = 'none';
            submitButton.disabled = false;
        }
    }
}

// عرض رسائل التنبيه للمصادقة
function showAuthToast(message, type = 'info') {
    const toastElement = document.getElementById('alertToast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (!toastElement || !toastMessage) return;
    
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

// ترجمة رسائل خطأ Firebase
function getAuthErrorMessage(errorCode) {
    switch (errorCode) {
        case 'auth/user-not-found':
            return 'البريد الإلكتروني غير مسجل';
        case 'auth/wrong-password':
            return 'كلمة المرور غير صحيحة';
        case 'auth/email-already-in-use':
            return 'البريد الإلكتروني مستخدم بالفعل';
        case 'auth/weak-password':
            return 'كلمة المرور ضعيفة جداً';
        case 'auth/invalid-email':
            return 'البريد الإلكتروني غير صحيح';
        case 'auth/too-many-requests':
            return 'تم تجاوز عدد المحاولات المسموح. حاول لاحقاً';
        default:
            return 'حدث خطأ غير متوقع. حاول مرة أخرى';
    }
}

// التبديل بين نماذج تسجيل الدخول والتسجيل
function showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
}

function showRegisterForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
}

console.log('نظام المصادقة تم تحميله بنجاح');
