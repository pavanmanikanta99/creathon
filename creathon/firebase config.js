// ═══════════════════════════════════════════════
//  firebase-config.js — Firebase Initialization
// ═══════════════════════════════════════════════

const firebaseConfig = {
    apiKey: "AIzaSyBURRjH5aDdRWIE7gwvqnTVaz9KmfMzAX0",
    authDomain: "canteen-68a95.firebaseapp.com",
    projectId: "canteen-68a95",
    storageBucket: "canteen-68a95.firebasestorage.app",
    messagingSenderId: "434413900914",
    appId: "1:434413900914:web:5535905803eafe7445deeb",
    measurementId: "G-LYC1QKYCF0"
};


// Initialize Firebase (compat SDK, works with plain HTML/JS)
firebase.initializeApp(firebaseConfig);

// Firestore database reference
const db = firebase.firestore();

// Analytics (optional, tracks page usage)
const analytics = firebase.analytics();

console.log("✅ Firebase initialized successfully");