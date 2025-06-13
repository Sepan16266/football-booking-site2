# 🔥 دليل إعداد Firebase خطوة بخطوة

## الخطوة 1: إنشاء مشروع Firebase

### 1.1 الدخول إلى Firebase Console
- اذهب إلى: https://console.firebase.google.com/
- سجل دخول بحساب Google الخاص بك

### 1.2 إنشاء مشروع جديد
1. اضغط على **"Create a project"** أو **"إنشاء مشروع"**
2. أدخل اسم المشروع (مثل: `ma3ab-booking`)
3. اختر ما إذا كنت تريد تفعيل Google Analytics (اختياري)
4. اختر البلد/المنطقة
5. اضغط **"Create project"**
6. انتظر حتى يتم إنشاء المشروع

---

## الخطوة 2: إعداد Firestore Database

### 2.1 إنشاء قاعدة البيانات
1. في لوحة تحكم Firebase، من القائمة الجانبية اضغط على **"Firestore Database"**
2. اضغط **"Create database"**

### 2.2 اختيار وضع الأمان
1. اختر **"Start in test mode"** (للتجربة والتطوير)
2. اضغط **"Next"**

> ⚠️ **تنبيه**: وضع الاختبار يسمح بالقراءة والكتابة لأي شخص. استخدمه فقط للتطوير.

### 2.3 اختيار الموقع الجغرافي
1. اختر أقرب موقع جغرافي لك (مثل: `europe-west3` للشرق الأوسط)
2. اضغط **"Done"**

---

## الخطوة 3: الحصول على إعدادات المشروع

### 3.1 إضافة تطبيق ويب
1. في لوحة تحكم Firebase، اضغط على أيقونة الترس ⚙️ بجانب **"Project Overview"**
2. اختر **"Project settings"**
3. انتقل إلى قسم **"Your apps"**
4. اضغط على أيقونة الويب `</>`

### 3.2 تسجيل التطبيق
1. أدخل اسم التطبيق (مثل: `ma3ab-web`)
2. **لا تحدد** "Also set up Firebase Hosting" (غير مطلوب)
3. اضغط **"Register app"**

### 3.3 نسخ إعدادات Firebase
ستظهر لك شاشة تحتوي على إعدادات Firebase. انسخ الكود الذي يبدو مثل هذا:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "ma3ab-booking.firebaseapp.com",
  projectId: "ma3ab-booking",
  storageBucket: "ma3ab-booking.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

---

## الخطوة 4: تحديث ملف firebase-config.js

### 4.1 فتح الملف
افتح ملف `firebase-config.js` في محرر النصوص

### 4.2 استبدال الإعدادات
استبدل الإعدادات الموجودة بالإعدادات التي نسختها من Firebase:

```javascript
// إعدادات Firebase - استبدل هذه بإعداداتك الخاصة من Firebase Console
const firebaseConfig = {
    apiKey: "ضع هنا API Key الخاص بك",
    authDomain: "ضع هنا Auth Domain الخاص بك",
    projectId: "ضع هنا Project ID الخاص بك",
    storageBucket: "ضع هنا Storage Bucket الخاص بك",
    messagingSenderId: "ضع هنا Messaging Sender ID الخاص بك",
    appId: "ضع هنا App ID الخاص بك"
};
```

### 4.3 حفظ الملف
احفظ الملف بعد التعديل

---

## الخطوة 5: إعداد قواعد Firestore

### 5.1 الانتقال إلى قواعد البيانات
1. في Firebase Console، اذهب إلى **"Firestore Database"**
2. اضغط على تبويب **"Rules"**

### 5.2 تحديث القواعد
استبدل القواعد الموجودة بهذا الكود:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // السماح بالقراءة والكتابة لمجموعة الحجوزات
    match /bookings/{document} {
      allow read, write: if true;
    }
  }
}
```

### 5.3 نشر القواعد
1. اضغط **"Publish"** لحفظ ونشر القواعد
2. انتظر حتى يتم النشر بنجاح

---

## الخطوة 6: اختبار الاتصال

### 6.1 فتح صفحة الاختبار
افتح ملف `test-firebase.html` في المتصفح

### 6.2 تشغيل الاختبارات
1. اضغط **"اختبار الاتصال"** للتحقق من الاتصال
2. اضغط **"اختبار الكتابة"** للتحقق من إمكانية حفظ البيانات
3. اضغط **"اختبار القراءة"** للتحقق من إمكانية قراءة البيانات

### 6.3 النتائج المتوقعة
- ✅ **اتصال ناجح**: Firebase متصل بنجاح
- ✅ **Firestore جاهز**: قاعدة البيانات جاهزة
- ✅ **اختبار البيانات نجح**: يمكن حفظ وقراءة البيانات

---

## الخطوة 7: اختبار الموقع

### 7.1 فتح الموقع
افتح `index.html` في المتصفح

### 7.2 تجربة الحجز
1. اختر يوم من الأيام المتاحة
2. اختر وقت من الأوقات المتاحة
3. أدخل الاسم ورقم الهاتف
4. اضغط "تأكيد الحجز"

### 7.3 التحقق من الحفظ
1. اذهب إلى `admin.html` لرؤية الحجوزات
2. أو تحقق من Firebase Console > Firestore Database

---

## 🚨 حل المشاكل الشائعة

### مشكلة: "Firebase is not defined"
**الحل**: تأكد من تحميل مكتبات Firebase قبل ملف `firebase-config.js`

### مشكلة: "Permission denied"
**الحل**: تحقق من قواعد Firestore وتأكد من السماح بالقراءة والكتابة

### مشكلة: "Project not found"
**الحل**: تأكد من صحة `projectId` في إعدادات Firebase

### مشكلة: "Invalid API key"
**الحل**: تأكد من نسخ `apiKey` بشكل صحيح من Firebase Console

---

## 🔒 ملاحظات الأمان

### للإنتاج:
1. **غيّر قواعد Firestore** لتكون أكثر أماناً
2. **فعّل المصادقة** إذا لزم الأمر
3. **استخدم متغيرات البيئة** لحماية المفاتيح الحساسة

### قواعد أمان مقترحة للإنتاج:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /bookings/{document} {
      allow read: if true;
      allow write: if request.time < timestamp.date(2025, 12, 31);
    }
  }
}
```

---

## ✅ قائمة التحقق

- [ ] إنشاء مشروع Firebase
- [ ] إعداد Firestore Database
- [ ] نسخ إعدادات Firebase
- [ ] تحديث ملف `firebase-config.js`
- [ ] إعداد قواعد Firestore
- [ ] اختبار الاتصال
- [ ] اختبار الحجز
- [ ] التحقق من حفظ البيانات

---

🎉 **تهانينا!** إذا اجتزت جميع الخطوات، فإن موقعك الآن متصل بـ Firebase ويمكنه حفظ الحجوزات!
